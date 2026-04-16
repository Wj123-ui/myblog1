"""
Real-time plotting module for PID waveforms.
"""

import pyqtgraph as pg
import numpy as np
from collections import deque
from typing import Dict, Any
from pyqtgraph.Qt import QtCore

class RealTimePlotter:
    def __init__(self, max_points: int = 1000):
        """
        Initialize real-time plotter.
        
        Args:
            max_points: Maximum number of points to keep in history
        """
        self.max_points = max_points
        self.paused = False
        
        # Data buffers
        self.time_buffer = deque(maxlen=max_points)
        self.data_buffers = {
            'setpoint': deque(maxlen=max_points),
            'measured': deque(maxlen=max_points),
            'error': deque(maxlen=max_points),
            'p': deque(maxlen=max_points),
            'i': deque(maxlen=max_points),
            'd': deque(maxlen=max_points),
            'output': deque(maxlen=max_points)
        }
        
        # Plot items
        self.plots = {}
        self.curves = {}
        
        # Current time
        self.current_time = 0.0
        
    def setup_plots(self, plot_widget):
        """Setup plots in the provided GraphicsLayoutWidget."""
        self.plot_widget = plot_widget
        self.plot_widget.clear()
        
        # Main plot: setpoint, measured, output
        self.plots['main'] = self.plot_widget.addPlot(title="PID Control", row=0, col=0)
        self.plots['main'].setLabel('left', 'Value')
        self.plots['main'].setLabel('bottom', 'Time', 's')
        self.plots['main'].showGrid(x=True, y=True, alpha=0.3)
        self.plots['main'].addLegend()
        
        self.curves['setpoint'] = self.plots['main'].plot(
            pen=pg.mkPen(color='r', width=2), 
            name='Setpoint'
        )
        self.curves['measured'] = self.plots['main'].plot(
            pen=pg.mkPen(color='g', width=2), 
            name='Measured'
        )
        self.curves['output'] = self.plots['main'].plot(
            pen=pg.mkPen(color='b', width=1, style=QtCore.Qt.DashLine), 
            name='Output'
        )
        
        # Error plot
        self.plots['error'] = self.plot_widget.addPlot(title="Error", row=1, col=0)
        self.plots['error'].setLabel('left', 'Error')
        self.plots['error'].setLabel('bottom', 'Time', 's')
        self.plots['error'].showGrid(x=True, y=True, alpha=0.3)
        
        self.curves['error'] = self.plots['error'].plot(
            pen=pg.mkPen(color='m', width=2)
        )
        
        # PID components plot
        self.plots['pid'] = self.plot_widget.addPlot(title="PID Components", row=2, col=0)
        self.plots['pid'].setLabel('left', 'Component Value')
        self.plots['pid'].setLabel('bottom', 'Time', 's')
        self.plots['pid'].showGrid(x=True, y=True, alpha=0.3)
        self.plots['pid'].addLegend()
        
        self.curves['p'] = self.plots['pid'].plot(
            pen=pg.mkPen(color=(255, 165, 0), width=2),  # orange
            name='P'
        )
        self.curves['i'] = self.plots['pid'].plot(
            pen=pg.mkPen(color='c', width=2),  # cyan
            name='I'
        )
        self.curves['d'] = self.plots['pid'].plot(
            pen=pg.mkPen(color='y', width=2),  # yellow
            name='D'
        )
        
        # Link x-axes for synchronized scrolling
        self.plots['error'].setXLink(self.plots['main'])
        self.plots['pid'].setXLink(self.plots['main'])
        
    def update(self, data: Dict[str, float]):
        """Update plots with new data."""
        if self.paused:
            return
        
        # Extract time from data or use incremental time
        time_val = data.get('time', self.current_time)
        self.current_time = time_val
        
        # Update buffers
        self.time_buffer.append(time_val)
        for key in self.data_buffers:
            self.data_buffers[key].append(data.get(key, 0.0))
        
        # Update curves
        if len(self.time_buffer) > 0:
            time_array = np.array(self.time_buffer)
            
            # Main plot
            self.curves['setpoint'].setData(
                time_array, 
                np.array(self.data_buffers['setpoint'])
            )
            self.curves['measured'].setData(
                time_array, 
                np.array(self.data_buffers['measured'])
            )
            self.curves['output'].setData(
                time_array, 
                np.array(self.data_buffers['output'])
            )
            
            # Error plot
            self.curves['error'].setData(
                time_array, 
                np.array(self.data_buffers['error'])
            )
            
            # PID components plot
            self.curves['p'].setData(
                time_array, 
                np.array(self.data_buffers['p'])
            )
            self.curves['i'].setData(
                time_array, 
                np.array(self.data_buffers['i'])
            )
            self.curves['d'].setData(
                time_array, 
                np.array(self.data_buffers['d'])
            )
            
            # Auto-range if needed (optional)
            if len(self.time_buffer) > 10:
                self.plots['main'].enableAutoRange(axis='x', enable=True)
                self.plots['main'].enableAutoRange(axis='y', enable=True)
    
    def clear(self):
        """Clear all data buffers."""
        self.time_buffer.clear()
        for buffer in self.data_buffers.values():
            buffer.clear()
        
        # Clear curves
        for curve in self.curves.values():
            curve.clear()
        
        self.current_time = 0.0
    
    def save_data(self, filename: str):
        """Save current data to CSV file."""
        if len(self.time_buffer) == 0:
            return False
        
        try:
            import csv
            
            with open(filename, 'w', newline='') as f:
                writer = csv.writer(f)
                # Write header
                header = ['time'] + list(self.data_buffers.keys())
                writer.writerow(header)
                
                # Write data
                for i in range(len(self.time_buffer)):
                    row = [self.time_buffer[i]]
                    for key in self.data_buffers:
                        if i < len(self.data_buffers[key]):
                            row.append(self.data_buffers[key][i])
                        else:
                            row.append(0.0)
                    writer.writerow(row)
            
            return True
        except Exception as e:
            print(f"Error saving data: {e}")
            return False
    
    def load_data(self, filename: str):
        """Load data from CSV file."""
        try:
            import csv
            
            self.clear()
            
            with open(filename, 'r') as f:
                reader = csv.reader(f)
                header = next(reader)
                
                # Map column indices
                col_indices = {}
                for i, col in enumerate(header):
                    col_indices[col] = i
                
                for row in reader:
                    if len(row) < 2:
                        continue
                    
                    # Time
                    time_val = float(row[col_indices.get('time', 0)])
                    self.time_buffer.append(time_val)
                    
                    # Data columns
                    for key in self.data_buffers:
                        idx = col_indices.get(key, -1)
                        if idx >= 0 and idx < len(row):
                            self.data_buffers[key].append(float(row[idx]))
                        else:
                            self.data_buffers[key].append(0.0)
            
            # Update plots
            if len(self.time_buffer) > 0:
                self.update({})
            
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False