import asyncio
import os
from threading import Event, Thread

from flask import Flask, render_template
from flask_socketio import SocketIO

from fitcheck import ConversationManager, WebcamStream

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
webcam_stream = None
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
    global webcam_stream
    if webcam_stream:
        webcam_stream.stop()
        webcam_stream = None


@socketio.on("start_conversation")
def start_conversation():
    global conversation_thread, stop_event, webcam_stream
    print("Start Conversation")
    if conversation_thread is None or not conversation_thread.is_alive():
        stop_event.clear()
        webcam_stream = WebcamStream().start()
        conversation_thread = Thread(
            target=lambda: asyncio.run(conversation_thread_function())
        )
        conversation_thread.start()
    else:
        print("Conversation already in progress")


@socketio.on("get_image")
def get_image():
    global webcam_stream
    if webcam_stream:
        frame = webcam_stream.read(encode=True)
        if frame is not None:
            socketio.emit("image", {"image": frame.decode("utf-8")})
        else:
            print("Error: Unable to capture frame")
    else:
        print("Error: Webcam stream not initialized")


@socketio.on("stop_conversation")
def stop_conversation():
    global conversation_thread, stop_event, webcam_stream
    print("Stopping Conversation")
    stop_event.set()
    if conversation_thread:
        conversation_thread.join(timeout=5)
        if conversation_thread.is_alive():
            print("Warning: Conversation thread did not terminate gracefully")
    conversation_thread = None
    conversation_manager.reset()
    if webcam_stream:
        webcam_stream.stop()
        webcam_stream = None
    asyncio.run(conversation_manager.initialize())
    socketio.emit("conversation_stopped")


@socketio.on("transcription")
def handle_transcription(data):
    print(f"Received transcription: {data['data']}")
    conversation_manager.transcription_response = data["data"]


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("DEBUG", "False").lower() == "true"

    print(f"Starting server on port {port}")
    print(f"Debug mode: {debug}")

    socketio.run(app, host="0.0.0.0", port=port, debug=debug)
