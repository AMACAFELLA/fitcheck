# #Dockerfile
# FROM python:3.10.12-bookworm

# #Allow statements and log messages to immediately appear in the logs
# ENV PYTHONUNBUFFERED True
# #Copy local code to the container image.
# ENV APP_HOME /back-end
# WORKDIR $APP_HOME
# COPY . ./

# RUN pip install --no-cache-dir --upgrade pip
# RUN pip install --no-cache-dir -r requirements.txt

# CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app

FROM python:3.10.12-bookworm

ENV PYTHONUNBUFFERED True
ENV APP_HOME /app
WORKDIR $APP_HOME

COPY . ./

RUN pip install --no-cache-dir -r requirements.txt

# Explicitly copy necessary directories
COPY static ./static
COPY templates ./templates
COPY fitcheck ./fitcheck

# Make sure the entrypoint script is executable
RUN chmod +x ./entrypoint.sh

CMD ["./entrypoint.sh"]