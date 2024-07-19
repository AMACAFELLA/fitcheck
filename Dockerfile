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
    libglib2.0-0

# Install production dependencies
RUN pip install -r requirements.txt
RUN pip install gunicorn eventlet

# Run the web service on container startup using gunicorn with eventlet worker
CMD exec gunicorn --worker-class eventlet -w 1 --bind :$PORT --timeout 0 app:app