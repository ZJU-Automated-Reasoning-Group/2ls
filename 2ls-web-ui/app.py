import os
import subprocess
import tempfile
import re
from flask import Flask, request, jsonify, render_template, send_from_directory

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# CWE mapping for common bugs
CWE_MAPPING = {
    'memory_leak': {
        'cwe': '401',
        'description': 'Memory Leak - Failure to release memory before the end of a function can lead to resource exhaustion.'
    },
    'buffer_overflow': {
        'cwe': '120',
        'description': 'Buffer Overflow - Writing outside the bounds of allocated memory can lead to data corruption, crashes, or code execution.'
    },
    'null_pointer': {
        'cwe': '476',
        'description': 'NULL Pointer Dereference - Attempting to read from or write to memory referenced by a NULL pointer can lead to crashes or undefined behavior.'
    },
    'integer_overflow': {
        'cwe': '190',
        'description': 'Integer Overflow or Wraparound - When an integer value is incremented beyond its maximum value, it wraps around to a very small or negative number.'
    },
    'double_free': {
        'cwe': '415',
        'description': 'Double Free - Calling free() twice on the same memory address can lead to memory corruption and potentially exploitable vulnerabilities.'
    },
    'use_after_free': {
        'cwe': '416',
        'description': 'Use After Free - Referencing memory after it has been freed can lead to crashes or arbitrary code execution.'
    },
    'division_by_zero': {
        'cwe': '369',
        'description': 'Divide By Zero - Division operations where the denominator can be zero can lead to crashes or undefined behavior.'
    }
}

def get_bug_type(description):
    """Helper function to determine the bug type from the description"""
    if 'memory leak' in description:
        return 'memory_leak'
    elif 'buffer overflow' in description or 'array bounds' in description:
        return 'buffer_overflow'
    elif 'NULL' in description or 'null pointer' in description:
        return 'null_pointer'
    elif 'integer overflow' in description or 'arithmetic overflow' in description:
        return 'integer_overflow'
    elif 'double free' in description:
        return 'double_free'
    elif 'use after free' in description or 'deallocated' in description:
        return 'use_after_free'
    elif 'division by zero' in description:
        return 'division_by_zero'
    return None

def extract_trace(lines, start_index):
    """Helper function to extract a trace from the output"""
    trace = ''
    i = start_index + 1
    
    # Skip to the beginning of the trace
    while i < len(lines) and 'Trace:' not in lines[i]:
        i += 1
    
    # If we found a trace, extract it
    if i < len(lines) and 'Trace:' in lines[i]:
        i += 1  # Move to the first line of the trace
        while i < len(lines) and lines[i].strip() != '':
            trace += lines[i] + '\n'
            i += 1
    
    return trace.strip()

