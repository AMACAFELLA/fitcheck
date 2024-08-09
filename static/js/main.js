// var socket = io({
//     reconnectionAttempts: 3,
//     timeout: 10000
// });

// var video = document.getElementById('webcam');
// var conversation = document.getElementById('conversation');
// var startBtn = document.getElementById('startBtn');
// var stopBtn = document.getElementById('stopBtn');
// var loadingIndicator = document.getElementById('loadingIndicator');
// var loadingIndicatorText = loadingIndicator.querySelector('.loading-indicator-text');

// var recognition;
// var isListening = false;

// socket.on('connect', function () {
//     console.log('Connected to server');
// });

// socket.on('connect_error', function (error) {
//     console.error('Connection error:', error);
// });

// socket.on('error', function (error) {
//     console.error('Socket error:', error);
//     if (error !== 'xhr poll error') {
//         handleError(error);
//     }
// });

// startBtn.addEventListener('click', startConversation);
// stopBtn.addEventListener('click', stopConversation);

// function startConversation() {
//     socket.emit('start_conversation');
//     startBtn.classList.add('hidden');
//     stopBtn.classList.remove('hidden');
//     resetConversation();
//     showLoadingIndicator('Listening...');
//     startSpeechRecognition();
//     animateElement(stopBtn, 'animate__fadeIn');
//     stopBtn.focus();
//     announceConversationState('start');
// }

// function stopConversation() {
//     socket.emit('stop_conversation');
//     showLoadingIndicator('Ending conversation...');
//     stopSpeechRecognition();
//     announceConversationState('stop');
// }

// socket.on('conversation_stopped', function () {
//     startBtn.classList.remove('hidden');
//     stopBtn.classList.add('hidden');
//     resetConversation();
//     stopSpeechRecognition();
//     animateElement(startBtn, 'animate__fadeIn');
//     startBtn.focus();
// });

// function resetConversation() {
//     conversation.innerHTML = '';
//     conversation.appendChild(loadingIndicator);
//     hideLoadingIndicator();
// }

// function startSpeechRecognition() {
//     if ('webkitSpeechRecognition' in window) {
//         recognition = new webkitSpeechRecognition();
//         recognition.continuous = true;
//         recognition.interimResults = true;
//         recognition.lang = 'en-US';
//         recognition.onresult = handleSpeechRecognitionResult;
//         recognition.onend = function () {
//             if (isListening) {
//                 console.log("Speech recognition ended. Restarting...");
//                 setTimeout(() => {
//                     recognition.start();
//                 }, 1000);
//             }
//         };
//         recognition.start();
//         isListening = true;
//         console.log("Speech recognition started");
//         showLoadingIndicator('Listening...');
//     } else {
//         console.log("Speech recognition not supported");
//         addAiMessage("I'm sorry, but speech recognition is not supported in your browser.");
//     }
// }

// function stopSpeechRecognition() {
//     if (recognition) {
//         recognition.stop();
//         isListening = false;
//         console.log("Speech recognition stopped");
//     }
// }

// function handleSpeechRecognitionResult(event) {
//     const transcript = Array.from(event.results)
//         .map(result => result[0].transcript)
//         .join('');

//     if (event.results[0].isFinal) {
//         console.log('Sending transcription:', transcript);
//         socket.emit('transcription', { data: transcript });
//         showLoadingIndicator('Processing...');
//     }
// }

// socket.on('user_message', function (data) {
//     console.log('Received user message:', data.message);
//     addUserMessage(data.message);
// });

// socket.on('ai_response', function (data) {
//     console.log('Received AI response:', data.message);
//     addAiMessage(data.message);
// });

// socket.on('listening_state', function (data) {
//     console.log('Listening state:', data.state);
//     requestAnimationFrame(() => {
//         switch (data.state) {
//             case 'listening':
//                 showLoadingIndicator('Listening...');
//                 break;
//             case 'processing':
//                 showLoadingIndicator('Processing...');
//                 break;
//             case 'ai_speaking':
//                 showLoadingIndicator('AI is speaking...');
//                 break;
//         }
//     });
// });

// socket.on('tts_complete', function () {
//     requestAnimationFrame(() => {
//         if (isListening) {
//             showLoadingIndicator('Listening...');
//         } else {
//             hideLoadingIndicator();
//         }
//     });
// });

// function addUserMessage(message) {
//     requestAnimationFrame(() => {
//         const messageElement = document.createElement('div');
//         messageElement.classList.add('message', 'user-message', 'animate__animated', 'animate__fadeInRight');
//         messageElement.textContent = "You: " + message;
//         messageElement.setAttribute('role', 'log');
//         messageElement.setAttribute('aria-label', 'User message: ' + message);
//         conversation.insertBefore(messageElement, loadingIndicator);
//         conversation.scrollTop = conversation.scrollHeight;
//     });
// }

