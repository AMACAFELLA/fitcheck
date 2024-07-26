import asyncio
import base64
import os
import re
import shutil
import subprocess
import tempfile
import time
import wave
from threading import Lock, Thread

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

# Initialize Flask-SocketIO
socketio = SocketIO()
load_dotenv()


class PinterestManager:
    def __init__(self):
        self.access_token = os.getenv("PINTEREST_ACCESS_TOKEN")
        self.api = PinterestSDKClient.create_client_with_token(self.access_token)
        self.daily_request_count = 0
        self.last_reset_day = time.localtime().tm_yday

    def reset_daily_count_if_needed(self):
        current_day = time.localtime().tm_yday
        if current_day != self.last_reset_day:
            self.daily_request_count = 0
            self.last_reset_day = current_day

    async def get_pinterest_suggestions(self, query, gender, limit=3):
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
    def __init__(self):
        self.model = None
        self.memory = ChatMessageHistory()
        self.pinterest_manager = PinterestManager()

        self.SYSTEM_PROMPT = """
    You are a knowledgeable, trendy, and fashionable AI stylist assistant with direct access to the Pinterest API. Your role is to:
    1. Analyze the user's current outfit from the provided image.
    2. Describe the outfit in detail.
    3. Provide specific suggestions to improve or complement the outfit.
    4. Use the Pinterest API to search for and provide direct links to items that could enhance the look.
    5. Ask follow-up questions to understand the context (e.g., occasion, personal style, weather).




    Be friendly, creative, and insightful in your recommendations. Consider factors such as the occasion,
    weather, current trends, and the user's personal style when giving advice.




    When suggesting items, use specific details that can be used to search Pinterest. Include the user's gender
    (male/female) in your response to help with Pinterest searches.




    Remember to be concise and go straight to the point. Do not use emoticons or emojis.




    Importantly, always refer to the chat history before asking questions. If the user has already provided
    information about their preferences, occasion, or style, use that information instead of asking
    repeated questions. Only ask follow-up questions about new information you need.




    When providing Pinterest links, they will be automatically formatted as follows:
    [Link text](URL)
    You don't need to format them yourself; the system will handle this.
    """

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
        await self.initialize_model()
        start_time = time.time()

        # Add the user's message to the chat history
        self.memory.add_user_message(text)

        response = await self.conversation.ainvoke(
            {"prompt": text, "image_base64": image_base64},
            config={"configurable": {"session_id": "unused"}},
        )
        end_time = time.time()

        processed_response, tts_response = await self.post_process_response(response)

        # Add the AI's response to the chat history
        self.memory.add_ai_message(processed_response)

        elapsed_time = int((end_time - start_time) * 1000)
        print(f"LLM ({elapsed_time}ms): {processed_response}")
        return processed_response, tts_response

    async def post_process_response(self, response):
        # Process Pinterest suggestions
        gender = "female" if "female" in response.lower() else "male"
        suggestions = [
            sent.strip()
            for sent in response.split(".")
            if "suggest" in sent.lower() or "recommend" in sent.lower()
        ]
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


