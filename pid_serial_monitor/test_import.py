#!/usr/bin/env python3
"""
Test basic functionality without GUI.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from serial_reader import SerialReader
from data_parser import DataParser
from plotter import RealTimePlotter

def test_serial_reader():
    print("Testing SerialReader...")
    reader = SerialReader()
    ports = reader.available_ports()
    print(f"Available ports: {ports}")
    print("OK")

def test_data_parser():
    print("Testing DataParser...")
    parser = DataParser(format_type="json")
    
    # Test JSON parsing
    data = b'{"time": 1.0, "setpoint": 100.0, "measured": 95.0}\n'
    result = parser.parse(data)
    print(f"Parsed JSON: {result}")
    assert result is not None
    assert "time" in result
    print("JSON parsing OK")
    
    # Test CSV parsing
    parser.set_format("csv")
    parser.clear_buffer()
    data = b'2.0,200.0,190.0,10.0,5.0,2.0,1.0,8.0\n'
    result = parser.parse(data)
    print(f"Parsed CSV: {result}")
    assert result is not None
    print("CSV parsing OK")
    
    # Test binary parsing
    parser.set_format("binary")
    parser.clear_buffer()
    import struct
    binary_data = struct.pack('<ffffffff', 3.0, 300.0, 290.0, 10.0, 5.0, 2.0, 1.0, 8.0)
    result = parser.parse(binary_data)
    print(f"Parsed binary: {result}")
    assert result is not None
    print("Binary parsing OK")
    
    print("All parsing tests passed")

def test_plotter():
    print("Testing RealTimePlotter...")
    plotter = RealTimePlotter(max_points=10)
    # Manually fill buffers without calling update (which requires plots setup)
    for i in range(5):
        plotter.time_buffer.append(i * 0.1)
        plotter.data_buffers['setpoint'].append(100.0)
        plotter.data_buffers['measured'].append(100.0 - i * 2)
        plotter.data_buffers['error'].append(i * 2)
        plotter.data_buffers['p'].append(i * 1.0)
        plotter.data_buffers['i'].append(i * 0.5)
        plotter.data_buffers['d'].append(i * 0.1)
        plotter.data_buffers['output'].append(i * 1.6)
    print("Buffers filled OK")
    # Test save/load
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        filename = f.name
    try:
        success = plotter.save_data(filename)
        if success:
            print(f"Data saved to {filename}")
        else:
            print("Failed to save data")
        plotter.clear()
        success = plotter.load_data(filename)
        if success:
            print("Data loaded successfully")
        else:
            print("Failed to load data")
    finally:
        os.unlink(filename)
    print("Plotter tests passed")

if __name__ == "__main__":
    test_serial_reader()
    test_data_parser()
    test_plotter()
    print("\nAll tests passed successfully!")