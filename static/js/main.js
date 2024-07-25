var socket = io();
var video = document.getElementById('webcam');
var conversation = document.getElementById('conversation');
var startBtn = document.getElementById('startBtn');
var stopBtn = document.getElementById('stopBtn');
var loading = document.getElementById('loading');
var loadingIndicator = document.getElementById('loadingIndicator');
var recognition;

socket.on('connect', function () {
    console.log('Connected to server');
});

startBtn.addEventListener('click', function () {
    socket.emit('start_conversation');
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    loadingIndicator.style.display = 'block';
    startSpeechRecognition();
});

stopBtn.addEventListener('click', function () {
    socket.emit('stop_conversation');
    loadingIndicator.style.display = 'block';
    stopSpeechRecognition();
});

socket.on('conversation_stopped', function () {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    conversation.innerHTML = '';
    loadingIndicator.style.display = 'none';
    stopSpeechRecognition();
});

function startSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = handleSpeechRecognitionResult;
        recognition.onend = function () {
            console.log("Speech recognition ended. Restarting...");
            recognition.start();
        };
        recognition.start();
        console.log("Speech recognition started");
    } else {
        console.log("Speech recognition not supported");
    }
}

function stopSpeechRecognition() {
    if (recognition) {
        recognition.stop();
        console.log("Speech recognition stopped");
    }
}

function handleSpeechRecognitionResult(event) {
    const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

    if (event.results[0].isFinal) {
        console.log('Sending transcription:', transcript);
        socket.emit('transcription', { data: transcript });
        addUserMessage(transcript);
    }
}

socket.on('user_message', function (data) {
    console.log('Received user message:', data.message);
    addUserMessage(data.message);
});

socket.on('ai_response', function (data) {
    console.log('Received AI response:', data.message);
    addAiMessage(data.message);
});

function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = "You: " + message;
    conversation.appendChild(messageElement);
    conversation.scrollTop = conversation.scrollHeight;
    loading.style.display = 'block';
}

function addAiMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');
    messageElement.innerHTML = "AI: " + formatMessage(message);
    conversation.appendChild(messageElement);
    conversation.scrollTop = conversation.scrollHeight;
    loading.style.display = 'none';
    loadingIndicator.style.display = 'none';
}

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

getVideoStream();

console.log('Socket.IO version:', io.version);