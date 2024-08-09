import asyncio
import base64
import os
import re
import tempfile
import time
from threading import Event, Lock, Thread

import cv2
import requests
import sounddevice as sd
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveOptions,
    LiveTranscriptionEvents,
    Microphone,
)
from dotenv import load_dotenv
from flask_socketio import SocketIO
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema.messages import SystemMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI
from pinterest.client import PinterestSDKClient

from outfit_history import OutfitHistory

# Initialize Flask-SocketIO for real-time communication
socketio = SocketIO()
load_dotenv()  # Load environment variables from .env file


class PinterestManager:
    """
    Manages Pinterest API interactions for fetching fashion suggestions.
    """

    def __init__(self):
        self.access_token = os.getenv("PINTEREST_ACCESS_TOKEN")
        self.api = PinterestSDKClient.create_client_with_token(self.access_token)
        self.daily_request_count = 0
        self.last_reset_day = time.localtime().tm_yday

    def reset_daily_count_if_needed(self):
        """Reset the daily request count if it's a new day."""
        current_day = time.localtime().tm_yday
        if current_day != self.last_reset_day:
            self.daily_request_count = 0
            self.last_reset_day = current_day

    async def get_pinterest_suggestions(self, query, gender, limit=3):
        """
        Fetch Pinterest suggestions based on the query and gender.
        Limits requests to 1000 per day.
        """
        self.reset_daily_count_if_needed()

        if self.daily_request_count >= 1000:
            print("Daily Pinterest request limit reached.")
            return []

        try:
            print(f"Searching Pinterest for: {query} {gender} fashion")

            search_query = f"{query} {gender} fashion"
            search_results = self.api.pins.search(query=search_query)

            suggestions = []
            for pin in search_results["items"][:limit]:
                suggestions.append(
                    {
                        "title": pin.get("title", "No Title"),
                        "url": f"https://www.pinterest.com/pin/{pin['id']}/",
                        "image_url": pin.get("images", {})
                        .get("orig", {})
                        .get("url", ""),
                        "price": pin.get("price_value", {}).get("price", "N/A"),
                    }
                )

            self.daily_request_count += 1
            return suggestions

        except Exception as e:
            print(f"Error fetching Pinterest suggestions: {str(e)}")
            return []


