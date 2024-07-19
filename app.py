# import asyncio
# import os
# from threading import Event, Thread

# from flask import Flask, render_template
# from flask_socketio import SocketIO, emit

# from fitcheck import ConversationManager, WebcamStream

# app = Flask(__name__, static_folder="static", template_folder="templates")
# socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")
# conversation_manager = ConversationManager(socketio)
# webcam_stream = WebcamStream().start()
# conversation_thread = None
# stop_event = Event()

# async def conversation_thread_function():
#     await conversation_manager.main(stop_event)

# @app.route("/")
# def index():
#     return render_template("index.html")

# @socketio.on("connect")
# def on_connect():
#     print("Client connected")
#     get_image()


# @socketio.on("disconnect")
# def on_disconnect():
#     print("Client disconnected")


# @socketio.on("start_conversation")
# def start_conversation():
#     global conversation_thread, stop_event
#     print("Start Conversation")
#     if conversation_thread is None or not conversation_thread.is_alive():
#         stop_event.clear()
#         conversation_thread = Thread(
#             target=lambda: asyncio.run(conversation_thread_function())
#         )
#         conversation_thread.start()
#     else:
#         print("Conversation already in progress")

# @socketio.on("get_image")
# def get_image():
#     frame = webcam_stream.read(encode=True)
#     emit("image", {"image": frame.decode("utf-8")})

# @socketio.on("stop_conversation")
# def stop_conversation():
#     global conversation_thread, stop_event
#     print("Stopping Conversation")
#     stop_event.set()
#     if conversation_thread:
#         conversation_thread.join()
#     conversation_thread = None
#     conversation_manager.reset()
#     asyncio.run(conversation_manager.initialize())
#     emit("conversation_stopped")

# if __name__ == "__main__":
#     socketio.run(app, debug=False, port=int(os.environ.get("PORT", default=5000)))

# import asyncio
# import os
# from threading import Event, Thread

# from engineio.async_drivers import gevent
# from flask import Flask, render_template
# from flask_socketio import SocketIO

# from fitcheck import ConversationManager, WebcamStream

# app = Flask(__name__, static_folder="static", template_folder="templates")
# app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")

# socketio = SocketIO(
#     app,
#     async_mode="gevent",
#     cors_allowed_origins="*",
#     logger=True,
#     engineio_logger=True,
# )

# conversation_manager = ConversationManager(socketio)
# webcam_stream = WebcamStream().start()
# conversation_thread = None
# stop_event = Event()


# async def conversation_thread_function():
#     await conversation_manager.main(stop_event)


# @app.route("/")
# def index():
#     return render_template("index.html")


# @socketio.on("connect")
# def on_connect():
#     print("Client connected")
#     get_image()


# @socketio.on("disconnect")
# def on_disconnect():
#     print("Client disconnected")


# @socketio.on("start_conversation")
# def start_conversation():
#     global conversation_thread, stop_event
#     print("Start Conversation")
#     if conversation_thread is None or not conversation_thread.is_alive():
#         stop_event.clear()
#         conversation_thread = Thread(
#             target=lambda: asyncio.run(conversation_thread_function())
#         )
#         conversation_thread.start()
#     else:
#         print("Conversation already in progress")


# @socketio.on("get_image")
# def get_image():
#     frame = webcam_stream.read(encode=True)
#     socketio.emit("image", {"image": frame.decode("utf-8")})


# @socketio.on("stop_conversation")
# def stop_conversation():
#     global conversation_thread, stop_event
#     print("Stopping Conversation")
#     stop_event.set()
#     if conversation_thread:
#         conversation_thread.join()
#     conversation_thread = None
#     conversation_manager.reset()
#     asyncio.run(conversation_manager.initialize())
#     socketio.emit("conversation_stopped")


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 8080))
#     debug = os.environ.get("DEBUG", "False").lower() == "true"

#     print(f"Starting server on port {port}")
#     print(f"Debug mode: {debug}")

#     socketio.run(app, host="0.0.0.0", port=port, debug=debug)







# import asyncio
# import os
# from threading import Event, Thread