def parse_2ls_output(output):
    """Parse 2LS output to extract bug information"""
    bugs = []
    lines = output.split('\n')
    
    # Check if verification failed
    verification_failed = any('VERIFICATION FAILED' in line for line in lines)
    
    if verification_failed:
        # Look for specific failure patterns
        for i, line in enumerate(lines):
            # Memory safety issues
            if re.search(r'\[.*\.pointer_dereference\.\d+\]', line):
                match = re.search(r'\[(.*)\] (.*): (.*)', line)
                if match:
                    bug_type = get_bug_type(match.group(3))
                    bugs.append({
                        'type': 'Pointer Dereference',
                        'description': match.group(3),
                        'line': match.group(1),
                        'cwe': CWE_MAPPING.get(bug_type, {}).get('cwe'),
                        'cwe_description': CWE_MAPPING.get(bug_type, {}).get('description'),
                        'trace': extract_trace(lines, i)
                    })
            
            # Memory leaks
            elif re.search(r'\[.*\.memory_leak\.\d+\]', line):
                match = re.search(r'\[(.*)\] (.*): (.*)', line)
                if match:
                    bugs.append({
                        'type': 'Memory Leak',
                        'description': match.group(3),
                        'line': match.group(1),
                        'cwe': CWE_MAPPING.get('memory_leak', {}).get('cwe'),
                        'cwe_description': CWE_MAPPING.get('memory_leak', {}).get('description'),
                        'trace': extract_trace(lines, i)
                    })
            
            # Invalid memory access
            elif re.search(r'\[.*\.valid_object\.\d+\]', line):
                match = re.search(r'\[(.*)\] (.*): (.*)', line)
                if match:
                    bug_type = get_bug_type(match.group(3))
                    bugs.append({
                        'type': 'Invalid Memory Access',
                        'description': match.group(3),
                        'line': match.group(1),
                        'cwe': CWE_MAPPING.get(bug_type, {}).get('cwe'),
                        'cwe_description': CWE_MAPPING.get(bug_type, {}).get('description'),
                        'trace': extract_trace(lines, i)
                    })
            
            # Division by zero
            elif re.search(r'\[.*\.division-by-zero\.\d+\]', line):
                match = re.search(r'\[(.*)\] (.*): (.*)', line)
                if match:
                    bugs.append({
                        'type': 'Division by Zero',
                        'description': match.group(3),
                        'line': match.group(1),
                        'cwe': CWE_MAPPING.get('division_by_zero', {}).get('cwe'),
                        'cwe_description': CWE_MAPPING.get('division_by_zero', {}).get('description'),
                        'trace': extract_trace(lines, i)
                    })
            
            # Integer overflow
            elif re.search(r'\[.*\.overflow\.\d+\]', line):
                match = re.search(r'\[(.*)\] (.*): (.*)', line)
                if match:
                    bugs.append({
                        'type': 'Integer Overflow',
                        'description': match.group(3),
                        'line': match.group(1),
                        'cwe': CWE_MAPPING.get('integer_overflow', {}).get('cwe'),
                        'cwe_description': CWE_MAPPING.get('integer_overflow', {}).get('description'),
                        'trace': extract_trace(lines, i)
                    })
            
            # Generic assertion failures
            elif 'FAILURE' in line and 'assertion' in line:
                match = re.search(r'\[(.*)\] (.*): (.*)', line)
                if match:
                    bugs.append({
                        'type': 'Assertion Failure',
                        'description': match.group(3),
                        'line': match.group(1),
                        'trace': extract_trace(lines, i)
                    })
    
    return {
        'status': 'failed' if verification_failed else 'success',
        'bugs': bugs,
        'output': output
    }

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """API endpoint to analyze code"""
    data = request.json
    code = data.get('code', '')
    options = data.get('options', {})
    
    if not code:
        return jsonify({'error': 'No code provided'}), 400
    
    try:
        # Create a temporary file for the C code
        with tempfile.NamedTemporaryFile(suffix='.c', delete=False) as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(code.encode('utf-8'))
        
        # Build the command with selected options
        command = [os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/2ls/2ls'))]
        
        # Add analysis options
        if options.get('bounds_check'):
            command.append('--bounds-check')
        if options.get('pointer_check'):
            command.append('--pointer-check')
        if options.get('memory_leak_check'):
            command.append('--memory-leak-check')
        if options.get('div_by_zero_check'):
            command.append('--div-by-zero-check')
        if options.get('signed_overflow_check'):
            command.append('--signed-overflow-check')
        if options.get('unsigned_overflow_check'):
            command.append('--unsigned-overflow-check')
        
        # Add analysis techniques
        if options.get('intervals'):
            command.append('--intervals')
        if options.get('k_induction'):
            command.append('--k-induction')
        if options.get('termination'):
            command.append('--termination')
        if options.get('heap'):
            command.append('--heap')
        
        # Add the file to analyze
        command.append(temp_file_path)
        
        # Execute the command
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=30)
            output = result.stdout + result.stderr
            results = parse_2ls_output(output)
            
            return jsonify(results)
        except subprocess.TimeoutExpired:
            return jsonify({'error': 'Analysis timed out after 30 seconds'}), 408
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        return jsonify({'error': f'Error analyzing code: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000) 