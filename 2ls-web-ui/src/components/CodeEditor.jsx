import React, { useEffect } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';

// Import CodeMirror styles
import 'codemirror/lib/codemirror.css';

// Import language mode
import 'codemirror/mode/clike/clike';

// Import themes
import 'codemirror/theme/material.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/solarized.css';

// Import addons
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/lint.css';

const CodeEditor = ({ code, onChange, theme }) => {
  const options = {
    mode: 'text/x-csrc',
    theme: theme,
    lineNumbers: true,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: {
      'Tab': (cm) => {
        if (cm.somethingSelected()) {
          cm.indentSelection('add');
        } else {
          cm.replaceSelection('  ', 'end');
        }
      }
    }
  };

  return (
    <div className="code-editor">
      <CodeMirror
        value={code}
        options={options}
        onBeforeChange={(editor, data, value) => {
          onChange(value);
        }}
      />
    </div>
  );
};

export default CodeEditor; 