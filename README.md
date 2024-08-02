# FitCheck AI Stylist

FitCheck AI Stylist is an interactive web application that uses artificial intelligence to analyze your outfit and provide personalized style advice. It combines computer vision, natural language processing, and integration with Pinterest to offer a unique fashion experience.

## Features

- Real-time webcam feed for outfit analysis
- Speech-to-text for user input
- AI-powered outfit analysis and recommendations
- Text-to-speech for AI responses
- Pinterest integration for product suggestions

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Python 3.8 or higher
- Node.js and npm (for running the frontend)
- Git (for cloning the repository)
- A webcam connected to your computer
- A microphone for voice input

## Installation

Follow these steps to install and set up FitCheck AI Stylist on your local machine:

### Step 1: Clone the Repository

```bash
git clone https://github.com/AMACAFELLA/fitcheck.git
cd fitcheck-ai-stylist
```

### Step 2: Set Up a Virtual Environment

#### For macOS and Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

#### For Windows:

```bash
python -m venv venv
.\venv\Scripts\activate
```

### Step 3: Install Python Dependencies

First, ensure you have the latest pip:

```bash
pip install --upgrade pip
```

Then, install the required packages:

```bash
pip install -r requirements.txt
```

#### Note for macOS users:

If you encounter issues installing PyAudio, you may need to install PortAudio first:

```bash
brew install portaudio
pip install pyaudio
```

#### Note for Windows users:

If you have trouble installing PyAudio, please refer to the documentation [here](https://pypi.org/project/PyAudio/) and if you're still struggle with it on Windows 10, try checking out [this](https://www.sololearn.com/en/Discuss/2135497/how-to-install-pyaudio-in-python37-windows-10) communnity solution. Here's the offical PyAudio installation:

```bash
python -m pip install pyaudio
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the root directory of the project and add the following variables:

```
DEEPGRAM_API_KEY=your_deepgram_api_key
GOOGLE_API_KEY=your_google_api_key
PINTEREST_ACCESS_TOKEN=your_pinterest_access_token
PINTEREST_APP_ID=your_pinterest_app_id
SECRET_KEY=your_secret_key
```

Replace `your_*` with your actual API keys and tokens.

## Running the Application

To run FitCheck AI Stylist locally, follow these steps:

1. Ensure you're in the project root directory and your virtual environment is activated.

2. Start the Flask server:

   ```bash
   python3 app.py
   ```

3. Open a web browser and navigate to `http://localhost:8080` (or the port specified in the console output).

## Usage

1. Click the "Start Conversation" button to begin.
2. Allow the application to access your webcam and microphone when prompted.
3. Speak clearly into your microphone to describe your outfit or ask for style advice.
4. The AI will analyze your outfit through the webcam feed and provide personalized recommendations.
5. You can view Pinterest product suggestions directly in the chat interface.

## Project Structure

- `fitcheck/`
  - `fitcheck.py`: Main backend logic for the AI stylist
  - `app.py`: Flask application setup and routes
  - `requirements.txt`: Python dependencies
  - `static/`
    - `js/main.js`: Frontend JavaScript code
  - `templates/`
    - `index.html`: Main HTML template for the web interface

## Technologies Used

- Backend:

  - Python
  - Flask
  - Flask-SocketIO
  - LangChain
  - Google Generative AI
  - Deepgram (for speech-to-text and text-to-speech)
  - OpenCV (for webcam handling)
  - Pinterest API
  - sounddevice and PyAudio (for audio processing)

- Frontend:
  - HTML5
  - CSS3 (with Tailwind CSS)
  - JavaScript
  - Socket.IO (for real-time communication)

## Troubleshooting

If you encounter any issues while setting up or running the application, try the following:

1. Ensure all required API keys and tokens are correctly set in the `.env` file.
2. Check that your webcam and microphone are properly connected and functioning.
3. Make sure you have the latest version of Python and pip installed.
4. If you're having issues with dependencies, try creating a fresh virtual environment and reinstalling the requirements.
5. For audio-related issues, ensure both PyAudio and sounddevice are correctly installed.

## Testing Instructions for Judges

To get the best experience and properly evaluate the FitCheck AI Stylist, please follow these step-by-step instructions:

1. **Setup and Launch**

   - Ensure you have completed all the installation steps in the "Installation" section above.
   - Launch the application by running `python app.py` in the project root directory.
   - Open a web browser and navigate to `http://localhost:8080` (or the port specified in the console output).

2. **Prepare Your Environment**

   - Find a well-lit area where your webcam can clearly capture your outfit.
   - Ensure your microphone is working and there's minimal background noise.
   - Wear an outfit you'd like advice on, or have a few clothing items ready to show.

3. **Start the Conversation**

   - Click the "Start Conversation" button on the web interface.
   - Allow the application to access your webcam and microphone when prompted.

4. **Initial Outfit Analysis**

   - Stand in front of your webcam so that your full outfit is visible.
   - Speak clearly into your microphone, saying something like: "What do you think of my outfit?"
   - Wait for the AI to analyze your outfit and provide initial feedback.

5. **Ask for Specific Advice**

   - Try asking for specific recommendations, such as:
     - "What accessories would go well with this outfit?"
     - "Is this appropriate for a casual office setting?"
     - "How can I make this outfit more suitable for a night out?"
   - Observe how the AI tailors its advice based on your questions.

6. **Show Different Outfits or Items**

   - If possible, show the AI different outfits or individual clothing items.
   - Ask for comparisons or mix-and-match advice, like:
     - "Which of these two shirts would look better with these pants?"
     - "How can I style this jacket for both casual and formal occasions?"

7. **Explore Pinterest Suggestions**

   - Pay attention to the Pinterest product suggestions provided by the AI.
   - Click on some of the Pinterest links to see how they complement the AI's advice.

8. **Test Edge Cases**

   - Try asking about unconventional style choices or specific fashion challenges.
   - See how the AI handles unusual requests or complex style questions.

9. **Evaluate Speech Recognition and Synthesis**

   - Assess the accuracy of the speech-to-text functionality.
   - Evaluate the quality and naturalness of the AI's text-to-speech responses.

10. **Test Conversation Flow**

    - Engage in a back-and-forth conversation with the AI stylist.
    - See how well it remembers context from earlier in the conversation.

11. **End the Session**

    - Conclude your testing by saying "Goodbye" or clicking the "Stop Conversation" button.
    - Observe how the application handles the end of the session.

12. **Overall Evaluation**
    - Consider the following aspects in your evaluation:
      - Accuracy and relevance of style advice
      - Quality of outfit analysis
      - Usefulness of Pinterest product suggestions
      - Natural language understanding and generation
      - Overall user experience and interface design
      - Performance and responsiveness of the application

By following these steps, you'll be able to thoroughly test all aspects of the FitCheck AI Stylist application. I appreciate the time and effort in evaluating my project!
