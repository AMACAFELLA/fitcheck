#!/bin/bash
set -e

# Run any setup scripts or database migrations here

# Start the application
exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app