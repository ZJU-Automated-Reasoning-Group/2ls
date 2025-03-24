import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import OptionsPanel from './OptionsPanel';
import ResultPanel from './ResultPanel';
import ExampleSelector from './ExampleSelector';
import Navbar from './Navbar';

const App = () => {
  const [code, setCode] = useState('// Write your C code here or select an example\n#include <stdio.h>\n\nint main() {\n  printf("Hello, World!\\n");\n  return 0;\n}');
  const [theme, setTheme] = useState('default');
  const [options, setOptions] = useState({
    bounds_check: false,
    pointer_check: false,
    memory_leak_check: false,
    div_by_zero_check: false,
    signed_overflow_check: false,
    unsigned_overflow_check: false,
    intervals: true,
    k_induction: false,
    termination: false,
    heap: false
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleOptionsChange = (newOptions) => {
    setOptions(newOptions);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, options }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="row mb-4">
          <div className="col-md-12">
            <h2>2LS Static Analyzer Web UI</h2>
            <p className="lead">
              Analyze C programs for bugs and verify properties using 2LS static analyzer.
            </p>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-12">
            <ExampleSelector onSelectExample={handleCodeChange} />
            <div className="mb-3">
              <label htmlFor="fileUpload" className="form-label">Or upload a C file:</label>
              <input 
                type="file" 
                className="form-control" 
                id="fileUpload" 
                accept=".c" 
                onChange={handleUpload} 
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <CodeEditor 
              code={code} 
              onChange={handleCodeChange} 
              theme={theme}
            />
          </div>
          <div className="col-md-4">
            <OptionsPanel 
              options={options} 
              onChange={handleOptionsChange} 
              onThemeChange={handleThemeChange}
              theme={theme}
              onAnalyze={handleAnalyze}
              loading={loading}
            />
          </div>
        </div>

        {(results || error) && (
          <div className="row mt-4">
            <div className="col-md-12">
              <ResultPanel 
                results={results} 
                error={error} 
                loading={loading} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App; 