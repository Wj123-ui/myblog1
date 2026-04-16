# PID Serial Monitor

A Python-based serial port上位机 (host computer software) for viewing PID waveforms in real-time.

## Features

- Real-time plotting of PID control signals: setpoint, measured value, error, P/I/D components, and output
- Support for multiple data formats: JSON, CSV, Binary, and auto-detection
- Serial port configuration (port, baudrate, data format)
- Data saving and loading (CSV format)
- Pause/clear plot controls
- Adjustable display buffer size

## Requirements

- Python 3.8+
- Required packages: see `requirements.txt`

## Installation

1. Clone or download this repository.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Run the application:
   ```
   python main.py
   ```
2. Select serial port, baudrate, and data format.
3. Click "Connect" to start receiving data.
4. View real-time plots of PID waveforms.

### Data Format

The application expects PID data in one of the following formats:

#### JSON (Recommended)
```
{"time": 0.0, "setpoint": 100.0, "measured": 95.5, "error": 4.5, "p": 2.25, "i": 0.1, "d": 0.05, "output": 2.4}
```
Each JSON object should be sent as a line (terminated with newline).

#### CSV
```
0.0,100.0,95.5,4.5,2.25,0.1,0.05,2.4
```
Comma-separated values in order: time, setpoint, measured, error, p, i, d, output.

#### Binary
8 float values (32-bit little-endian) in the same order as CSV.

### Generating Test Data

A test simulator is included to generate sample PID data:

```
python test_simulator.py
```

This will output JSON-formatted data to stdout, which can be piped to a virtual serial port or used for testing.

## Screenshot

![PID Serial Monitor Screenshot](screenshot.png)

## License

MIT

## Author

Created for AIxiangmu project.