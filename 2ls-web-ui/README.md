# Canary

A web-based user interface for the 2LS static analyzer tool developed by ZJU Programming Languages and Automated Reasoning Group.

## Overview

Canary provides a user-friendly interface for analyzing C programs using the 2LS static analyzer. It allows users to:

- Write or upload C code
- Select from built-in example programs with common bugs
- Configure analysis options
- View analysis results with bug explanations and CWE references
- Syntax highlighting with multiple themes

## Features

- **Code Editor**: Syntax-highlighted editor for C code with multiple themes
- **Example Programs**: Pre-defined examples demonstrating common bugs
- **File Upload**: Upload C files for analysis
- **Configurable Options**: Select which checks and analysis techniques to use
- **Detailed Results**: View bug descriptions, traces, and CWE references
- **Raw Output**: Access the complete output from 2LS

## Installation

1. Make sure you have Python 3.7+ installed
2. Clone this repository
3. Create and set up the virtual environment:

```bash
# Create a Python virtual environment
python3 -m venv canary-venv

# Create helper scripts
echo "source canary-venv/bin/activate" > activate-venv.sh
chmod +x activate-venv.sh

# Activate the virtual environment
source ./activate-venv.sh

# Install dependencies
pip install -r 2ls-web-ui/requirements.txt
```

## Running

To run the application:

```bash
# Use the provided script
./run-app.sh

# Or manually
source ./activate-venv.sh
cd 2ls-web-ui
python app.py
```

The application will be available at http://localhost:3000

## Development

For development with debug mode:

```bash
source ./activate-venv.sh
cd 2ls-web-ui
export FLASK_APP=app.py
export FLASK_ENV=development
flask run --port=3000
```

## Virtual Environment

The project uses a Python virtual environment to manage dependencies:

- **Activation**: `source ./activate-venv.sh`
- **Deactivation**: `source ./deactivate-venv.sh` or simply `deactivate`
- **Running the app**: `./run-app.sh`

## Requirements

- Python 3.7+
- 2LS binary (located at `../src/2ls/2ls` relative to the web UI)

## Technologies Used

- **Frontend**: HTML, JavaScript, Bootstrap, CodeMirror
- **Backend**: Flask (Python)

## License

This project is licensed under the same license as 2LS (4-clause BSD license).

## Acknowledgments

- 2LS is developed by the [CPROVER team](http://www.cprover.org/2LS/)
- CWE references from [MITRE CWE](https://cwe.mitre.org/)
- Canary is developed and maintained by ZJU Programming Languages and Automated Reasoning Group 