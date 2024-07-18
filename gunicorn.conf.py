import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
bind = "0.0.0.0:8080"
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"
timeout = 300
