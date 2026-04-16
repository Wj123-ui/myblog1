#!/usr/bin/env python3
"""
PID Serial Monitor - A GUI application for viewing PID waveforms via serial port.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QPushButton, QComboBox, QSpinBox,
                             QLabel, QGroupBox, QTextEdit, QCheckBox, QGridLayout)
from PyQt5.QtCore import QTimer, Qt
import pyqtgraph as pg
import numpy as np

from serial_reader import SerialReader
from data_parser import DataParser
from plotter import RealTimePlotter

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("PID Serial Monitor")
        self.setGeometry(100, 100, 1200, 800)
        
        self.serial_reader = SerialReader()
        self.data_parser = DataParser()
        self.plotter = RealTimePlotter()
        
        self.init_ui()
        self.init_serial()
        self.init_plot()
        
        # Timer for updating plots
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_plots)
        self.timer.start(50)  # 20 Hz update rate
        
    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout()
        central_widget.setLayout(main_layout)
        
        # Left panel for controls
        left_panel = QWidget()
        left_layout = QVBoxLayout()
        left_panel.setLayout(left_layout)
        
        # Serial port group
        serial_group = QGroupBox("Serial Port")
        serial_layout = QGridLayout()
        serial_group.setLayout(serial_layout)
        
        serial_layout.addWidget(QLabel("Port:"), 0, 0)
        self.port_combo = QComboBox()
        serial_layout.addWidget(self.port_combo, 0, 1)
        
        serial_layout.addWidget(QLabel("Baudrate:"), 1, 0)
        self.baud_combo = QComboBox()
        self.baud_combo.addItems(["9600", "19200", "38400", "57600", "115200", "230400", "460800", "921600"])
        self.baud_combo.setCurrentText("115200")
        serial_layout.addWidget(self.baud_combo, 1, 1)
        
        serial_layout.addWidget(QLabel("Format:"), 2, 0)
        self.format_combo = QComboBox()
        self.format_combo.addItems(["JSON", "CSV", "Binary", "Auto"])
        self.format_combo.setCurrentText("JSON")
        self.format_combo.currentTextChanged.connect(self.change_format)
        serial_layout.addWidget(self.format_combo, 2, 1)
        
        self.connect_btn = QPushButton("Connect")
        self.connect_btn.clicked.connect(self.toggle_connection)
        serial_layout.addWidget(self.connect_btn, 3, 0, 1, 2)
        
        left_layout.addWidget(serial_group)
        
        # Data display group
        data_group = QGroupBox("Data")
        data_layout = QVBoxLayout()
        data_group.setLayout(data_layout)
        
        self.data_text = QTextEdit()
        self.data_text.setReadOnly(True)
        self.data_text.setMaximumHeight(150)
        data_layout.addWidget(self.data_text)
        
        left_layout.addWidget(data_group)
        
        # Plot controls group
        plot_control_group = QGroupBox("Plot Controls")
        plot_control_layout = QVBoxLayout()
        plot_control_group.setLayout(plot_control_layout)
        
        self.clear_btn = QPushButton("Clear Plots")
        self.clear_btn.clicked.connect(self.clear_plots)
        plot_control_layout.addWidget(self.clear_btn)
        
        self.pause_btn = QPushButton("Pause")
        self.pause_btn.setCheckable(True)
        self.pause_btn.clicked.connect(self.toggle_pause)
        plot_control_layout.addWidget(self.pause_btn)
        
        self.save_btn = QPushButton("Save Data")
        self.save_btn.clicked.connect(self.save_data)
        plot_control_layout.addWidget(self.save_btn)
        
        self.load_btn = QPushButton("Load Data")
        self.load_btn.clicked.connect(self.load_data)
        plot_control_layout.addWidget(self.load_btn)
        
        left_layout.addWidget(plot_control_group)
        
        left_layout.addStretch()
        main_layout.addWidget(left_panel, 1)
        
        # Right panel for plots
        right_panel = QWidget()
        right_layout = QVBoxLayout()
        right_panel.setLayout(right_layout)
        
        self.plot_widget = pg.GraphicsLayoutWidget()
        right_layout.addWidget(self.plot_widget)
        
        main_layout.addWidget(right_panel, 3)
        
    def init_serial(self):
        # Populate available serial ports
        ports = self.serial_reader.available_ports()
        self.port_combo.addItems(ports)
        
    def init_plot(self):
        self.plotter.setup_plots(self.plot_widget)
        
    def toggle_connection(self):
        if self.serial_reader.is_connected():
            self.serial_reader.disconnect()
            self.connect_btn.setText("Connect")
            self.data_text.append("Disconnected from serial port.")
        else:
            port = self.port_combo.currentText()
            baud = int(self.baud_combo.currentText())
            if self.serial_reader.connect(port, baud):
                self.connect_btn.setText("Disconnect")
                self.data_text.append(f"Connected to {port} at {baud} baud.")
            else:
                self.data_text.append(f"Failed to connect to {port}.")
                
    def change_format(self, format_name):
        """Change data parser format."""
        format_map = {
            "JSON": "json",
            "CSV": "csv", 
            "Binary": "binary",
            "Auto": "auto"
        }
        self.data_parser.set_format(format_map.get(format_name, "json"))
        self.data_parser.clear_buffer()
        self.data_text.append(f"Format changed to {format_name}")
        
    def save_data(self):
        """Save current data to CSV file."""
        from PyQt5.QtWidgets import QFileDialog
        filename, _ = QFileDialog.getSaveFileName(
            self, "Save Data", "", "CSV Files (*.csv);;All Files (*)"
        )
        if filename:
            if self.plotter.save_data(filename):
                self.data_text.append(f"Data saved to {filename}")
            else:
                self.data_text.append("Failed to save data")
                
    def load_data(self):
        """Load data from CSV file."""
        from PyQt5.QtWidgets import QFileDialog
        filename, _ = QFileDialog.getOpenFileName(
            self, "Load Data", "", "CSV Files (*.csv);;All Files (*)"
        )
        if filename:
            if self.plotter.load_data(filename):
                self.data_text.append(f"Data loaded from {filename}")
            else:
                self.data_text.append("Failed to load data")
        
    def toggle_pause(self):
        self.plotter.paused = self.pause_btn.isChecked()
        
    def clear_plots(self):
        self.plotter.clear()
        
    def update_plots(self):
        if self.serial_reader.is_connected():
            data = self.serial_reader.read()
            if data:
                parsed = self.data_parser.parse(data)
                if parsed:
                    self.plotter.update(parsed)
                    # Display latest data
                    self.data_text.append(str(parsed))
                    # Keep text box from growing too large
                    if self.data_text.document() and self.data_text.document().lineCount() > 100:
                        self.data_text.clear()
                        
    def closeEvent(self, event):
        self.serial_reader.disconnect()
        event.accept()

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()