// function addAiMessage(message) {
//     requestAnimationFrame(() => {
//         const messageElement = document.createElement('div');
//         messageElement.classList.add('message', 'ai-message', 'animate__animated', 'animate__fadeInLeft');
//         messageElement.innerHTML = "AI: " + formatMessage(message);
//         messageElement.setAttribute('role', 'log');
//         messageElement.setAttribute('tabindex', '0');
//         messageElement.setAttribute('aria-label', 'AI response: ' + stripHtml(message));
//         conversation.insertBefore(messageElement, loadingIndicator);
//         conversation.scrollTop = conversation.scrollHeight;
//         announceAiResponse(message);
//     });
// }

// function stripHtml(html) {
//     let tmp = document.createElement("DIV");
//     tmp.innerHTML = html;
//     return tmp.textContent || tmp.innerText || "";
// }

// function showLoadingIndicator(text) {
//     requestAnimationFrame(() => {
//         loadingIndicatorText.textContent = text;
//         loadingIndicator.style.display = 'block';
//         loadingIndicator.setAttribute('aria-label', text);
//         animateElement(loadingIndicator, 'animate__fadeIn');
//     });
// }

// function hideLoadingIndicator() {
//     requestAnimationFrame(() => {
//         animateElement(loadingIndicator, 'animate__fadeOut', () => {
//             loadingIndicator.style.display = 'none';
//         });
//     });
// }

// function formatMessage(message) {
//     const pinterestLinkRegex = /\[([^\]]+)\]\((https:\/\/www\.pinterest\.com\/[^\s]+)\)/g;

//     return message.replace(pinterestLinkRegex, (match, title, url) => {
//         if (title.trim() === '') return '';
//         const searchQuery = title.replace(/\s+/g, '+');
//         const encodedUrl = `https://www.pinterest.com/search/pins/?q=${searchQuery}`;
//         return `
//             <a href="${encodedUrl}" target="_blank" class="pinterest-link flex items-center bg-white border border-gray-200 rounded-lg p-2 mb-2 hover:bg-gray-50" aria-label="View on Pinterest: ${title}">
//                 <img src="https://cdn-icons-png.flaticon.com/512/220/220214.png" alt="Pinterest icon" class="w-6 h-6 mr-2">
//                 <span class="text-blue-500 hover:underline">${title}</span>
//             </a>
//         `;
//     });
// }

// function getVideoStream() {
//     if (navigator.mediaDevices.getUserMedia) {
//         navigator.mediaDevices.getUserMedia({ video: true })
//             .then(function (stream) {
//                 video.srcObject = stream;
//             })
//             .catch(function (error) {
//                 console.log("Something went wrong with video stream:", error);
//                 addAiMessage("I'm sorry, but I couldn't access your camera. Please make sure you've granted permission and try again.");
//             });
//     }
// }

// function animateElement(element, animationClass, callback) {
//     element.classList.add('animate__animated', animationClass);
//     element.addEventListener('animationend', () => {
//         element.classList.remove('animate__animated', animationClass);
//         if (callback) callback();
//     }, { once: true });
// }

// function toggleHighContrast() {
//     document.body.classList.toggle('high-contrast');

//     const highContrastBtn = document.getElementById('highContrastBtn');
//     if (document.body.classList.contains('high-contrast')) {
//         highContrastBtn.textContent = 'Disable High Contrast';
//         highContrastBtn.setAttribute('aria-pressed', 'true');
//     } else {
//         highContrastBtn.textContent = 'Enable High Contrast';
//         highContrastBtn.setAttribute('aria-pressed', 'false');
//     }

//     announceChange(document.body.classList.contains('high-contrast')
//         ? 'High contrast mode enabled'
//         : 'High contrast mode disabled');

//     console.log('Toggled high contrast');
// }

// function announceChange(message) {
//     const announcement = document.createElement('div');
//     announcement.setAttribute('aria-live', 'polite');
//     announcement.className = 'sr-only';
//     announcement.textContent = message;
//     document.body.appendChild(announcement);

//     setTimeout(() => {
//         document.body.removeChild(announcement);
//     }, 1000);
// }

// function setupAccessibilityListeners() {
//     const buttons = {
//         'highContrastBtn': toggleHighContrast,
//         'protanopiaBtn': () => applyColorBlindnessFilter('protanopia'),
//         'deuteranopiaBtn': () => applyColorBlindnessFilter('deuteranopia'),
//         'tritanopiaBtn': () => applyColorBlindnessFilter('tritanopia'),
//         'resetFilterBtn': resetFilter
//     };

//     for (const [id, func] of Object.entries(buttons)) {
//         const button = document.getElementById(id);
//         if (button) {
//             button.addEventListener('click', func);
//             console.log(`Added listener for ${id}`);
//         } else {
//             console.error(`Button with id ${id} not found`);
//         }
//     }
// }

// function changeFontSize(delta) {
//     const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
//     document.body.style.fontSize = (currentSize + delta) + 'px';
// }

// function displayOutfitHistory() {
//     console.log("displayOutfitHistory function called");
//     fetch('/outfit_history')
//         .then(response => {
//             console.log("Received response from server");
//             return response.json();
//         })
//         .then(data => {
//             console.log("Parsed JSON data:", data);

//             const existingHistory = document.querySelector('.outfit-history');
//             if (existingHistory) {
//                 existingHistory.remove();
//             }

