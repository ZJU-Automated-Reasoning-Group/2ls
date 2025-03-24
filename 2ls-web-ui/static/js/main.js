// Initialize CodeMirror
let editor;
let currentTheme = 'default';

// Example programs
const examples = {
    'buffer-overflow': `#include <stdio.h>
#include <string.h>

int main() {
    char buffer[10];
    char source[] = "This string is too long for the buffer";
    
    // Buffer overflow vulnerability
    strcpy(buffer, source);
    
    printf("Buffer content: %s\\n", buffer);
    return 0;
}`,
    'memory-leak': `#include <stdlib.h>

void leak_memory() {
    int *ptr = (int*) malloc(sizeof(int) * 10);
    // Memory leak: no free()
}

int main() {
    leak_memory();
    return 0;
}`,
    'null-pointer': `#include <stdlib.h>
#include <stdio.h>

int main() {
    int *ptr = NULL;
    
    // Null pointer dereference
    *ptr = 42;
    
    printf("Value: %d\\n", *ptr);
    return 0;
}`,
    'use-after-free': `#include <stdlib.h>
#include <stdio.h>

int main() {
    int *ptr = (int*) malloc(sizeof(int));
    *ptr = 42;
    
    free(ptr);
    
    // Use after free
    *ptr = 100;
    printf("Value: %d\\n", *ptr);
    
    return 0;
}`,
    'integer-overflow': `#include <stdio.h>
#include <limits.h>

int main() {
    int a = INT_MAX;
    
    // Integer overflow
    a = a + 1;
    
    printf("Value after overflow: %d\\n", a);
    return 0;
}`,
    'division-by-zero': `#include <stdio.h>

int main() {
    int a = 10;
    int b = 0;
    
    // Division by zero
    int result = a / b;
    
    printf("Result: %d\\n", result);
    return 0;
}`,
    'double-free': `#include <stdlib.h>

int main() {
    int *ptr = (int*) malloc(sizeof(int));
    
    free(ptr);
    // Double free
    free(ptr);
    
    return 0;
}`
};

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    editor = CodeMirror(document.getElementById('code-editor'), {
        mode: 'text/x-csrc',
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
        value: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
    });

    // Set up theme selector
    document.getElementById('theme-selector').addEventListener('change', (e) => {
        const theme = e.target.value;
        if (theme === 'default') {
            editor.setOption('theme', null);
        } else {
            editor.setOption('theme', theme);
        }
        currentTheme = theme;
    });

    // Load example button
    document.getElementById('load-example-btn').addEventListener('click', () => {
        const selectedExample = document.getElementById('example-selector').value;
        if (selectedExample && examples[selectedExample]) {
            editor.setValue(examples[selectedExample]);
        }
    });

    // Upload file button
    document.getElementById('upload-file-btn').addEventListener('click', () => {
        const fileInput = document.getElementById('file-upload');
        fileInput.click();
    });

    // File input change handler
    document.getElementById('file-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                editor.setValue(event.target.result);
            };
            reader.readAsText(file);
        }
    });

    // Analyze button
    document.getElementById('analyze-btn').addEventListener('click', () => {
        const code = editor.getValue();
        if (!code.trim()) {
            alert('Please enter some code to analyze.');
            return;
        }

        // Show loading state
        document.getElementById('analyze-btn').disabled = true;
        document.getElementById('analyze-btn').textContent = 'Analyzing...';
        document.getElementById('formatted-results').innerHTML = '<p class="text-muted">Analyzing code...</p>';

        // Gather options
        const options = {
            bounds_check: document.getElementById('bounds-check').checked,
            pointer_check: document.getElementById('pointer-check').checked,
            memory_leak_check: document.getElementById('memory-leak-check').checked,
            div_by_zero_check: document.getElementById('div-by-zero-check').checked,
            signed_overflow_check: document.getElementById('signed-overflow-check').checked,
            unsigned_overflow_check: document.getElementById('unsigned-overflow-check').checked,
            intervals: document.getElementById('intervals').checked,
            k_induction: document.getElementById('k-induction').checked,
            termination: document.getElementById('termination').checked,
            heap: document.getElementById('heap').checked
        };

        // Send analysis request
        fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, options })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button
            document.getElementById('analyze-btn').disabled = false;
            document.getElementById('analyze-btn').textContent = 'Analyze';

            // Display results
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('analyze-btn').disabled = false;
            document.getElementById('analyze-btn').textContent = 'Analyze';
            document.getElementById('formatted-results').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        });
    });

    // Toggle raw output
    document.getElementById('raw-output-toggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.getElementById('formatted-results').style.display = 'none';
            document.getElementById('raw-output').style.display = 'block';
        } else {
            document.getElementById('formatted-results').style.display = 'block';
            document.getElementById('raw-output').style.display = 'none';
        }
    });
});

// Function to display analysis results
function displayResults(data) {
    const formattedResults = document.getElementById('formatted-results');
    const rawOutput = document.getElementById('raw-output');

    // Set raw output
    rawOutput.innerHTML = `<pre>${escapeHtml(data.output)}</pre>`;

    // Format and display results
    if (data.error) {
        formattedResults.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        return;
    }

    if (data.bugs && data.bugs.length > 0) {
        // Display bugs
        let resultsHtml = `<div class="alert alert-danger mb-3">Found ${data.bugs.length} issue${data.bugs.length > 1 ? 's' : ''}!</div>`;
        
        data.bugs.forEach(bug => {
            resultsHtml += `
            <div class="bug-item">
                <div class="bug-title">
                    <span class="bug-line">Line ${bug.line}</span>
                    ${bug.type}
                </div>
                <div class="bug-description">${bug.description}</div>
                ${bug.cwe ? `<div class="bug-cwe">CWE-${bug.cwe}: ${bug.cwe_description}</div>` : ''}
                ${bug.trace ? `<div class="bug-trace">${escapeHtml(bug.trace)}</div>` : ''}
            </div>`;
        });
        
        formattedResults.innerHTML = resultsHtml;
    } else {
        // No bugs found
        formattedResults.innerHTML = `<div class="alert alert-success">No issues found. The code passed all enabled checks!</div>`;
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
} 