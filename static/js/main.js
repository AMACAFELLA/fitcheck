// Initialize Socket.IO connection
var socket = io();

// Get DOM elements
var video = document.getElementById('webcam');
var conversation = document.getElementById('conversation');
var startBtn = document.getElementById('startBtn');
var stopBtn = document.getElementById('stopBtn');
var loadingIndicator = document.getElementById('loadingIndicator');
var loadingIndicatorText = loadingIndicator.querySelector('.loading-indicator-text');

// Variables for speech recognition
var recognition;
var isListening = false;

// Event listener for successful socket connection
socket.on('connect', function () {
    console.log('Connected to server');
});

// Event listener for start button
startBtn.addEventListener('click', function () {
    socket.emit('start_conversation');
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    resetConversation();
    showLoadingIndicator('Listening...');
    startSpeechRecognition();
});

// Event listener for stop button
stopBtn.addEventListener('click', function () {
    socket.emit('stop_conversation');
    showLoadingIndicator('Ending conversation...');
    stopSpeechRecognition();
});

// Event listener for conversation stopped event
socket.on('conversation_stopped', function () {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    resetConversation();
    stopSpeechRecognition();
});

// Function to reset the conversation UI
function resetConversation() {
    conversation.innerHTML = '';
    conversation.appendChild(loadingIndicator);
    hideLoadingIndicator();
}

// Function to start speech recognition
function startSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = handleSpeechRecognitionResult;
        recognition.onend = function () {
            if (isListening) {
                console.log("Speech recognition ended. Restarting...");
                recognition.start();
            }
        };
        recognition.start();
        isListening = true;
        console.log("Speech recognition started");
        showLoadingIndicator('Listening...');
    } else {
        console.log("Speech recognition not supported");
    }
}

// Function to stop speech recognition
function stopSpeechRecognition() {
    if (recognition) {
        recognition.stop();
        isListening = false;
        console.log("Speech recognition stopped");
    }
}

// Function to handle speech recognition results
function handleSpeechRecognitionResult(event) {
    const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

    if (event.results[0].isFinal) {
        console.log('Sending transcription:', transcript);
        socket.emit('transcription', { data: transcript });
        showLoadingIndicator('Processing...');
    }
}

// Event listener for user messages
socket.on('user_message', function (data) {
    console.log('Received user message:', data.message);
    addUserMessage(data.message);
});

// Event listener for AI responses
socket.on('ai_response', function (data) {
    console.log('Received AI response:', data.message);
    addAiMessage(data.message);
});

// Event listener for listening state changes
socket.on('listening_state', function (data) {
    console.log('Listening state:', data.state);
    requestAnimationFrame(() => {
        switch (data.state) {
            case 'listening':
                showLoadingIndicator('Listening...');
                break;
            case 'processing':
                showLoadingIndicator('Processing...');
                break;
            case 'ai_speaking':
                showLoadingIndicator('AI is speaking...');
                break;
        }
    });
});

// Event listener for text-to-speech completion
socket.on('tts_complete', function () {
    requestAnimationFrame(() => {
        if (isListening) {
            showLoadingIndicator('Listening...');
        } else {
            hideLoadingIndicator();
        }
    });
});

// Function to add user message to the conversation
function addUserMessage(message) {
    requestAnimationFrame(() => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.textContent = "You: " + message;
        conversation.insertBefore(messageElement, loadingIndicator);
        conversation.scrollTop = conversation.scrollHeight;
    });
}

// Function to add AI message to the conversation
function addAiMessage(message) {
    requestAnimationFrame(() => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'ai-message');
        messageElement.innerHTML = "AI: " + formatMessage(message);
        conversation.insertBefore(messageElement, loadingIndicator);
        conversation.scrollTop = conversation.scrollHeight;
    });
}

// Function to show loading indicator
function showLoadingIndicator(text) {
    requestAnimationFrame(() => {
        loadingIndicatorText.textContent = text;
        loadingIndicator.style.display = 'block';
    });
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    requestAnimationFrame(() => {
        loadingIndicator.style.display = 'none';
    });
}

// Function to format message and handle Pinterest links
function formatMessage(message) {
    const pinterestLinkRegex = /\[([^\]]+)\]\((https:\/\/www\.pinterest\.com\/[^\s]+)\)/g;

    const formattedMessage = message.replace(pinterestLinkRegex, (match, title, url) => {
        return `
            <a href="${url}" target="_blank" class="pinterest-link">
                <div class="pinterest-link-content">
                    <div class="pinterest-link-title">${title}</div>
                    <div class="pinterest-link-price">View on Pinterest</div>
                </div>
            </a>
        `;
    });

    return formattedMessage;
}

// Function to get video stream from webcam
function getVideoStream() {
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
            })
            .catch(function (error) {
                console.log("Something went wrong with video stream:", error);
            });
    }
}

// Initialize video stream
getVideoStream();

// Log Socket.IO version
console.log('Socket.IO version:', io.version);