"""
Serial port communication module for reading PID data.
"""

import serial
import serial.tools.list_ports
from typing import Optional, List

class SerialReader:
    def __init__(self):
        self.serial_port: Optional[serial.Serial] = None
        
    def available_ports(self) -> List[str]:
        """Return list of available serial port names."""
        ports = serial.tools.list_ports.comports()
        return [port.device for port in ports]
    
    def connect(self, port: str, baudrate: int = 115200) -> bool:
        """Connect to the specified serial port."""
        try:
            self.serial_port = serial.Serial(
                port=port,
                baudrate=baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=1.0
            )
            return True
        except (serial.SerialException, OSError) as e:
            print(f"Serial connection error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from serial port."""
        if self.serial_port and self.serial_port.is_open:
            self.serial_port.close()
        self.serial_port = None
    
    def is_connected(self) -> bool:
        """Check if serial port is connected."""
        return self.serial_port is not None and self.serial_port.is_open
    
    def read(self) -> Optional[bytes]:
        """Read available data from serial port."""
        if not self.is_connected():
            return None
        
        try:
            # Read all available bytes
            assert self.serial_port is not None
            if self.serial_port.in_waiting > 0:
                data = self.serial_port.read(self.serial_port.in_waiting)
                return data
        except (serial.SerialException, OSError) as e:
            print(f"Serial read error: {e}")
            self.disconnect()
        
        return None
    
    def write(self, data: bytes) -> bool:
        """Write data to serial port."""
        if not self.is_connected():
            return False
        
        try:
            assert self.serial_port is not None
            self.serial_port.write(data)
            return True
        except (serial.SerialException, OSError) as e:
            print(f"Serial write error: {e}")
            self.disconnect()
            return False
    
    def flush(self):
        """Flush serial buffers."""
        if self.serial_port:
            self.serial_port.reset_input_buffer()
            self.serial_port.reset_output_buffer()