//             if (!data.outfits || data.outfits.length === 0) {
//                 console.log("No outfit history found");
//                 showNoHistoryPopup();
//                 return;
//             }

//             const groupedHistory = groupByDate(data.outfits);
//             let historyHtml = '<h3 class="text-2xl font-bold mb-4">Outfit History</h3>';
//             historyHtml += '<ul class="date-list">';

//             Object.keys(groupedHistory).forEach(date => {
//                 const formattedDate = new Date(date).toLocaleDateString('en-US', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric'
//                 });
//                 const summary = groupedHistory[date][0].user_input.substring(0, 50) + '...';

//                 historyHtml += `
//                     <li class="date-item mb-4">
//                         <button class="date-button bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 w-full text-left" data-date="${date}">
//                             <span class="font-bold">${formattedDate}</span>
//                             <br>
//                             <span class="text-sm">${summary}</span>
//                         </button>
//                         <div class="outfit-details hidden mt-2" id="outfit-${date}"></div>
//                     </li>
//                 `;
//             });

//             historyHtml += '</ul>';

//             const historyElement = document.createElement('div');
//             historyElement.innerHTML = historyHtml;
//             historyElement.classList.add('outfit-history', 'fixed', 'top-0', 'right-0', 'h-full', 'w-full', 'md:w-1/3', 'bg-gray-100', 'p-6', 'overflow-y-auto', 'shadow-lg', 'z-50');

//             const closeButton = document.createElement('button');
//             closeButton.textContent = 'Close';
//             closeButton.classList.add('absolute', 'top-4', 'right-4', 'bg-red-500', 'text-white', 'py-2', 'px-4', 'rounded-lg', 'hover:bg-red-600', 'transition', 'duration-300');
//             closeButton.setAttribute('aria-label', 'Close outfit history');
//             closeButton.addEventListener('click', () => historyElement.remove());
//             historyElement.prepend(closeButton);

//             const deleteAllButton = document.createElement('button');
//             deleteAllButton.textContent = 'Delete All History';
//             deleteAllButton.classList.add('bg-red-500', 'text-white', 'py-2', 'px-4', 'rounded-lg', 'hover:bg-red-600', 'transition', 'duration-300', 'mt-4');
//             deleteAllButton.setAttribute('aria-label', 'Delete all outfit history');
//             deleteAllButton.addEventListener('click', deleteAllHistory);
//             historyElement.appendChild(deleteAllButton);
//             document.body.appendChild(historyElement);

//             console.log("History element added to the DOM");

//             historyElement.querySelectorAll('.date-button').forEach(btn => {
//                 btn.addEventListener('click', (e) => {
//                     e.preventDefault();
//                     const date = e.currentTarget.dataset.date;
//                     const outfitDetails = document.getElementById(`outfit-${date}`);
//                     if (outfitDetails.classList.contains('hidden')) {
//                         outfitDetails.innerHTML = groupedHistory[date].map((outfit, index) => `<div class="outfit-history-item bg-white rounded-lg shadow-md p-4 mb-4">
//                         <p class="mb-2"><strong>User Input:</strong> ${outfit.user_input || 'N/A'}</p>
//                         <p><strong>AI Response:</strong> ${formatMessage(outfit.ai_response || 'N/A')}</p>
//                         <button class="delete-outfit-btn bg-red-500 text-white py-1 px-2 rounded-lg hover:bg-red-600 transition duration-300 mt-2" data-date="${date}" data-index="${index}" aria-label="Delete this outfit">Delete</button>
//                     </div>
//                 `).join('');
//                         outfitDetails.classList.remove('hidden');

//                         outfitDetails.querySelectorAll('.delete-outfit-btn').forEach(deleteBtn => {
//                             deleteBtn.addEventListener('click', (e) => {
//                                 e.stopPropagation();
//                                 const date = e.target.dataset.date;
//                                 const index = parseInt(e.target.dataset.index);
//                                 deleteOutfit(date, index);
//                             });
//                         });
//                     } else {
//                         outfitDetails.classList.add('hidden');
//                     }
//                 });
//             });
//         })
//         .catch(error => {
//             console.error('Error fetching outfit history:', error);
//             showNoHistoryPopup();
//         });
// }

// function showNoHistoryPopup() {
//     const popup = document.createElement('div');
//     popup.innerHTML = `
//         <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="no-history-popup">
//             <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
//                 <div class="mt-3 text-center">
//                     <h3 class="text-lg leading-6 font-medium text-gray-900">No Outfit History</h3>
//                     <div class="mt-2 px-7 py-3">
//                         <p class="text-sm text-gray-500">There is no outfit history available yet. Start a conversation to create some!</p>
//                     </div>
//                     <div class="items-center px-4 py-3">
//                         <button id="close-popup" class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
//                             Close
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;
//     document.body.appendChild(popup);

//     document.getElementById('close-popup').addEventListener('click', () => {
//         popup.remove();
//     });
// }

// function groupByDate(outfits) {
//     return outfits.reduce((acc, outfit) => {
//         const date = outfit.date.split('T')[0];
//         if (!acc[date]) {
//             acc[date] = [];
//         }
//         acc[date].push(outfit);
//         return acc;
//     }, {});
// }

