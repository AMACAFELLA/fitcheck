import asyncio
import os
from threading import Event, Thread

from flask import Flask, render_template
from flask_socketio import SocketIO

from fitcheck import ConversationManager, WebcamStream

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")

# Initialize Socket.IO with Flask app
socketio = SocketIO(
    app,
    async_mode="gevent",
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
)

# Create instances of ConversationManager and WebcamStream
conversation_manager = ConversationManager(socketio)
webcam_stream = WebcamStream().start()

# Global variables for managing the conversation thread
conversation_thread = None
stop_event = Event()


# Function to run the conversation manager
def run_conversation_manager():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(conversation_manager.main(stop_event))


# Route for the main page
@app.route("/")
def index():
    return render_template("index.html")


# Socket.IO event handler for client connection
@socketio.on("connect")
def on_connect():
    print("Client connected")
    get_image()


# Socket.IO event handler for client disconnection
@socketio.on("disconnect")
def on_disconnect():
    print("Client disconnected")


# Socket.IO event handler for starting a conversation
@socketio.on("start_conversation")
def start_conversation():
    global conversation_thread, stop_event
    print("Start Conversation")
    if conversation_thread is None or not conversation_thread.is_alive():
        stop_event.clear()
        conversation_thread = Thread(target=run_conversation_manager)
        conversation_thread.start()
    else:
        print("Conversation already in progress")


# Socket.IO event handler for getting webcam image
@socketio.on("get_image")
def get_image():
    frame = webcam_stream.read(encode=True)
    socketio.emit("image", {"image": frame.decode("utf-8")})


# Socket.IO event handler for stopping a conversation
@socketio.on("stop_conversation")
def stop_conversation():
    global conversation_thread, stop_event
    print("Stopping Conversation")
    stop_event.set()
    if conversation_thread:
        conversation_thread.join(timeout=5)  # Wait up to 5 seconds for thread to finish
        if conversation_thread.is_alive():
            print("Warning: Conversation thread did not terminate gracefully")
            # Implement additional forceful termination if needed
    conversation_thread = None
    conversation_manager.reset()
    webcam_stream.stop()  # Ensure webcam stream is stopped
    asyncio.run(conversation_manager.initialize())
    socketio.emit("conversation_stopped")


# Socket.IO event handler for receiving transcriptions
@socketio.on("transcription")
def handle_transcription(data):
    print(f"Received transcription: {data['data']}")
    conversation_manager.transcription_response = data["data"]


# Main entry point
if __name__ == "__main__":
    # Get port, debug mode, and host from environment variables
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    host = os.environ.get("HOST", "127.0.0.1")  # Default to localhost

    print(f"Starting server on {host}:{port}")
    print(f"Debug mode: {debug}")

    # Run the Socket.IO server
    socketio.run(app, host=host, port=port, debug=debug)
