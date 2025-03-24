import React from 'react';

const OptionsPanel = ({ options, onChange, onThemeChange, theme, onAnalyze, loading }) => {
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    onChange({ ...options, [name]: checked });
  };

  const handleThemeChange = (e) => {
    onThemeChange(e.target.value);
  };

  return (
    <div className="options-panel">
      <h4>Editor Theme</h4>
      <div className="mb-3">
        <select 
          className="form-select" 
          value={theme} 
          onChange={handleThemeChange}
        >
          <option value="default">Default</option>
          <option value="material">Material</option>
          <option value="monokai">Monokai</option>
          <option value="dracula">Dracula</option>
          <option value="eclipse">Eclipse</option>
          <option value="solarized">Solarized</option>
        </select>
      </div>

      <h4>Analysis Options</h4>
      <div className="mb-3">
        <h5>Checks</h5>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="bounds_check"
            name="bounds_check"
            checked={options.bounds_check}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="bounds_check">
            Bounds Check
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="pointer_check"
            name="pointer_check"
            checked={options.pointer_check}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="pointer_check">
            Pointer Check
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="memory_leak_check"
            name="memory_leak_check"
            checked={options.memory_leak_check}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="memory_leak_check">
            Memory Leak Check
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="div_by_zero_check"
            name="div_by_zero_check"
            checked={options.div_by_zero_check}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="div_by_zero_check">
            Division by Zero Check
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="signed_overflow_check"
            name="signed_overflow_check"
            checked={options.signed_overflow_check}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="signed_overflow_check">
            Signed Overflow Check
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="unsigned_overflow_check"
            name="unsigned_overflow_check"
            checked={options.unsigned_overflow_check}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="unsigned_overflow_check">
            Unsigned Overflow Check
          </label>
        </div>
      </div>

      <div className="mb-3">
        <h5>Analysis Techniques</h5>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="intervals"
            name="intervals"
            checked={options.intervals}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="intervals">
            Intervals
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="k_induction"
            name="k_induction"
            checked={options.k_induction}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="k_induction">
            k-Induction
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="termination"
            name="termination"
            checked={options.termination}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="termination">
            Termination
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="heap"
            name="heap"
            checked={options.heap}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="heap">
            Heap
          </label>
        </div>
      </div>

      <button 
        className="btn btn-primary w-100" 
        onClick={onAnalyze}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Analyzing...
          </>
        ) : (
          'Analyze Code'
        )}
      </button>
    </div>
  );
};

export default OptionsPanel; 