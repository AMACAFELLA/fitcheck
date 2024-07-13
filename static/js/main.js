// var socket = io();
// var video = document.getElementById('webcam');
// var conversation = document.getElementById('conversation');
// var startBtn = document.getElementById('startBtn');
// var stopBtn = document.getElementById('stopBtn');
// var loading = document.getElementById('loading');
// var loadingIndicator = document.getElementById('loadingIndicator');
// var recognition;




// socket.on('connect', function () {
//     console.log('Connected to server');
// });




// startBtn.addEventListener('click', function () {
//     socket.emit('start_conversation');
//     startBtn.style.display = 'none';
//     stopBtn.style.display = 'block';
//     loadingIndicator.style.display = 'block';




//     if (recognition) {
//         recognition.start();
//         console.log("Speech recognition started");
//     }
// });




// stopBtn.addEventListener('click', function () {
//     socket.emit('stop_conversation');
//     loadingIndicator.style.display = 'block';
// });




// socket.on('conversation_stopped', function () {
//     startBtn.style.display = 'block';
//     stopBtn.style.display = 'none';
//     conversation.innerHTML = '';
//     loadingIndicator.style.display = 'none';




//     if (recognition) {
//         recognition.stop();
//         console.log("Speech recognition stopped");
//     }
// });




// if ('webkitSpeechRecognition' in window) {
//     recognition = new webkitSpeechRecognition();
//     recognition.continuous = true;
//     recognition.interimResults = true;
//     recognition.lang = 'en-US';
//     recognition.onresult = handleSpeechRecognitionResult;
// } else {
//     console.log("Speech recognition not supported");
// }




// socket.on('user_message', function (data) {
//     console.log('Received user message:', data.message);
//     addUserMessage(data.message);
// });




// socket.on('ai_response', function (data) {
//     console.log('Received AI response:', data.message);
//     addAiMessage(data.message);
// });




// function addUserMessage(message) {
//     const messageElement = document.createElement('div');
//     messageElement.classList.add('message', 'user-message');
//     messageElement.textContent = "You: " + message;
//     conversation.appendChild(messageElement);
//     conversation.scrollTop = conversation.scrollHeight;
//     loading.style.display = 'block';
// }




// function addAiMessage(message) {
//     const messageElement = document.createElement('div');
//     messageElement.classList.add('message', 'ai-message');
//     messageElement.innerHTML = "AI: " + formatMessage(message);
//     conversation.appendChild(messageElement);
//     conversation.scrollTop = conversation.scrollHeight;
//     loading.style.display = 'none';
//     loadingIndicator.style.display = 'none';
// }




// function formatMessage(message) {
//     // Regular expression to match Pinterest links in the current format
//     const pinterestLinkRegex = /(https:\/\/www\.pinterest\.com\/search\/pins\/\?[^\s]+)/g;




//     // Replace Pinterest links with formatted HTML
//     const formattedMessage = message.replace(pinterestLinkRegex, (match, url) => {
//         // Decode the URL to get a readable title
//         const decodedUrl = decodeURIComponent(url);
//         const titleMatch = decodedUrl.match(/q=([^&]+)/);
//         const title = titleMatch ? titleMatch[1].replace(/\+/g, ' ') : 'Pinterest Item';




//         return `
//           <a href="${url}" target="_blank" class="pinterest-link">
//               <img src="/api/placeholder/60/60" alt="Pinterest item">
//               <div class="pinterest-link-content">
//                   <div class="pinterest-link-title">${title}</div>
//                   <div class="pinterest-link-price">View on Pinterest</div>
//               </div>
//           </a>
//       `;
//     });




//     return formattedMessage;
// }




// function handleSpeechRecognitionResult(event) {
//     const transcript = Array.from(event.results)
//         .map(result => result[0].transcript)
//         .join('');




//     if (event.results[0].isFinal) {
//         console.log('Sending transcription:', transcript);
//         socket.emit('transcription', { data: transcript });
//     }
// }




// function getVideoStream() {
//     if (navigator.mediaDevices.getUserMedia) {
//         navigator.mediaDevices.getUserMedia({ video: true })
//             .then(function (stream) {
//                 video.srcObject = stream;
//             })
//             .catch(function (error) {
//                 console.log("Something went wrong with video stream:", error);
//             });
//     }
// }




// getVideoStream();




// console.log('Socket.IO version:', io.version);

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

    if (recognition) {
        recognition.start();
        console.log("Speech recognition started");
    }
});

stopBtn.addEventListener('click', function () {
    socket.emit('stop_conversation');
    loadingIndicator.style.display = 'block';
});

socket.on('conversation_stopped', function () {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    conversation.innerHTML = '';
    loadingIndicator.style.display = 'none';

    if (recognition) {
        recognition.stop();
        console.log("Speech recognition stopped");
    }
});

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = handleSpeechRecognitionResult;
} else {
    console.log("Speech recognition not supported");
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
    const pinterestLinkRegex = /(https:\/\/www\.pinterest\.com\/search\/pins\/\?[^\s]+)/g;

    const formattedMessage = message.replace(pinterestLinkRegex, (match, url) => {
        const decodedUrl = decodeURIComponent(url);
        const titleMatch = decodedUrl.match(/q=([^&]+)/);
        const title = titleMatch ? titleMatch[1].replace(/\+/g, ' ') : 'Pinterest Item';

        return `
         <a href="${url}" target="_blank" class="pinterest-link">
             <img src="/api/placeholder/60/60" alt="Pinterest item">
             <div class="pinterest-link-content">
                 <div class="pinterest-link-title">${title}</div>
                 <div class="pinterest-link-price">View on Pinterest</div>
             </div>
         </a>
     `;
    });

    return formattedMessage;
}

function handleSpeechRecognitionResult(event) {
    const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

    if (event.results[0].isFinal) {
        console.log('Sending transcription:', transcript);
        socket.emit('transcription', { data: transcript });
    }
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