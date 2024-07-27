# https://hub.docker.com/_/python
FROM python:3.11.9-slim

# Allow statements and log messages to appear in the Knative logs
ENV PYTHONUNBUFFERED=True

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Install system dependencies, create a non-root user, and install Python dependencies in one RUN
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx=1.3.4-1 \
    libglib2.0-0=2.56.4-0+deb10u1 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn==20.1.0 \
    && useradd -m myuser

# Switch to non-root user
USER myuser

# Run gunicorn
CMD ["gunicorn", "--bind", ":$PORT", "--workers", "1", "--threads", "8", "--timeout", "0", "app:app"]

# Add a HEALTHCHECK instruction (example, adjust as needed for your application)
HEALTHCHECK CMD curl --fail http://localhost:$PORT/ || exit 1

# Run gunicorn
# CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app