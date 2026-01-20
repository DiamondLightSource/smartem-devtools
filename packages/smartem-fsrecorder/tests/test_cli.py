import subprocess
import sys


def test_cli_help():
    result = subprocess.run(
        [sys.executable, "-m", "smartem_fsrecorder", "--help"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "Filesystem Recording and Replay Tool" in result.stdout


def test_cli_record_help():
    result = subprocess.run(
        [sys.executable, "-m", "smartem_fsrecorder", "record", "--help"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "directory" in result.stdout.lower()
    assert "--output" in result.stdout


def test_cli_replay_help():
    result = subprocess.run(
        [sys.executable, "-m", "smartem_fsrecorder", "replay", "--help"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "recording" in result.stdout.lower()
    assert "--dev-mode" in result.stdout
    assert "--fast" in result.stdout
    assert "--exact" in result.stdout


def test_cli_info_help():
    result = subprocess.run(
        [sys.executable, "-m", "smartem_fsrecorder", "info", "--help"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "recording" in result.stdout.lower()


def test_module_import():
    from smartem_fsrecorder import FSEvent, FSRecorder, FSReplayer, __version__

    assert __version__ == "1.0.0"
    assert FSEvent is not None
    assert FSRecorder is not None
    assert FSReplayer is not None
