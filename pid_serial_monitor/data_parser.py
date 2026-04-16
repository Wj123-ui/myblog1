"""
Data parser for PID waveform data.
Supports multiple formats: CSV, JSON, or custom binary.
"""

import re
import json
from typing import Optional, Dict, Any, List
import struct

class DataParser:
    def __init__(self, format_type: str = "json"):
        """
        Initialize parser with specified format.
        
        Args:
            format_type: "csv", "json", or "binary"
        """
        self.format_type = format_type
        self.buffer = b""
        
        # CSV format configuration
        self.csv_separator = ","
        self.csv_columns = ["time", "setpoint", "measured", "error", "p", "i", "d", "output"]
        
        # Binary format configuration
        self.binary_format = "<ffffffff"  # 8 float values: time, setpoint, measured, error, p, i, d, output
        self.binary_size = struct.calcsize(self.binary_format)
        
    def parse(self, raw_data: bytes) -> Optional[Dict[str, float]]:
        """
        Parse raw bytes into PID data dictionary.
        
        Returns:
            Dictionary with keys: time, setpoint, measured, error, p, i, d, output
            or None if parsing fails.
        """
        self.buffer += raw_data
        
        if self.format_type == "csv":
            return self._parse_csv()
        elif self.format_type == "json":
            return self._parse_json()
        elif self.format_type == "binary":
            return self._parse_binary()
        else:
            return self._parse_auto()
    
    def _parse_csv(self) -> Optional[Dict[str, float]]:
        """Parse CSV formatted data."""
        # Look for complete lines
        lines = self.buffer.split(b'\n')
        if len(lines) < 2:
            return None  # No complete line yet
        
        # Keep the last incomplete line in buffer
        self.buffer = lines[-1]
        
        for line in lines[:-1]:
            line = line.strip()
            if not line:
                continue
                
            try:
                text = line.decode('utf-8', errors='ignore')
                # Remove any non-printable characters
                text = re.sub(r'[^\x20-\x7E]', '', text)
                
                # Split by separator
                parts = [p.strip() for p in text.split(self.csv_separator)]
                
                # Try to convert to floats
                values = []
                for part in parts:
                    try:
                        values.append(float(part))
                    except ValueError:
                        # If conversion fails, try to extract numbers from string
                        nums = re.findall(r'[-+]?\d*\.\d+|\d+', part)
                        if nums:
                            values.append(float(nums[0]))
                        else:
                            values.append(0.0)
                
                # Ensure we have at least some values
                if len(values) >= 2:  # At least time and one value
                    result = {}
                    for i, col in enumerate(self.csv_columns):
                        if i < len(values):
                            result[col] = values[i]
                        else:
                            result[col] = 0.0
                    return result
                    
            except (UnicodeDecodeError, ValueError) as e:
                print(f"CSV parsing error: {e}")
                continue
        
        return None
    
    def _parse_json(self) -> Optional[Dict[str, float]]:
        """Parse JSON formatted data."""
        # Try to find complete JSON object
        text = self.buffer.decode('utf-8', errors='ignore')
        
        # Look for {...} pattern
        start = text.find('{')
        end = text.find('}')
        
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1]
            self.buffer = self.buffer[end+1:]  # Remove processed part
            
            try:
                data = json.loads(json_str)
                # Convert to standard format
                result = {}
                for col in self.csv_columns:
                    result[col] = data.get(col, 0.0)
                return result
            except json.JSONDecodeError:
                pass
        
        return None
    
    def _parse_binary(self) -> Optional[Dict[str, float]]:
        """Parse binary formatted data."""
        if len(self.buffer) < self.binary_size:
            return None
        
        try:
            data = self.buffer[:self.binary_size]
            self.buffer = self.buffer[self.binary_size:]
            
            values = struct.unpack(self.binary_format, data)
            
            result = {}
            for i, col in enumerate(self.csv_columns):
                if i < len(values):
                    result[col] = values[i]
                else:
                    result[col] = 0.0
            return result
            
        except struct.error as e:
            print(f"Binary parsing error: {e}")
            # Clear buffer on error
            self.buffer = b""
            return None
    
    def _parse_auto(self) -> Optional[Dict[str, float]]:
        """Auto-detect format and parse."""
        # Try binary first
        if len(self.buffer) >= self.binary_size:
            result = self._parse_binary()
            if result:
                return result
        
        # Try JSON
        result = self._parse_json()
        if result:
            return result
        
        # Try CSV
        result = self._parse_csv()
        if result:
            return result
        
        return None
    
    def set_format(self, format_type: str):
        """Change parsing format."""
        self.format_type = format_type
        
    def clear_buffer(self):
        """Clear internal buffer."""
        self.buffer = b""