class TextToSpeech:
    DG_API_KEY = os.getenv("DEEPGRAM_API_KEY")
    MODEL_NAME = "aura-arcas-en"

    @staticmethod
    def is_installed(lib_name: str) -> bool:
        lib = shutil.which(lib_name)
        return lib is not None

    def speak(self, text):
        DEEPGRAM_URL = f"https://api.deepgram.com/v1/speak?model={self.MODEL_NAME}&performance=some&encoding=linear16&sample_rate=24000"
        headers = {
            "Authorization": f"Token {self.DG_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {"text": text}

        start_time = time.time()
        first_byte_time = None

        with requests.post(
            DEEPGRAM_URL, stream=True, headers=headers, json=payload
        ) as r:
            r.raise_for_status()

            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                with wave.open(temp_file.name, "wb") as wav_file:
                    wav_file.setnchannels(1)
                    wav_file.setsampwidth(2)
                    wav_file.setframerate(24000)

                    for chunk in r.iter_content(chunk_size=1024):
                        if chunk:
                            if first_byte_time is None:
                                first_byte_time = time.time()
                                ttfb = int((first_byte_time - start_time) * 1000)
                                print(f"TTS Time to First Byte (TTFB): {ttfb}ms\n")
                            wav_file.writeframes(chunk)

        self.play_audio(temp_file.name)
        os.unlink(temp_file.name)

    def play_audio(self, file_path):
        if self.is_installed("ffplay"):
            subprocess.run(
                ["ffplay", "-autoexit", "-nodisp", file_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        elif self.is_installed("afplay"):
            subprocess.run(["afplay", file_path])
        elif self.is_installed("aplay"):
            subprocess.run(["aplay", file_path])
        elif self.is_installed("powershell"):
            powershell_cmd = f'(New-Object Media.SoundPlayer "{file_path}").PlaySync()'
            subprocess.run(["powershell", "-Command", powershell_cmd])
        else:
            print(
                f"Audio saved to {file_path}. Please install ffplay, afplay, aplay, or use PowerShell to play the audio."
            )


class TranscriptCollector:
    def __init__(self):
        self.reset()

    def reset(self):
        self.transcript_parts = []

    def add_part(self, part):
        self.transcript_parts.append(part)

    def get_full_transcript(self):
        return " ".join(self.transcript_parts)


class WebcamStream:
    def __init__(self):
        self.stream = cv2.VideoCapture(0)
        _, self.frame = self.stream.read()
        self.running = False
        self.lock = Lock()

    def start(self):
        if self.running:
            return self

        self.running = True
        self.thread = Thread(target=self.update, args=())
        self.thread.start()
        return self

    def update(self):
        while self.running:
            _, frame = self.stream.read()
            self.lock.acquire()
            self.frame = frame
            self.lock.release()

    def read(self, encode=False):
        self.lock.acquire()
        frame = self.frame.copy()
        self.lock.release()

        if encode:
            _, buffer = cv2.imencode(".jpeg", frame)
            return base64.b64encode(buffer)

        return frame

    def stop(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join()

    def __exit__(self, exc_type, exc_value, exc_traceback):
        self.stream.release()


class ConversationManager:
    def __init__(self, socketio):
        self.socketio = socketio
        self.transcription_response = ""
        self.llm = None
        self.webcam_stream = WebcamStream().start()
        self.tts = TextToSpeech()

    async def initialize(self):
        self.llm = LanguageModelProcessor()
        await self.llm.initialize_model()

    def reset(self):
        self.transcription_response = ""
        self.llm = None
        self.tts = TextToSpeech()

    def process_image(self, image_path):
        with open(image_path, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode("utf-8")
        return image_base64

    async def main(self, stop_event):
        await self.initialize()

        def handle_full_sentence(full_sentence):
            self.transcription_response = full_sentence

        while not stop_event.is_set():
            await get_transcript(handle_full_sentence, stop_event)

            if stop_event.is_set():
                break

            if "goodbye" in self.transcription_response.lower():
                print("Goodbye! Ending the conversation.")
                self.tts.speak(
                    "Goodbye! It was a pleasure assisting you with your style today. Feel free to come back anytime for more fashion advice."
                )
                break

            frame = self.webcam_stream.read()
            image_path = "webcam_image.jpg"
            cv2.imwrite(image_path, frame)
            print(f"Webcam image saved as '{image_path}'")

            image_base64 = self.process_image(image_path)

            try:
                full_response, tts_response = await self.llm.process(
                    self.transcription_response, image_base64
                )
                self.socketio.emit(
                    "user_message", {"message": self.transcription_response}
                )
                self.socketio.emit("ai_response", {"message": full_response})
                self.tts.speak(tts_response)
            except Exception as e:
                print(f"Error processing image: {str(e)}")
                self.socketio.emit(
                    "ai_response",
                    {
                        "message": "I'm sorry, I couldn't process the image. Could you please try again?"
                    },
                )
                self.tts.speak(
                    "I'm sorry, I couldn't process the image. Could you please try again?"
                )

            self.transcription_response = ""

        self.webcam_stream.stop()


transcript_collector = TranscriptCollector()


async def get_transcript(callback, stop_event):
    transcription_complete = asyncio.Event()

    try:
        config = DeepgramClientOptions(options={"keepalive": "true"})
        deepgram: DeepgramClient = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"), config)

        dg_connection = deepgram.listen.asynclive.v("1")
        print("Listening...")

        async def on_message(self, result, **kwargs):
            if stop_event.is_set():
                transcription_complete.set()
                return

            sentence = result.channel.alternatives[0].transcript

            if not result.speech_final:
                transcript_collector.add_part(sentence)
            else:
                transcript_collector.add_part(sentence)
                full_sentence = transcript_collector.get_full_transcript()
                if len(full_sentence.strip()) > 0:
                    full_sentence = full_sentence.strip()
                    print(f"Human: {full_sentence}")
                    callback(full_sentence)
                    transcript_collector.reset()
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
        return


if __name__ == "__main__":
    asyncio.run(ConversationManager().main())