class LanguageModelProcessor:
    """
    Processes user input using a language model and generates responses.
    """

    def __init__(self):
        self.model = None
        self.memory = ChatMessageHistory()
        self.pinterest_manager = PinterestManager()
        self.outfit_history = OutfitHistory()

        # Define the system prompt for the AI stylist
        self.SYSTEM_PROMPT = """
        You are a knowledgeable, trendy, and fashionable AI stylist assistant with direct access to the Pinterest API. Your role is to:
        1. Analyze the user's current outfit from the provided image.
        2. Describe the outfit in detail.
        3. Provide specific suggestions to improve or complement the outfit.
        4. Use the Pinterest API to search for and provide direct links to items that could enhance the look.
        5. Ask follow-up questions to understand the context (e.g., occasion, personal style, weather).
        6. When requested, recall and discuss previous outfit recommendations.

        Be friendly, creative, and insightful in your recommendations. Consider factors such as the occasion,
        weather, current trends, and the user's personal style when giving advice.

        When suggesting items, use specific details that can be used to search Pinterest. Include the user's gender
        (male/female) in your response to help with Pinterest searches.

        Remember to be concise and go straight to the point. Do not use emoticons or emojis.

        Importantly, always refer to the chat history before asking questions. If the user has already provided
        information about their preferences, occasion, or style, use that information instead of asking
        repeated questions. Only ask follow-up questions about new information you need.

        CRITICAL: Your primary focus is fashion and style. If a user asks about or shows an object that is not
        fashion-related (e.g., electronics, furniture, food), politely acknowledge that you see the object but
        redirect the conversation back to fashion and style. For example:

        User: "What do you think of this gaming mouse I'm holding?"
        You: "I can see that you're holding what appears to be a gaming mouse. However, as a fashion stylist,
        I'm not equipped to comment on electronics. Instead, I'd love to discuss your current outfit or any
        fashion-related questions you might have. Is there anything about your wardrobe you'd like advice on?"

        When providing Pinterest links, they will be automatically formatted as follows:
        [Link text](URL)
        You don't need to format them yourself; the system will handle this.

        When the user asks about previous outfits or recommendations, access the outfit history and provide a summary of recent outfits and recommendations.

        For users with color blindness or low vision:
        1. Describe colors using common objects or elements (e.g., "sky blue", "grass green", "sunflower yellow").
        2. Focus on patterns, textures, and shapes when describing outfits and recommendations.
        3. Use directional terms to describe outfit components (e.g., "on the left side", "at the bottom").
        4. Describe contrast levels between different parts of the outfit.
        5. Mention specific brand names and style numbers when recommending items, as these can be easier to search for.
        6. Suggest outfit combinations based on texture and pattern contrasts rather than just color.
        7. Provide information about clothing tags or labels that might help identify items.
        8. Recommend accessories or outfit elements that can be identified by touch or shape.
        9. Suggest outfit organizing techniques that don't rely solely on color (e.g., by occasion, fabric type, or season).
        10. When recommending new items, mention if they're available in multiple color options.

        Always prioritize clear, detailed descriptions and practical advice that doesn't rely solely on visual cues.

        When providing Pinterest links, they will be automatically formatted as follows:
        [Link text](URL)
        You don't need to format them yourself; the system will handle this.

        When the user asks about previous outfits or recommendations, access the outfit history and provide a summary of recent outfits and recommendations.
        """

        # Set up the prompt template for the language model
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                SystemMessage(content=self.SYSTEM_PROMPT),
                MessagesPlaceholder(variable_name="chat_history"),
                (
                    "human",
                    [
                        {"type": "text", "text": "{prompt}"},
                        {
                            "type": "image_url",
                            "image_url": "data:image/jpeg;base64,{image_base64}",
                        },
                    ],
                ),
            ]
        )

    async def initialize_model(self):
        """Initialize the language model if it hasn't been initialized yet."""
        if self.model is None:
            self.model = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest")
            chain = self.prompt_template | self.model | StrOutputParser()
            self.conversation = RunnableWithMessageHistory(
                chain,
                lambda _: self.memory,
                input_messages_key="prompt",
                history_messages_key="chat_history",
            )

    async def process(self, text, image_base64):
        """
        Process user input and generate a response using the language model.
        """
        await self.initialize_model()
        start_time = time.time()

        # Add the user's message to the chat history
        self.memory.add_user_message(text)

        # Check if the user is asking about previous outfits
        if "previous" in text.lower() and "outfit" in text.lower():
            return await self.recall_previous_outfits()

        response = await self.conversation.ainvoke(
            {"prompt": text, "image_base64": image_base64},
            config={"configurable": {"session_id": "unused"}},
        )
        end_time = time.time()

        processed_response, tts_response = await self.post_process_response(response)

        # Add the AI's response to the chat history
        self.memory.add_ai_message(processed_response)

        # Save the outfit recommendation
        self.outfit_history.add_outfit(text, processed_response)

        elapsed_time = int((end_time - start_time) * 1000)
        print(f"LLM ({elapsed_time}ms): {processed_response}")
        return processed_response, tts_response

    async def post_process_response(self, response):
        """
        Post-process the AI response by adding Pinterest suggestions and formatting for TTS.
        """
        # Determine gender and extract suggestions from the response
        gender = "female" if "female" in response.lower() else "male"
        suggestions = [
            sent.strip()
            for sent in response.split(".")
            if "suggest" in sent.lower() or "recommend" in sent.lower()
        ]

        # Fetch Pinterest suggestions
        pinterest_links = []
        for suggestion in suggestions:
            pinterest_suggestions = (
                await self.pinterest_manager.get_pinterest_suggestions(
                    suggestion, gender
                )
            )
            pinterest_links.extend(pinterest_suggestions)

        # Create the full response with URLs
        full_response = response
        if pinterest_links:
            full_response += "\nHere are some specific items to enhance your look:\n"
            for i, item in enumerate(pinterest_links, 1):
                full_response += f"{i}. {item['title']} - Price: {item.get('price', 'N/A')} - [View on Pinterest]({item['url']})\n"

        # Create the TTS response by removing URLs
        tts_response = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", full_response)
        tts_response = re.sub(
            r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+",
            "",
            tts_response,
        )

        return full_response.strip(), tts_response.strip()

    async def recall_previous_outfits(self):
        """
        Recall and summarize previous outfit recommendations.
        """
        recent_outfits = self.outfit_history.get_recent_outfits(limit=5)
        if not recent_outfits:
            return (
                "I'm sorry, but I don't have any records of previous outfit recommendations. Let's start by analyzing your current outfit!",
                "I don't have any records of previous outfit recommendations. Let's start fresh!",
            )

        summary = "Here's a summary of your recent outfits and recommendations:\n\n"
        for outfit in recent_outfits:
            summary += f"Date: {outfit['date'][:10]}\n"
            summary += f"You asked: {outfit['user_input']}\n"
            summary += f"My recommendation: {outfit['ai_response'][:200]}...\n\n"

        summary += "Would you like me to elaborate on any of these outfits or shall we focus on your current look?"

        return summary, summary