# from flask import Flask, render_template
# from flask_socketio import SocketIO

# from fitcheck import ConversationManager, WebcamStream

# app = Flask(__name__, static_folder="static", template_folder="templates")
# app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")


# socketio = SocketIO(
#     app,
#     async_mode="gevent",
#     cors_allowed_origins="*",
#     logger=True,
#     engineio_logger=True,
# )


# conversation_manager = ConversationManager(socketio)
# webcam_stream = WebcamStream().start()
# conversation_thread = None
# stop_event = Event()


# async def conversation_thread_function():
#     await conversation_manager.main(stop_event)


# @app.route("/")
# def index():
#     return render_template("index.html")


# @socketio.on("connect")
# def on_connect():
#     print("Client connected")
#     get_image()


# @socketio.on("disconnect")
# def on_disconnect():
#     print("Client disconnected")


# @socketio.on("start_conversation")
# def start_conversation():
#     global conversation_thread, stop_event
#     print("Start Conversation")
#     if conversation_thread is None or not conversation_thread.is_alive():
#         stop_event.clear()
#         conversation_thread = Thread(
#             target=lambda: asyncio.run(conversation_thread_function())
#         )
#         conversation_thread.start()
#     else:
#         print("Conversation already in progress")


# @socketio.on("get_image")
# def get_image():
#     frame = webcam_stream.read(encode=True)
#     socketio.emit("image", {"image": frame.decode("utf-8")})


# @socketio.on("stop_conversation")
# def stop_conversation():
#     global conversation_thread, stop_event
#     print("Stopping Conversation")
#     stop_event.set()
#     if conversation_thread:
#         conversation_thread.join()
#     conversation_thread = None
#     conversation_manager.reset()
#     asyncio.run(conversation_manager.initialize())
#     socketio.emit("conversation_stopped")


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 8080))
#     debug = os.environ.get("DEBUG", "False").lower() == "true"

#     print(f"Starting server on port {port}")
#     print(f"Debug mode: {debug}")

#     socketio.run(app, host="0.0.0.0", port=port, debug=debug)

import asyncio
import os
import time
from threading import Event, Thread

from flask import Flask, render_template, Response,  request, jsonify
from flask_socketio import SocketIO
from engineio.async_drivers import gevent

from fitcheck import ConversationManager, WebcamStream

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")

conversation_manager = ConversationManager()
webcam_stream = WebcamStream().start()
conversation_thread = None
stop_event = Event()

async def conversation_thread_function():
    await conversation_manager.main(stop_event)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/start_conversation", methods=["POST"])
def start_conversation():
    global conversation_thread, stop_event
    print("Start Conversation")
    if conversation_thread is None or not conversation_thread.is_alive():
        stop_event.clear()
        conversation_thread = Thread(
            target=lambda: asyncio.run(conversation_thread_function())
        )
        conversation_thread.start()
        return jsonify({"status": "started"})
    else:
        return jsonify({"status": "already_running"})

@app.route("/stop_conversation", methods=["POST"])
def stop_conversation():
    global conversation_thread, stop_event
    print("Stopping Conversation")
    stop_event.set()
    if conversation_thread:
        conversation_thread.join()
    conversation_thread = None
    conversation_manager.reset()
    asyncio.run(conversation_manager.initialize())
    return jsonify({"status": "stopped"})

@app.route("/get_updates", methods=["GET"])
def get_updates():
    messages = conversation_manager.get_new_messages()
    return jsonify({"messages": messages})

@app.route("/send_message", methods=["POST"])
def send_message():
    message = request.json.get("message")
    conversation_manager.add_user_message(message)
    return jsonify({"status": "sent"})

@app.route("/get_image", methods=["GET"])
def get_image():
    try:
        frame = webcam_stream.read(encode=True)
        if frame is None:
            return jsonify({"error": "No frame available"}), 500
        return jsonify({"image": frame.decode("utf-8")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("DEBUG", "False").lower() == "true"

    print(f"Starting server on port {port}")
    print(f"Debug mode: {debug}")

    app.run(host="0.0.0.0", port=port, debug=debug)