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
import base64
import os
from threading import Event, Thread

from flask import Flask, render_template
from flask_socketio import SocketIO
from engineio.async_drivers import gevent

from fitcheck import ConversationManager, TextToSpeech, TranscriptCollector, get_transcript

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")

socketio = SocketIO(
    app,
    async_mode="gevent",
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
)

conversation_manager = ConversationManager(socketio)
tts = TextToSpeech()
transcript_collector = TranscriptCollector()
conversation_thread = None
stop_event = Event()

async def conversation_thread_function():
    await conversation_manager.main(stop_event)

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("connect")
def on_connect():
    print("Client connected")

@socketio.on("disconnect")
def on_disconnect():
    print("Client disconnected")

@socketio.on("start_conversation")
def start_conversation():
    global conversation_thread, stop_event
    print("Start Conversation")
    if conversation_thread is None or not conversation_thread.is_alive():
        stop_event.clear()
        conversation_thread = Thread(
            target=lambda: asyncio.run(conversation_thread_function())
        )
        conversation_thread.start()
    else:
        print("Conversation already in progress")

@socketio.on("stop_conversation")
def stop_conversation():
    global conversation_thread, stop_event
    print("Stopping Conversation")
    stop_event.set()
    if conversation_thread:
        conversation_thread.join()
    conversation_thread = None
    conversation_manager.reset()
    asyncio.run(conversation_manager.initialize())
    socketio.emit("conversation_stopped")

@socketio.on("transcription")
async def handle_transcription(data):
    transcript = data['data']
    print(f"Received transcription: {transcript}")
    
    # Process the transcription with the AI model
    full_response, tts_response = await conversation_manager.llm.process(transcript, "")
    
    # Emit the AI response back to the client
    socketio.emit("user_message", {"message": transcript})
    socketio.emit("ai_response", {"message": full_response})
    
    # Generate and play text-to-speech
    tts.speak(tts_response)

@socketio.on("image")
def handle_image(data):
    image_data = data['image'].split(',')[1]
    # Store or process the image as needed
    # For now, we'll just acknowledge receipt
    socketio.emit("image_received", {"status": "Image received"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("DEBUG", "False").lower() == "true"

    print(f"Starting server on port {port}")
    print(f"Debug mode: {debug}")

    socketio.run(app, host="0.0.0.0", port=port, debug=debug)