// function deleteOutfit(date, index) {
//     fetch('/delete_outfit', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ date, index }),
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 const outfitElement = document.querySelector(`#outfit-${date.split('T')[0]} .outfit-history-item:nth-child(${index + 1})`);
//                 if (outfitElement) {
//                     outfitElement.remove();
//                 }
//                 const outfitDetails = document.getElementById(`outfit-${date.split('T')[0]}`);
//                 if (outfitDetails && outfitDetails.children.length === 0) {
//                     const dateButton = document.querySelector(`[data-date="${date.split('T')[0]}"]`);
//                     if (dateButton) {
//                         dateButton.closest('.date-item').remove();
//                     }
//                 }
//                 console.log(`Outfit deleted successfully: date ${date}, index ${index}`);
//             } else {
//                 console.error('Failed to delete outfit:', data.error || 'Unknown error');
//             }
//         })
//         .catch(error => {
//             console.error('Error deleting outfit:', error);
//         });
// }

// function deleteAllHistory() {
//     if (confirm('Are you sure you want to delete all outfit history? This action cannot be undone.')) {
//         fetch('/delete_all_history', {
//             method: 'POST',
//         })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.success) {
//                     const historyElement = document.querySelector('.outfit-history');
//                     if (historyElement) {
//                         historyElement.remove();
//                     }
//                     showNoHistoryPopup();
//                 } else {
//                     console.error('Failed to delete all history:', data.error);
//                 }
//             })
//             .catch(error => {
//                 console.error('Error deleting all history:', error);
//             });
//     }
// }

// function announceAiResponse(message) {
//     const announcement = document.createElement('div');
//     announcement.setAttribute('aria-live', 'assertive');
//     announcement.className = 'sr-only';
//     announcement.textContent = 'New AI response: ' + stripHtml(message);
//     document.body.appendChild(announcement);

//     setTimeout(() => {
//         document.body.removeChild(announcement);
//     }, 1000);
// }

// function handleError(error) {
//     console.error('An error occurred:', error);
//     if (document.querySelector('.message')) {
//         addAiMessage("I'm sorry, but an error occurred. Please try again or contact support if the problem persists.");
//     }
// }

// function checkBrowserSupport() {
//     if (!('webkitSpeechRecognition' in window)) {
//         addAiMessage("Your browser doesn't support speech recognition. You can still type your messages, but voice input won't be available.");
//     }

//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//         addAiMessage("Your browser doesn't support accessing the camera. You can still use the chat functionality, but outfit analysis won't be available.");
//     }
// }

// function setupKeyboardNavigation() {
//     const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
//     const modal = document.querySelector('#accessibilityModal');

//     document.addEventListener('keydown', function (e) {
//         if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
//             closeAccessibilityModal();
//         }

//         if (e.key === 'Tab' && !modal.classList.contains('hidden')) {
//             const focusableContent = modal.querySelectorAll(focusableElements);
//             const firstFocusableElement = focusableContent[0];
//             const lastFocusableElement = focusableContent[focusableContent.length - 1];

//             if (e.shiftKey) {
//                 if (document.activeElement === firstFocusableElement) {
//                     lastFocusableElement.focus();
//                     e.preventDefault();
//                 }
//             } else {
//                 if (document.activeElement === lastFocusableElement) {
//                     firstFocusableElement.focus();
//                     e.preventDefault();
//                 }
//             }
//         }
//     });
// }

// document.getElementById('accessibilityBtn').addEventListener('click', () => {
//     document.getElementById('accessibilityModal').classList.remove('hidden');
//     document.querySelector('#accessibilityModal button').focus();
// });

// function closeAccessibilityModal() {
//     document.getElementById('accessibilityModal').classList.add('hidden');
//     document.getElementById('accessibilityBtn').focus();
// }

// document.getElementById('closeAccessibilityModal').addEventListener('click', closeAccessibilityModal);

// document.getElementById('textSizeSlider').addEventListener('input', (e) => {
//     document.body.style.fontSize = `${e.target.value}px`;
// });

// document.getElementById('lineSpacingSlider').addEventListener('input', (e) => {
//     document.body.style.lineHeight = e.target.value;
// });

// document.getElementById('dyslexiaFontToggle').addEventListener('change', (e) => {
//     document.body.style.fontFamily = e.target.checked ? 'OpenDyslexic, sans-serif' : 'inherit';
// });

// function applyColorBlindnessFilter(type) {
//     resetFilter(); // Remove any existing filter first
//     document.body.classList.add(`filter-${type}`);
//     console.log(`Applied ${type} filter`);
// }

// function resetFilter() {
//     document.body.classList.remove('filter-protanopia', 'filter-deuteranopia', 'filter-tritanopia');
//     console.log('Reset filter');
// }

