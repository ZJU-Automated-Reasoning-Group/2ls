const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const temp = require('temp');
const multer = require('multer');

// Automatically track and clean up temporary files
temp.track();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// CWE mapping for common bugs
const cweMapping = {
  'memory_leak': {
    cwe: '401',
    description: 'Memory Leak - Failure to release memory before the end of a function can lead to resource exhaustion.'
  },
  'buffer_overflow': {
    cwe: '120',
    description: 'Buffer Overflow - Writing outside the bounds of allocated memory can lead to data corruption, crashes, or code execution.'
  },
  'null_pointer': {
    cwe: '476',
    description: 'NULL Pointer Dereference - Attempting to read from or write to memory referenced by a NULL pointer can lead to crashes or undefined behavior.'
  },
  'integer_overflow': {
    cwe: '190',
    description: 'Integer Overflow or Wraparound - When an integer value is incremented beyond its maximum value, it wraps around to a very small or negative number.'
  },
  'double_free': {
    cwe: '415',
    description: 'Double Free - Calling free() twice on the same memory address can lead to memory corruption and potentially exploitable vulnerabilities.'
  },
  'use_after_free': {
    cwe: '416',
    description: 'Use After Free - Referencing memory after it has been freed can lead to crashes or arbitrary code execution.'
  },
  'division_by_zero': {
    cwe: '369',
    description: 'Divide By Zero - Division operations where the denominator can be zero can lead to crashes or undefined behavior.'
  }
};

// Parse 2LS output to extract bug information
function parse2LSOutput(output) {
  const bugs = [];
  const lines = output.split('\\n');
  
  // Check if verification failed
  const verificationFailed = lines.some(line => line.includes('VERIFICATION FAILED'));
  
  if (verificationFailed) {
    // Look for specific failure patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Memory safety issues
      if (line.match(/\[.*\.pointer_dereference\.\d+\]/)) {
        const match = line.match(/\[(.*)\] (.*): (.*)/);
        if (match) {
          const bugType = getBugType(match[3]);
          bugs.push({
            type: 'Pointer Dereference',
            description: match[3],
            line: match[1],
            cwe: cweMapping[bugType]?.cwe,
            cwe_description: cweMapping[bugType]?.description,
            trace: extractTrace(lines, i)
          });
        }
      }
      
      // Memory leaks
      else if (line.match(/\[.*\.memory_leak\.\d+\]/)) {
        const match = line.match(/\[(.*)\] (.*): (.*)/);
        if (match) {
          bugs.push({
            type: 'Memory Leak',
            description: match[3],
            line: match[1],
            cwe: cweMapping['memory_leak']?.cwe,
            cwe_description: cweMapping['memory_leak']?.description,
            trace: extractTrace(lines, i)
          });
        }
      }
      
      // Invalid memory access
      else if (line.match(/\[.*\.valid_object\.\d+\]/)) {
        const match = line.match(/\[(.*)\] (.*): (.*)/);
        if (match) {
          const bugType = getBugType(match[3]);
          bugs.push({
            type: 'Invalid Memory Access',
            description: match[3],
            line: match[1],
            cwe: cweMapping[bugType]?.cwe,
            cwe_description: cweMapping[bugType]?.description,
            trace: extractTrace(lines, i)
          });
        }
      }
      
      // Division by zero
      else if (line.match(/\[.*\.division-by-zero\.\d+\]/)) {
        const match = line.match(/\[(.*)\] (.*): (.*)/);
        if (match) {
          bugs.push({
            type: 'Division by Zero',
            description: match[3],
            line: match[1],
            cwe: cweMapping['division_by_zero']?.cwe,
            cwe_description: cweMapping['division_by_zero']?.description,
            trace: extractTrace(lines, i)
          });
        }
      }
      
      // Integer overflow
      else if (line.match(/\[.*\.overflow\.\d+\]/)) {
        const match = line.match(/\[(.*)\] (.*): (.*)/);
        if (match) {
          bugs.push({
            type: 'Integer Overflow',
            description: match[3],
            line: match[1],
            cwe: cweMapping['integer_overflow']?.cwe,
            cwe_description: cweMapping['integer_overflow']?.description,
            trace: extractTrace(lines, i)
          });
        }
      }
      
      // Generic assertion failures
      else if (line.includes('FAILURE') && line.includes('assertion')) {
        const match = line.match(/\[(.*)\] (.*): (.*)/);
        if (match) {
          bugs.push({
            type: 'Assertion Failure',
            description: match[3],
            line: match[1],
            trace: extractTrace(lines, i)
          });
        }
      }
    }
  }
  
  return {
    status: verificationFailed ? 'success' : 'success',
    bugs: bugs,
    output: output
  };
}

// Helper function to extract a trace from the output
function extractTrace(lines, startIndex) {
  // Look for trace information after the bug line
  let trace = '';
  let i = startIndex + 1;
  
  // Skip to the beginning of the trace
  while (i < lines.length && !lines[i].includes('Trace:')) {
    i++;
  }
  
  // If we found a trace, extract it
  if (i < lines.length && lines[i].includes('Trace:')) {
    i++; // Move to the first line of the trace
    while (i < lines.length && lines[i].trim() !== '') {
      trace += lines[i] + '\\n';
      i++;
    }
  }
  
  return trace.trim();
}

// Helper function to determine the bug type from the description
function getBugType(description) {
  if (description.includes('memory leak')) {
    return 'memory_leak';
  } else if (description.includes('buffer overflow') || description.includes('array bounds')) {
    return 'buffer_overflow';
  } else if (description.includes('NULL') || description.includes('null pointer')) {
    return 'null_pointer';
  } else if (description.includes('integer overflow') || description.includes('arithmetic overflow')) {
    return 'integer_overflow';
  } else if (description.includes('double free')) {
    return 'double_free';
  } else if (description.includes('use after free') || description.includes('deallocated')) {
    return 'use_after_free';
  } else if (description.includes('division by zero')) {
    return 'division_by_zero';
  }
  return null;
}

// API endpoint to analyze code
app.post('/api/analyze', async (req, res) => {
  const { code, options } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }
  
  try {
    // Create a temporary file for the C code
    const tempFile = temp.path({ suffix: '.c' });
    fs.writeFileSync(tempFile, code);
    
    // Build the command with selected options
    let command = `${path.resolve(__dirname, '../../src/2ls/2ls')} `;
    
    // Add analysis options
    if (options.bounds_check) command += '--bounds-check ';
    if (options.pointer_check) command += '--pointer-check ';
    if (options.memory_leak_check) command += '--memory-leak-check ';
    if (options.div_by_zero_check) command += '--div-by-zero-check ';
    if (options.signed_overflow_check) command += '--signed-overflow-check ';
    if (options.unsigned_overflow_check) command += '--unsigned-overflow-check ';
    
    // Add analysis techniques
    if (options.intervals) command += '--intervals ';
    if (options.k_induction) command += '--k-induction ';
    if (options.termination) command += '--termination ';
    if (options.heap) command += '--heap ';
    
    // Add the file to analyze
    command += tempFile;
    
    // Execute the command
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      // Parse the output
      const results = parse2LSOutput(stdout + stderr);
      
      // Return the results
      res.json(results);
    });
  } catch (error) {
    console.error('Error analyzing code:', error);
    res.status(500).json({ error: 'Error analyzing code: ' + error.message });
  }
});

// Serve the React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Canary server running on port ${port}`);
}); 