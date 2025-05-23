const socket = io();

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messagesContainer = document.querySelector(".container");
const roomSection = document.getElementById('room-section');
const chatSection = document.getElementById('chat-section');
const createBtn = document.getElementById('create-room-btn');
const joinBtn = document.getElementById('join-room-btn');
const roomCodeInput = document.getElementById('room-code-inp');
const roomCodeDisplay = document.getElementById('room-code-display');
var audit = new Audio('/ting.mp3');

let username = '';
let currentRoom = '';

const append = (message, position) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messagesContainer.append(messageElement);
    if (position == 'left') {
        audit.play();
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide chat section initially
chatSection.style.display = 'none';

function showChatSection() {
    roomSection.style.display = 'none';
    chatSection.style.display = '';
}

function showRoomSection() {
    roomSection.style.display = '';
    chatSection.style.display = 'none';
}

// Login prompt
function login() {
    username = prompt("Enter your name to join");
    if (!username) {
        login();
        return;
    }
    socket.emit('login', username, () => {
        showRoomSection();
    });
}
login();

// Room creation
createBtn.addEventListener('click', () => {
    socket.emit('create-room', (roomCode) => {
        currentRoom = roomCode;
        roomCodeDisplay.innerText = `Room Code: ${roomCode}`;
        showChatSection();
        append(`<b>Room created. Share this code: ${roomCode}</b>`, 'right');
    });
});

// Room joining
joinBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) return;
    socket.emit('join-room', code, (success) => {
        if (success) {
            currentRoom = code;
            roomCodeDisplay.innerText = `Room Code: ${code}`;
            showChatSection();
            append(`<b>Joined room: ${code}</b>`, 'right');
        } else {
            alert('Invalid room code!');
        }
    });
});

// Send message
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (!message) return;
    socket.emit('send', message, (timestamp) => {
        append(`<b>You</b> <span style="font-size:0.8em;color:#888;">${timestamp}</span>: ${message}`, 'right');
    });
    messageInput.value = '';
});

socket.on('user-joined', name => {
    append(`<b>${name}</b> joined the chat`, 'right');
});
socket.on('receive', data => {
    append(`<b>${data.name}</b> <span style="font-size:0.8em;color:#888;">${data.timestamp}</span>: ${data.message}`, 'left');
});
socket.on('left', name => {
    append(`<b>${name}</b> left the chat`, 'left');
});

// Listen for user list updates and display them
socket.on('update-user-list', (userList) => {
    const userListElement = document.getElementById('user-list');
    if (!userListElement) return;
    userListElement.innerHTML = '';
    userList.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        userListElement.appendChild(li);
    });
});

// NOTE: If you see a CORS error, make sure your server at localhost:8000 allows CORS requests from http://127.0.0.1:5500
// This is a server-side configuration. In your Node.js server, use the 'cors' package or set headers manually.