// function initializeAccessibility() {
//     setupKeyboardNavigation();
//     setupAccessibilityListeners();
//     addTooltip(startBtn, 'Keyboard shortcut: Shift + Alt + S');
//     addTooltip(stopBtn, 'Keyboard shortcut: Shift + Alt + X');
//     addTooltip(document.getElementById('accessibilityBtn'), 'Keyboard shortcut: Shift + Alt + A');
//     addTooltip(document.getElementById('historyBtn'), 'Keyboard shortcut: Shift + Alt + H');
// }

// function addTooltip(element, text) {
//     element.setAttribute('title', text);
//     element.setAttribute('aria-label', `${element.textContent} (${text})`);
// }

// function announceConversationState(state) {
//     const announcement = document.createElement('div');
//     announcement.setAttribute('aria-live', 'assertive');
//     announcement.className = 'sr-only';
//     announcement.textContent = state === 'start' ? 'Conversation started' : 'Conversation ended';
//     document.body.appendChild(announcement);

//     setTimeout(() => {
//         document.body.removeChild(announcement);
//     }, 1000);
// }

// document.addEventListener('keydown', (e) => {
//     if (e.shiftKey && e.altKey) {
//         switch (e.key) {
//             case 'S':
//             case 's':
//                 e.preventDefault();
//                 startConversation();
//                 break;
//             case 'X':
//             case 'x':
//                 e.preventDefault();
//                 stopConversation();
//                 break;
//             case 'A':
//             case 'a':
//                 e.preventDefault();
//                 document.getElementById('accessibilityBtn').click();
//                 break;
//             case 'H':
//             case 'h':
//                 e.preventDefault();
//                 document.getElementById('historyBtn').click();
//                 break;
//         }
//     }
// });

// window.addEventListener('load', () => {
//     checkBrowserSupport();
//     getVideoStream();
//     initializeAccessibility();

//     document.getElementById('highContrastBtn').addEventListener('click', toggleHighContrast);
//     document.getElementById('historyBtn').addEventListener('click', () => {
//         console.log("History button clicked");
//         displayOutfitHistory();
//     });
// });

// console.log('Socket.IO version:', io.version);

// Initialize Socket.IO connection with reconnection attempts and timeout
var socket = io({
    reconnectionAttempts: 3,
    timeout: 10000
});

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

// Socket.IO event listeners
socket.on('connect', function () {
    console.log('Connected to server');
});

socket.on('connect_error', function (error) {
    console.error('Connection error:', error);
});

socket.on('error', function (error) {
    console.error('Socket error:', error);
    if (error !== 'xhr poll error') {
        handleError(error);
    }
});
socket.on('update_webcam_image', function (data) {
    updateWebcamImage(data.image);
});

// Add this function to update the webcam image
function updateWebcamImage(imageBase64) {
    const webcamElement = document.getElementById('webcam');
    if (webcamElement) {
        webcamElement.src = `data:image/jpeg;base64,${imageBase64}`;
    }
}

// Add event listeners to start and stop buttons
startBtn.addEventListener('click', startConversation);
stopBtn.addEventListener('click', stopConversation);

// Function to start the conversation
function startConversation() {
    socket.emit('start_conversation');
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    resetConversation();
    showLoadingIndicator('Listening...');
    startSpeechRecognition();
    animateElement(stopBtn, 'animate__fadeIn');
    stopBtn.focus();
    announceConversationState('start');
}

// Function to stop the conversation
function stopConversation() {
    socket.emit('stop_conversation');
    showLoadingIndicator('Ending conversation...');
    stopSpeechRecognition();
    announceConversationState('stop');
    // Clear the webcam image
    const webcamElement = document.getElementById('webcam');
    if (webcamElement) {
        webcamElement.src = '';
    }
}

// Handle conversation stopped event
socket.on('conversation_stopped', function () {
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    resetConversation();
    stopSpeechRecognition();
    animateElement(startBtn, 'animate__fadeIn');
    startBtn.focus();
    // Clear the webcam image
    const webcamElement = document.getElementById('webcam');
    if (webcamElement) {
        webcamElement.src = '';
    }
});

// Reset the conversation UI
function resetConversation() {
    conversation.innerHTML = '';
    conversation.appendChild(loadingIndicator);
    hideLoadingIndicator();
}

// Start speech recognition
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
                setTimeout(() => {
                    recognition.start();
                }, 1000);
            }
        };
        recognition.start();
        isListening = true;
        console.log("Speech recognition started");
        showLoadingIndicator('Listening...');
    } else {
        console.log("Speech recognition not supported");
        addAiMessage("I'm sorry, but speech recognition is not supported in your browser.");
    }
}

// Stop speech recognition
function stopSpeechRecognition() {
    if (recognition) {
        recognition.stop();
        isListening = false;
        console.log("Speech recognition stopped");
    }
}

// Handle speech recognition results
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

function captureWebcam() {
    socket.emit('get_image');
}

socket.on('webcam_updated', function (data) {
    updateWebcamImage(data.image);
});


// Handle user message event
socket.on('user_message', function (data) {
    console.log('Received user message:', data.message);
    addUserMessage(data.message);
});

// Handle AI response event
socket.on('ai_response', function (data) {
    console.log('Received AI response:', data.message);
    addAiMessage(data.message);
});

// Handle listening state changes
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

