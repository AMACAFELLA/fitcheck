# Use offical lightweight python image.
# https://hub.docker.com/_/python
FROM python:3.11.9-slim

# Allow statements and log messages to appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg

# Install production dependencies
RUN pip install -r requirements.txt
RUN pip install gunicorn eventlet

# Run the web service on container startup using gunicorn with eventlet worker
CMD exec gunicorn --bind :$PORT --workers 1 --worker-class eventlet --threads 8 --timeout 0 app:app