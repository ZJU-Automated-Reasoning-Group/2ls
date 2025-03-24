import React from 'react';

const ResultPanel = ({ results, error, loading }) => {
  if (loading) {
    return (
      <div className="result-panel">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <p className="text-center mt-3">Analyzing your code. This may take a moment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-panel">
        <div className="error-message">
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const { status, bugs, output } = results;

  return (
    <div className="result-panel">
      <h4>Analysis Results</h4>
      
      {status === 'success' && bugs.length === 0 && (
        <div className="success-message">
          <p>No bugs found! Your code passed all the selected checks.</p>
        </div>
      )}

      {status === 'success' && bugs.length > 0 && (
        <div>
          <p className="error-message">Found {bugs.length} issue(s) in your code:</p>
          
          {bugs.map((bug, index) => (
            <div key={index} className="mb-4">
              <h5>Bug #{index + 1}: {bug.type}</h5>
              
              {bug.cwe && (
                <div className="cwe-info">
                  <strong>CWE: </strong> 
                  <a href={`https://cwe.mitre.org/data/definitions/${bug.cwe}.html`} target="_blank" rel="noopener noreferrer">
                    CWE-{bug.cwe}
                  </a>
                  {bug.cwe_description && (
                    <p className="mb-0 mt-1">{bug.cwe_description}</p>
                  )}
                </div>
              )}
              
              <div className="bug-explanation">
                <strong>Description: </strong>
                <p className="mb-0">{bug.description}</p>
              </div>
              
              {bug.trace && (
                <div className="bug-trace">
                  <strong>Trace:</strong>
                  <pre className="mb-0 mt-1">{bug.trace}</pre>
                </div>
              )}
              
              {bug.line && (
                <p><strong>Line:</strong> {bug.line}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {output && (
        <div className="mt-4">
          <h5>Raw Output</h5>
          <pre className="bg-light p-3 rounded" style={{ maxHeight: '300px', overflow: 'auto' }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ResultPanel; 