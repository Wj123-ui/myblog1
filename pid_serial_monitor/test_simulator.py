#!/usr/bin/env python3
"""
Simulate serial data for testing PID monitor.
Generates JSON formatted PID data.
"""

import json
import time
import random

def generate_pid_data(t):
    """Generate simulated PID data."""
    setpoint = 100.0
    measured = setpoint * (0.5 + 0.5 * (1 - (t / 10.0))) + random.uniform(-5, 5)
    error = setpoint - measured
    p = error * 0.5
    i = error * t * 0.1
    d = -random.uniform(0, 1)
    output = p + i + d
    
    return {
        "time": t,
        "setpoint": setpoint,
        "measured": measured,
        "error": error,
        "p": p,
        "i": i,
        "d": d,
        "output": output
    }

def main():
    """Generate data and print to stdout (simulating serial output)."""
    t = 0.0
    dt = 0.1
    
    try:
        while True:
            data = generate_pid_data(t)
            json_str = json.dumps(data)
            print(json_str)  # Simulate serial output
            time.sleep(dt)
            t += dt
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    main()