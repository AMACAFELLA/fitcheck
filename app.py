import asyncio
import os
from threading import Event, Thread

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO

from fitcheck import ConversationManager

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

# Create instance of ConversationManager
conversation_manager = ConversationManager(socketio)

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


# Route for getting outfit history
@app.route("/outfit_history")
def get_outfit_history():
    if conversation_manager.llm is None:
        return jsonify({"outfits": []})

    history = conversation_manager.llm.outfit_history.get_all_outfits()
    return jsonify({"outfits": history})


@app.route("/delete_outfit", methods=["POST"])
def delete_outfit():
    data = request.json
    date = data.get("date")
    index = data.get("index")
    if date is None or index is None:
        return jsonify({"success": False, "error": "Missing date or index"})

    success = conversation_manager.llm.outfit_history.delete_outfit(date, int(index))
    return jsonify({"success": success})


@app.route("/delete_all_history", methods=["POST"])
def delete_all_history():
    success = conversation_manager.llm.outfit_history.clear_history()
    return jsonify({"success": success})


# Socket.IO event handler for client connection
@socketio.on("connect")
def on_connect():
    print("Client connected")
    conversation_manager.capture_webcam()


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
        conversation_manager.reset()
        conversation_thread = Thread(target=run_conversation_manager)
        conversation_thread.start()
    else:
        print("Conversation already in progress")


# Socket.IO event handler for getting webcam image
@socketio.on("get_image")
def get_image():
    conversation_manager.capture_webcam()


# Socket.IO event handler for stopping a conversation
@socketio.on("stop_conversation")
def stop_conversation():
    global conversation_thread, stop_event
    print("Stopping Conversation")
    stop_event.set()
    if conversation_thread:
        conversation_thread.join(timeout=5)
        if conversation_thread.is_alive():
            print("Warning: Conversation thread did not terminate gracefully")
    conversation_thread = None
    conversation_manager.reset()
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