class TextToSpeech:
    """
    Handles text-to-speech conversion using the Deepgram API.
    """

    def __init__(self):
        load_dotenv()
        self.DG_API_KEY = os.getenv("DEEPGRAM_API_KEY")
        if not self.DG_API_KEY:
            raise ValueError("Deepgram API key not found in environment variables")
        self.MODEL_NAME = "aura-asteria-en"

    def speak(self, text):
        """
        Convert text to speech and play the audio.
        """
        DEEPGRAM_URL = (
            f"https://api.deepgram.com/v1/speak?model={self.MODEL_NAME}&encoding=mp3"
        )
        headers = {
            "Authorization": f"Token {self.DG_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {"text": text}

        start_time = time.time()
        first_byte_time = None

        try:
            with requests.post(
                DEEPGRAM_URL, stream=True, headers=headers, json=payload, timeout=30
            ) as r:
                r.raise_for_status()

                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=".mp3"
                ) as temp_file:
                    for chunk in r.iter_content(chunk_size=1024):
                        if chunk:
                            if first_byte_time is None:
                                first_byte_time = time.time()
                                ttfb = int((first_byte_time - start_time) * 1000)
                                print(f"TTS Time to First Byte (TTFB): {ttfb}ms\n")
                            temp_file.write(chunk)

            self.play_audio(temp_file.name)
            os.unlink(temp_file.name)
        except requests.Timeout:
            print("TTS request timed out")
        except requests.RequestException as e:
            print(f"TTS request failed: {e}")
            if hasattr(e, "response") and e.response is not None:
                print(f"Response status code: {e.response.status_code}")
                print(f"Response content: {e.response.text}")
        except Exception as e:
            print(f"Unexpected error in TTS: {str(e)}")

    def play_audio(self, file_path):
        """
        Play the audio file using sounddevice.
        """
        try:
            import soundfile as sf

            data, samplerate = sf.read(file_path)
            sd.play(data, samplerate)
            sd.wait()
        except Exception as e:
            print(f"Error playing audio: {str(e)}")


class TranscriptCollector:
    """
    Collects and manages transcription parts for speech recognition.
    """

    def __init__(self):
        self.reset()

    def reset(self):
        """Reset the transcript parts."""
        self.transcript_parts = []

    def add_part(self, part):
        """Add a new part to the transcript."""
        self.transcript_parts.append(part)

    def get_full_transcript(self):
        """Get the full transcript by joining all parts."""
        return " ".join(self.transcript_parts)


class WebcamStream:
    """
    Manages the webcam stream for capturing images.
    """

    def __init__(self):
        self.stream = cv2.VideoCapture(0)
        _, self.frame = self.stream.read()
        self.running = False
        self.lock = Lock()

    def start(self):
        """Start the webcam stream in a separate thread."""
        if self.running:
            return self

        self.running = True
        self.thread = Thread(target=self.update, args=())
        self.thread.start()
        return self

    def update(self):
        """Continuously update the frame from the webcam."""
        while self.running:
            _, frame = self.stream.read()
            self.lock.acquire()
            self.frame = frame
            self.lock.release()

    def read(self, encode=False):
        """Read the current frame from the webcam."""
        self.lock.acquire()
        frame = self.frame.copy()
        self.lock.release()

        if encode:
            _, buffer = cv2.imencode(".jpeg", frame)
            return base64.b64encode(buffer)

        return frame

    def stop(self):
        """Stop the webcam stream."""
        self.running = False
        if self.thread.is_alive():
            self.thread.join()

    def __exit__(self, exc_type, exc_value, exc_traceback):
        """Release the webcam when the object is destroyed."""
        self.stream.release()


