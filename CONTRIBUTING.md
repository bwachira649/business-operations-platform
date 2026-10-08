# Contributing to OpsFlow

Thank you for your interest in contributing to OpsFlow.

## Development Setup

1. Clone the repository.
2. Create and activate a Python virtual environment.
3. Install the project dependencies.
4. Run the test suite before making changes.

Windows:

    py -3.14 -m venv .venv
    .\.venv\Scripts\Activate.ps1
    python -m pip install --upgrade pip
    pip install -e .

Linux/macOS:

    python3 -m venv .venv
    source .venv/bin/activate
    python -m pip install --upgrade pip
    pip install -e .

## Quality Checks

Run:

    ruff check .
    pytest -q

Please ensure both checks pass before submitting a pull request.

## Pull Requests

- Keep changes focused and understandable.
- Add or update tests when behavior changes.
- Update documentation when appropriate.
- Do not commit secrets, credentials, local databases, or environment-specific configuration.
- Describe what changed and how it was tested.

## Issues

Use the GitHub issue templates when reporting bugs or requesting features.
