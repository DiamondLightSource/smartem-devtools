# smartem-fsrecorder

Filesystem Recording and Replay Tool for cryo-EM development and testing.

Records all filesystem changes in a directory and can replay them elsewhere with configurable timing. Cross-platform support for Windows and Linux with diff-based incremental recording.

## Installation

### From PyPI

```bash
pip install smartem-fsrecorder
```

### From GitHub Releases (Windows executable)

Download the latest `fsrecorder-windows-vX.Y.Z.exe` from [GitHub Releases](https://github.com/DiamondLightSource/smartem-devtools/releases).

## Usage

### Recording

Record filesystem changes in a directory:

```bash
# Basic recording
fsrecorder record /path/to/watch -o recording.tar.gz

# Include binary file content (larger archives)
fsrecorder record /path/to/watch -o recording.tar.gz --no-skip-binary-content

# Force specific extensions to be treated as text/binary
fsrecorder record /path/to/watch -o recording.tar.gz \
    --force-text-extensions dm dat \
    --force-binary-extensions log
```

Press `Ctrl+C` to stop recording.

### Replaying

Replay a recording to a target directory:

```bash
# Default fast mode (100x speed, 1s max delay)
fsrecorder replay recording.tar.gz /path/to/target

# Development mode (maximum speed for smoke tests)
fsrecorder replay recording.tar.gz /path/to/target --dev-mode

# Exact timing (1x speed, original delays)
fsrecorder replay recording.tar.gz /path/to/target --exact

# Custom settings
fsrecorder replay recording.tar.gz /path/to/target --speed 50 --max-delay 2.0

# Burst mode (process events as fast as possible)
fsrecorder replay recording.tar.gz /path/to/target --burst

# Skip integrity verification
fsrecorder replay recording.tar.gz /path/to/target --no-verify

# Skip files that were unreadable during recording
fsrecorder replay recording.tar.gz /path/to/target --skip-unreadable
```

### Information

View recording metadata and statistics:

```bash
fsrecorder info recording.tar.gz
```

## Replay Modes

| Mode | Speed | Max Delay | Use Case |
|------|-------|-----------|----------|
| `--dev-mode` | 1000x + burst | 0.1s | Smoke tests, rapid iteration |
| `--fast` (default) | 100x | 1s | Integration testing |
| `--exact` | 1x | None | Timing-sensitive debugging |
| Custom | Configurable | Configurable | Specific requirements |

## Python API

```python
from smartem_fsrecorder import FSRecorder, FSReplayer

# Recording
recorder = FSRecorder(
    watch_dir="/path/to/watch",
    output_file="recording.tar.gz",
    skip_binary_content=True,
)
recorder.start_recording()  # Blocks until Ctrl+C

# Replaying
replayer = FSReplayer("recording.tar.gz", "/path/to/target")
replayer.replay(
    speed_multiplier=100.0,
    verify_integrity=True,
    max_delay=1.0,
    burst_mode=False,
)
```

## Features

- **Cross-platform**: Works on Windows and Linux
- **Diff-based recording**: Tracks appends, truncations, and modifications efficiently
- **Binary placeholder mode**: Reduces archive size by replacing binary files with placeholders
- **Integrity verification**: SHA256 hash verification during replay
- **Configurable timing**: Multiple replay speed options for different testing scenarios
- **Portable archives**: POSIX path format for cross-platform replay

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Lint
ruff check .
ruff format --check .
```

## License

Apache-2.0