class ConversationManager:
    def __init__(self, socketio):
        self.socketio = socketio
        self.transcription_response = ""
        self.llm = None
        self.webcam_stream = None
        self.tts = TextToSpeech()

    async def initialize(self):
        self.llm = LanguageModelProcessor()
        await self.llm.initialize_model()
        if self.webcam_stream is None or not self.webcam_stream.running:
            self.webcam_stream = WebcamStream().start()

    def reset(self):
        self.transcription_response = ""
        self.llm = None
        self.tts = TextToSpeech()
        if self.webcam_stream:
            self.webcam_stream.stop()
            self.webcam_stream = None

    def capture_webcam(self):
        if self.webcam_stream is None or not self.webcam_stream.running:
            self.webcam_stream = WebcamStream().start()
        frame = self.webcam_stream.read()
        _, buffer = cv2.imencode(".jpg", frame)
        image_base64 = base64.b64encode(buffer).decode("utf-8")
        self.socketio.emit("webcam_updated", {"image": image_base64})
        return image_base64

    async def main(self, stop_event):
        await self.initialize()

        while not stop_event.is_set():
            try:
                self.socketio.emit("listening_state", {"state": "listening"})
                full_sentence = await get_transcript(stop_event)

                if stop_event.is_set():
                    break

                if full_sentence:
                    self.socketio.emit("listening_state", {"state": "processing"})
                    image_base64 = (
                        self.capture_webcam()
                    )  # Capture image after each question

                    if "goodbye" in full_sentence.lower():
                        print("Goodbye! Ending the conversation.")
                        self.socketio.emit("listening_state", {"state": "ai_speaking"})
                        self.tts.speak(
                            "Goodbye! It was a pleasure assisting you with your style today. Feel free to come back anytime for more fashion advice."
                        )
                        self.socketio.emit("conversation_stopped")
                        break

                    try:
                        full_response, tts_response = await self.llm.process(
                            full_sentence, image_base64
                        )
                        self.socketio.emit("user_message", {"message": full_sentence})
                        self.socketio.emit("ai_response", {"message": full_response})
                        self.socketio.emit("listening_state", {"state": "ai_speaking"})
                        self.tts.speak(tts_response)
                        self.socketio.emit("tts_complete")
                    except Exception as e:
                        print(f"Error processing image: {str(e)}")
                        self.socketio.emit(
                            "ai_response",
                            {
                                "message": "I'm sorry, I couldn't process the image. Could you please try again?"
                            },
                        )
                        self.socketio.emit("listening_state", {"state": "ai_speaking"})
                        self.tts.speak(
                            "I'm sorry, I couldn't process the image. Could you please try again?"
                        )

            except Exception as e:
                print(f"Error in main loop: {e}")
                await asyncio.sleep(1)

        self.reset()


# Create a global instance of TranscriptCollector
transcript_collector = TranscriptCollector()


async def get_transcript(stop_event):
    transcription_complete = asyncio.Event()
    full_sentence = ""

    try:
        config = DeepgramClientOptions(options={"keepalive": "true"})
        deepgram: DeepgramClient = DeepgramClient("", config)

        dg_connection = deepgram.listen.asynclive.v("1")
        print("Listening...")

        async def on_message(self, result, **kwargs):
            nonlocal full_sentence
            if stop_event.is_set():
                transcription_complete.set()
                return

            sentence = result.channel.alternatives[0].transcript

            if result.speech_final:
                full_sentence = sentence.strip()
                print(f"Human: {full_sentence}")
                transcription_complete.set()

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)

        options = LiveOptions(
            model="nova-2",
            punctuate=True,
            language="en-US",
            encoding="linear16",
            channels=1,
            sample_rate=16000,
            endpointing=300,
            smart_format=True,
        )

        await dg_connection.start(options)

        microphone = Microphone(dg_connection.send)
        microphone.start()

        await transcription_complete.wait()
        microphone.finish()
        await dg_connection.finish()

    except Exception as e:
        print(f"Could not open socket: {e}")
    finally:
        if "microphone" in locals():
            microphone.finish()
        if "dg_connection" in locals():
            await dg_connection.finish()

    return full_sentence


if __name__ == "__main__":
    # Run the ConversationManager if this script is executed directly
    stop_event = Event()
    asyncio.run(ConversationManager(socketio).main(stop_event))
