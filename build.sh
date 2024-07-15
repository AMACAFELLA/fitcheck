#!/bin/bash
set -e

# Update package lists
apt-get update

# Install system dependencies
apt-get install -y portaudio19-dev

# Install Python dependencies
pip install -r requirements.txt