// Handle text-to-speech completion
socket.on('tts_complete', function () {
    requestAnimationFrame(() => {
        if (isListening) {
            showLoadingIndicator('Listening...');
        } else {
            hideLoadingIndicator();
        }
    });
});

// Add user message to the conversation
function addUserMessage(message) {
    requestAnimationFrame(() => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message', 'animate__animated', 'animate__fadeInRight');
        messageElement.textContent = "You: " + message;
        messageElement.setAttribute('role', 'log');
        messageElement.setAttribute('aria-label', 'User message: ' + message);
        conversation.insertBefore(messageElement, loadingIndicator);
        conversation.scrollTop = conversation.scrollHeight;
    });
}

// Add AI message to the conversation
function addAiMessage(message) {
    requestAnimationFrame(() => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'ai-message', 'animate__animated', 'animate__fadeInLeft');
        messageElement.innerHTML = "AI: " + formatMessage(message);
        messageElement.setAttribute('role', 'log');
        messageElement.setAttribute('tabindex', '0');
        messageElement.setAttribute('aria-label', 'AI response: ' + stripHtml(message));
        conversation.insertBefore(messageElement, loadingIndicator);
        conversation.scrollTop = conversation.scrollHeight;
        announceAiResponse(message);
    });
}

// Strip HTML tags from a string
function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Show loading indicator
function showLoadingIndicator(text) {
    requestAnimationFrame(() => {
        loadingIndicatorText.textContent = text;
        loadingIndicator.style.display = 'block';
        loadingIndicator.setAttribute('aria-label', text);
        animateElement(loadingIndicator, 'animate__fadeIn');
    });
}

// Hide loading indicator
function hideLoadingIndicator() {
    requestAnimationFrame(() => {
        animateElement(loadingIndicator, 'animate__fadeOut', () => {
            loadingIndicator.style.display = 'none';
        });
    });
}

// Format message with Pinterest links
function formatMessage(message) {
    const pinterestLinkRegex = /\[([^\]]+)\]\((https:\/\/www\.pinterest\.com\/[^\s]+)\)/g;

    return message.replace(pinterestLinkRegex, (match, title, url) => {
        if (title.trim() === '') return '';
        const searchQuery = title.replace(/\s+/g, '+');
        const encodedUrl = `https://www.pinterest.com/search/pins/?q=${searchQuery}`;
        return `
            <a href="${encodedUrl}" target="_blank" class="pinterest-link flex items-center bg-white border border-gray-200 rounded-lg p-2 mb-2 hover:bg-gray-50" aria-label="View on Pinterest: ${title}">
                <img src="https://cdn-icons-png.flaticon.com/512/220/220214.png" alt="Pinterest icon" class="w-6 h-6 mr-2">
                <span class="text-blue-500 hover:underline">${title}</span>
            </a>
        `;
    });
}

// Get video stream from webcam
function getVideoStream() {
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
            })
            .catch(function (error) {
                console.log("Something went wrong with video stream:", error);
                addAiMessage("I'm sorry, but I couldn't access your camera. Please make sure you've granted permission and try again.");
            });
    }
}

// Animate element with CSS classes
function animateElement(element, animationClass, callback) {
    element.classList.add('animate__animated', animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove('animate__animated', animationClass);
        if (callback) callback();
    }, { once: true });
}

// Toggle high contrast mode
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');

    const highContrastBtn = document.getElementById('highContrastBtn');
    if (document.body.classList.contains('high-contrast')) {
        highContrastBtn.textContent = 'Disable High Contrast';
        highContrastBtn.setAttribute('aria-pressed', 'true');
    } else {
        highContrastBtn.textContent = 'Enable High Contrast';
        highContrastBtn.setAttribute('aria-pressed', 'false');
    }

    announceChange(document.body.classList.contains('high-contrast')
        ? 'High contrast mode enabled'
        : 'High contrast mode disabled');

    console.log('Toggled high contrast');
}

// Announce changes for screen readers
function announceChange(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Set up accessibility feature listeners
function setupAccessibilityListeners() {
    const buttons = {
        'highContrastBtn': toggleHighContrast,
        'protanopiaBtn': () => applyColorBlindnessFilter('protanopia'),
        'deuteranopiaBtn': () => applyColorBlindnessFilter('deuteranopia'),
        'tritanopiaBtn': () => applyColorBlindnessFilter('tritanopia'),
        'resetFilterBtn': resetFilter
    };

    for (const [id, func] of Object.entries(buttons)) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', func);
            console.log(`Added listener for ${id}`);
        } else {
            console.error(`Button with id ${id} not found`);
        }
    }
}

// Change font size
function changeFontSize(delta) {
    const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
    document.body.style.fontSize = (currentSize + delta) + 'px';
}

// Display outfit history
function displayOutfitHistory() {
    console.log("displayOutfitHistory function called");
    fetch('/outfit_history')
        .then(response => {
            console.log("Received response from server");
            return response.json();
        })
        .then(data => {
            console.log("Parsed JSON data:", data);

            const existingHistory = document.querySelector('.outfit-history');
            if (existingHistory) {
                existingHistory.remove();
            }

            if (!data.outfits || data.outfits.length === 0) {
                console.log("No outfit history found");
                showNoHistoryPopup();
                return;
            }

            const groupedHistory = groupByDate(data.outfits);
            let historyHtml = '<h3 class="text-2xl font-bold mb-4">Outfit History</h3>';
            historyHtml += '<ul class="date-list">';

            Object.keys(groupedHistory).forEach(date => {
                const formattedDate = new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const summary = groupedHistory[date][0].user_input.substring(0, 50) + '...';

                historyHtml += `
                    <li class="date-item mb-4">
                        <button class="date-button bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 w-full text-left" data-date="${date}">
                            <span class="font-bold">${formattedDate}</span>
                            <br>
                            <span class="text-sm">${summary}</span>
                        </button>
                        <div class="outfit-details hidden mt-2" id="outfit-${date}"></div>
                    </li>
                `;
            });

            historyHtml += '</ul>';

            const historyElement = document.createElement('div');
            historyElement.innerHTML = historyHtml;
            historyElement.classList.add('outfit-history', 'fixed', 'top-0', 'right-0', 'h-full', 'w-full', 'md:w-1/3', 'bg-gray-100', 'p-6', 'overflow-y-auto', 'shadow-lg', 'z-50');

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.classList.add('absolute', 'top-4', 'right-4', 'bg-red-500', 'text-white', 'py-2', 'px-4', 'rounded-lg', 'hover:bg-red-600', 'transition', 'duration-300');
            closeButton.setAttribute('aria-label', 'Close outfit history');
            closeButton.addEventListener('click', () => historyElement.remove());
            historyElement.prepend(closeButton);

            const deleteAllButton = document.createElement('button');
            deleteAllButton.textContent = 'Delete All History';
            deleteAllButton.classList.add('bg-red-500', 'text-white', 'py-2', 'px-4', 'rounded-lg', 'hover:bg-red-600', 'transition', 'duration-300', 'mt-4');
            deleteAllButton.setAttribute('aria-label', 'Delete all outfit history');
            deleteAllButton.addEventListener('click', deleteAllHistory);
            historyElement.appendChild(deleteAllButton);
            document.body.appendChild(historyElement);

            console.log("History element added to the DOM");

            historyElement.querySelectorAll('.date-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const date = e.currentTarget.dataset.date;
                    const outfitDetails = document.getElementById(`outfit-${date}`);
                    if (outfitDetails.classList.contains('hidden')) {
                        outfitDetails.innerHTML = groupedHistory[date].map((outfit, index) => `<div class="outfit-history-item bg-white rounded-lg shadow-md p-4 mb-4">
                        <p class="mb-2"><strong>User Input:</strong> ${outfit.user_input || 'N/A'}</p>
                        <p><strong>AI Response:</strong> ${formatMessage(outfit.ai_response || 'N/A')}</p>
                        <button class="delete-outfit-btn bg-red-500 text-white py-1 px-2 rounded-lg hover:bg-red-600 transition duration-300 mt-2" data-date="${date}" data-index="${index}" aria-label="Delete this outfit">Delete</button>
                    </div>
                `).join('');
                        outfitDetails.classList.remove('hidden');

                        outfitDetails.querySelectorAll('.delete-outfit-btn').forEach(deleteBtn => {
                            deleteBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const date = e.target.dataset.date;
                                const index = parseInt(e.target.dataset.index);
                                deleteOutfit(date, index);
                            });
                        });
                    } else {
                        outfitDetails.classList.add('hidden');
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching outfit history:', error);
            showNoHistoryPopup();
        });
}

// Show popup when no outfit history is available
function showNoHistoryPopup() {
    const popup = document.createElement('div');
    popup.innerHTML = `
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="no-history-popup">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">No Outfit History</h3>
                    <div class="mt-2 px-7 py-3">
                        <p class="text-sm text-gray-500">There is no outfit history available yet. Start a conversation to create some!</p>
                    </div>
                    <div class="items-center px-4 py-3">
                        <button id="close-popup" class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('close-popup').addEventListener('click', () => {
        popup.remove();
    });
}

// Group outfits by date
function groupByDate(outfits) {
    return outfits.reduce((acc, outfit) => {
        const date = outfit.date.split('T')[0];
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(outfit);
        return acc;
    }, {});
}

// Delete a specific outfit
function deleteOutfit(date, index) {
    fetch('/delete_outfit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, index }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const outfitElement = document.querySelector(`#outfit-${date.split('T')[0]} .outfit-history-item:nth-child(${index + 1})`);
                if (outfitElement) {
                    outfitElement.remove();
                }
                const outfitDetails = document.getElementById(`outfit-${date.split('T')[0]}`);
                if (outfitDetails && outfitDetails.children.length === 0) {
                    const dateButton = document.querySelector(`[data-date="${date.split('T')[0]}"]`);
                    if (dateButton) {
                        dateButton.closest('.date-item').remove();
                    }
                }
                console.log(`Outfit deleted successfully: date ${date}, index ${index}`);
            } else {
                console.error('Failed to delete outfit:', data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error deleting outfit:', error);
        });
}

// Delete all outfit history
function deleteAllHistory() {
    if (confirm('Are you sure you want to delete all outfit history? This action cannot be undone.')) {
        fetch('/delete_all_history', {
            method: 'POST',
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const historyElement = document.querySelector('.outfit-history');
                    if (historyElement) {
                        historyElement.remove();
                    }
                    showNoHistoryPopup();
                } else {
                    console.error('Failed to delete all history:', data.error);
                }
            })
            .catch(error => {
                console.error('Error deleting all history:', error);
            });
    }
}

// Announce AI response for screen readers
function announceAiResponse(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.className = 'sr-only';
    announcement.textContent = 'New AI response: ' + stripHtml(message);
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Handle errors
function handleError(error) {
    console.error('An error occurred:', error);
    if (document.querySelector('.message')) {
        addAiMessage("I'm sorry, but an error occurred. Please try again or contact support if the problem persists.");
    }
}

// Check browser support for speech recognition and camera
function checkBrowserSupport() {
    if (!('webkitSpeechRecognition' in window)) {
        addAiMessage("Your browser doesn't support speech recognition. You can still type your messages, but voice input won't be available.");
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addAiMessage("Your browser doesn't support accessing the camera. You can still use the chat functionality, but outfit analysis won't be available.");
    }
}

// Set up keyboard navigation for accessibility
function setupKeyboardNavigation() {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = document.querySelector('#accessibilityModal');

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeAccessibilityModal();
        }

        if (e.key === 'Tab' && !modal.classList.contains('hidden')) {
            const focusableContent = modal.querySelectorAll(focusableElements);
            const firstFocusableElement = focusableContent[0];
            const lastFocusableElement = focusableContent[focusableContent.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Event listener for accessibility button
document.getElementById('accessibilityBtn').addEventListener('click', () => {
    document.getElementById('accessibilityModal').classList.remove('hidden');
    document.querySelector('#accessibilityModal button').focus();
});

// Close accessibility modal
function closeAccessibilityModal() {
    document.getElementById('accessibilityModal').classList.add('hidden');
    document.getElementById('accessibilityBtn').focus();
}

// Event listener for closing accessibility modal
document.getElementById('closeAccessibilityModal').addEventListener('click', closeAccessibilityModal);

// Event listener for text size slider
document.getElementById('textSizeSlider').addEventListener('input', (e) => {
    document.body.style.fontSize = `${e.target.value}px`;
});

// Event listener for line spacing slider
document.getElementById('lineSpacingSlider').addEventListener('input', (e) => {
    document.body.style.lineHeight = e.target.value;
});

// Event listener for dyslexia-friendly font toggle
document.getElementById('dyslexiaFontToggle').addEventListener('change', (e) => {
    document.body.style.fontFamily = e.target.checked ? 'OpenDyslexic, sans-serif' : 'inherit';
});

// Apply color blindness filter
function applyColorBlindnessFilter(type) {
    resetFilter(); // Remove any existing filter first
    document.body.classList.add(`filter-${type}`);
    console.log(`Applied ${type} filter`);
}

// Reset color blindness filter
function resetFilter() {
    document.body.classList.remove('filter-protanopia', 'filter-deuteranopia', 'filter-tritanopia');
    console.log('Reset filter');
}

// Initialize accessibility features
function initializeAccessibility() {
    setupKeyboardNavigation();
    setupAccessibilityListeners();
    addTooltip(startBtn, 'Keyboard shortcut: Shift + Alt + S');
    addTooltip(stopBtn, 'Keyboard shortcut: Shift + Alt + X');
    addTooltip(document.getElementById('accessibilityBtn'), 'Keyboard shortcut: Shift + Alt + A');
    addTooltip(document.getElementById('historyBtn'), 'Keyboard shortcut: Shift + Alt + H');
}

// Add tooltip to an element
function addTooltip(element, text) {
    element.setAttribute('title', text);
    element.setAttribute('aria-label', `${element.textContent} (${text})`);
}

// Announce conversation state for screen readers
function announceConversationState(state) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.className = 'sr-only';
    announcement.textContent = state === 'start' ? 'Conversation started' : 'Conversation ended';
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Event listener for keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.altKey) {
        switch (e.key) {
            case 'S':
            case 's':
                e.preventDefault();
                startConversation();
                break;
            case 'X':
            case 'x':
                e.preventDefault();
                stopConversation();
                break;
            case 'A':
            case 'a':
                e.preventDefault();
                document.getElementById('accessibilityBtn').click();
                break;
            case 'H':
            case 'h':
                e.preventDefault();
                document.getElementById('historyBtn').click();
                break;
        }
    }
});

// Initialize the application when the window loads
window.addEventListener('load', () => {
    checkBrowserSupport();
    getVideoStream();
    initializeAccessibility();

    document.getElementById('highContrastBtn').addEventListener('click', toggleHighContrast);
    document.getElementById('historyBtn').addEventListener('click', () => {
        console.log("History button clicked");
        displayOutfitHistory();
    });
});

// Log Socket.IO version
console.log('Socket.IO version:', io.version);