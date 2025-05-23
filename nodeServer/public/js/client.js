const socket = io("https://rooms-and-chatting.onrender.com");

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messagesContainer = document.querySelector(".container");
const roomSection = document.getElementById('room-section');
const chatSection = document.getElementById('chat-section');
const createBtn = document.getElementById('create-room-btn');
const joinBtn = document.getElementById('join-room-btn');
const roomCodeInput = document.getElementById('room-code-inp');
const roomCodeDisplay = document.getElementById('room-code-display');
const imageUrlInp = document.getElementById('imageUrlInp');
const sendImageBtn = document.getElementById('sendImageBtn');
const imageFileInp = document.getElementById('imageFileInp');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const uploadLabel = document.getElementById('upload-label');
var audit = new Audio('/ting.mp3');

let username = '';
let currentRoom = '';

const append = (message, position) => {
    const messageElement = document.createElement('div');
    if (typeof message === 'object' && message.type === 'image') {
        messageElement.innerHTML = `<img src="${message.url}" style="max-width:180px;max-height:180px;border-radius:8px;">`;
    } else {
        messageElement.innerHTML = message;
    }
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

if (sendImageBtn && imageUrlInp) {
    sendImageBtn.addEventListener('click', () => {
        const url = imageUrlInp.value.trim();
        if (!url) return;
        socket.emit('send', { type: 'image', url }, (timestamp) => {
            append(`<b>You</b> <span style="font-size:0.8em;color:#888;">${timestamp}</span>:<br><img src="${url}" style="max-width:180px;max-height:180px;border-radius:8px;">`, 'right');
        });
        imageUrlInp.value = '';
    });
}

if (uploadImageBtn && imageFileInp) {
    uploadImageBtn.addEventListener('click', () => {
        const file = imageFileInp.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);

        fetch('https://rooms-and-chatting.onrender.com/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.url) {
                socket.emit('send', { type: 'image', url: data.url }, (timestamp) => {
                    append(`<b>You</b> <span style="font-size:0.8em;color:#888;">${timestamp}</span>:<br><img src="${data.url}" style="max-width:180px;max-height:180px;border-radius:8px;">`, 'right');
                });
            }
        })
        .catch(() => alert('Image upload failed!'));
        imageFileInp.value = '';
    });
}

if (uploadLabel && imageFileInp) {
    uploadLabel.addEventListener('click', () => {
        imageFileInp.click();
    });
}

socket.on('user-joined', name => {
    append(`<b>${name}</b> joined the chat`, 'right');
});
socket.on('receive', data => {
    if (data.type === 'image') {
        append({ type: 'image', url: data.url }, 'left');
    } else {
        append(`<b>${data.name}</b> <span style="font-size:0.8em;color:#888;">${data.timestamp}</span>: ${data.message}`, 'left');
    }
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

// Background and mode switching
const bgSelect = document.getElementById('bg-select');
const toggleModeBtn = document.getElementById('toggle-mode');
const logoutBtn = document.getElementById('logout-btn');
const body = document.body;

const backgrounds = {
    bg1: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZm5sMHhiNmgwOTJ5OXFsc2R1cmpoM2xucjgxZjFpNm9hNjNzZjdqayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RlwF2vFb4y7bDnWvcO/giphy.gif')", // Aurora
    bg2: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZm5sMHhiNmgwOTJ5OXFsc2R1cmpoM2xucjgxZjFpNm9hNjNzZjdqayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/iBlgTxSS20NLdCxvDW/giphy.gif')", // Purple Night
    bg3: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZm5sMHhiNmgwOTJ5OXFsc2R1cmpoM2xucjgxZjFpNm9hNjNzZjdqayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tdC6N1RKNp4swre2JY/giphy.gif')", // Blue Stars
    bg4: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZm5sMHhiNmgwOTJ5OXFsc2R1cmpoM2xucjgxZjFpNm9hNjNzZjdqayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FWw6t0FqD1IVq/giphy.gif')", // Fireflies
    bg5: "url('https://media.giphy.com/media/93slSU4cOVOUOWCyl6/giphy.gif?cid=ecf05e47ige3rjr1lpg5lycg4vswjnkdrp46w6ywjjpxck12&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // Luna
    bg6: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjlkb3A3cGYxemszaGd1cGIyOTRnOWt0dDRscjI5c2JicnB3MnZhbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eHQ5BsgBIBIGI/giphy.gif')", // Nature
    bg7: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjlkb3A3cGYxemszaGd1cGIyOTRnOWt0dDRscjI5c2JicnB3MnZhbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/XPlcxsFs8BIKk/giphy.gif')", // Colorful Flow
    bg8: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTZ6NTVudDI3bTM3N3cwZXQxMWtraG04aXgwM2RxdGtiY2VrMjJjbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OJYmB0SL4EVu8REklW/giphy.gif')", // zhongli
    bg9: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTZ6NTVudDI3bTM3N3cwZXQxMWtraG04aXgwM2RxdGtiY2VrMjJjbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uTAFTGP3B4QvUoOikX/giphy.gif')", // Pink Waves
    bg10: "url('https://media.giphy.com/media/aeGtl5cBRfmc2TzQsQ/giphy.gif?cid=ecf05e47y2uj27um0x2r6akzr6qnh5rvri3f3jbszjwcv5xg&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // cosplay-girl
    bg11: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExenRsdWs3YWt6M2U1am5yMDZva2luMjl4MnhubDF4N3I4a3ZjN3I2cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uVp3XawdMFCMQjIge7/giphy.gif')", // Raiden and Fox
    bg12: "url('https://media.giphy.com/media/GISoZGkcy57H2/giphy.gif?cid=ecf05e472am5mu1jldilxvinio9rudgp0gofr82k5wkja7ut&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // Levi
    bg13: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZtdWxzdDAzc2NkeWxzNDllc2h0M3B0djh0ZmJqbm45bnU3MzR2ZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2xu5zpSV3oqKcCSZ49/giphy.gif')", // tanjiro
    bg14: "url('https://media.giphy.com/media/mj4ruS6mHkdKEdmwc1/giphy.gif?cid=ecf05e47o2k5ior8m6v6w8a0amrvyfr1526le8h0fx22vvt1&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // Zenitsu
    bg15: "url('https://media.giphy.com/media/f7k6TfAFkiAqKVcJGH/giphy.gif?cid=ecf05e47o2k5ior8m6v6w8a0amrvyfr1526le8h0fx22vvt1&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // tomioka
    bg16: "url('https://media.giphy.com/media/4qZzHTOVGWRbXlzDfz/giphy.gif?cid=ecf05e473fjles3egf078xed9ujpkvrpkex1leyeoz7gx4q5&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // Zenitsu sleeping
    bg17: "url('https://media.giphy.com/media/jh7F7XwHTywg85ekdl/giphy.gif?cid=ecf05e4716ok693yehl7ba8y1y2bdttd3z0w5iujr9x1mgxb&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // rengoku
    bg18: "url('https://media.giphy.com/media/ncKPpe9NbAGxfl0Vf3/giphy.gif?cid=ecf05e47vt1juuv5cw6n6ogpdamyk55ytqujxmg5y1ctyspo&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // tengen
    bg19: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTQ2OTV4ZW05eGdiZ2x0aHppbWtjY2ZpaXg3ejZjOWR6bnlwdmhlMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10YWqUivkQPeeJWD3u/giphy.gif')", // dancing ZeroOne
    bg20: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDZjM2F0M3VkZGRsZXIxNjk3MmNqYnQ4aWt5ODQ2a3lpMTBvNTdubiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tqqhw7w4HXCDu/giphy.gif')", // my Krazy gf
    bg21: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdm51ZTl3cmo2czgzYmQ0YXZobHExMGxjaDhsYzd3YTdrYjR2bGR1YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8emKva4pMAzKpapnrJ/giphy.gif')", // naruto crazy gods
    bg22: "url('https://media.giphy.com/media/nqe1RhTVeVg3G97Eh6/giphy.gif?cid=ecf05e47np71bmj3iaormi914at64nkxxzmyta8mqin8vyu3&ep=v1_gifs_search&rid=giphy.gif&ct=g')", // Naruto charcter dance
    bg23: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTR1YWgzN3JxN3lvZ252bTZwNzc5eHoyZG1xaXI5eW81czFsa2ZpeSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/K4rDu65eHSsNO/giphy.gif')", // Obito
    bg24: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTc3Zm1lM2N4MnV0M2t2eXdzNnJpd2MyYWhxM3gyeWV2bGpoMjRtcSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/PxDshFWiGe91SBHXQW/giphy.gif')", // Ai dance
    bg25: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTc3Zm1lM2N4MnV0M2t2eXdzNnJpd2MyYWhxM3gyeWV2bGpoMjRtcSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/W6dHvprT7oks6BpX5R/giphy.gif')", // fuziwara dance
    bg26: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzV6MzI1YXVyZ215Z3FpYzVsNzB5dmR6N2lyZDNmYms1djYxMHRzMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/90cAvw5mBQHa1QNFG9/giphy.gif')", // beat ass
    bg27: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzV6MzI1YXVyZ215Z3FpYzVsNzB5dmR6N2lyZDNmYms1djYxMHRzMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mjQB1napOu1axSR2ig/giphy.gif')", // shy girl
    bg28: "url('https://media.giphy.com/media/CpHcxFwDgENibkrIqq/giphy.gif')", // making you uncomfortable1
    bg29: "url('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWl3dGlscHV3eDMxeWtwa3pnNm42cDFvYWZuYWRuYzVmYzNhOWExMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LSz8tqMYbChGKqg7FT/giphy.gif')", // making you uncomfortable2
    bg30: "url('https://media.giphy.com/media/jyHinkqf9Z1OOguQFi/giphy.gif')", // making you uncomfortable3
    bg31: "url('https://media.giphy.com/media/vQ6vju3LpqhOhGukN8/giphy.gif')", // making you uncomfortable4
    bg32: "url('https://media.giphy.com/media/w9Yt5sDfXmnY1MBFsw/giphy.gif')" // making you uncomfortable5
};

bgSelect.addEventListener('change', function() {
    body.classList.remove('night-bg');
    body.style.backgroundImage = backgrounds[this.value];
});

let darkMode = false;
toggleModeBtn.addEventListener('click', function() {
    darkMode = !darkMode;
    if (darkMode) {
        body.classList.add('dark-mode');
        toggleModeBtn.innerText = "☀️ Light Mode";
    } else {
        body.classList.remove('dark-mode');
        toggleModeBtn.innerText = "🌙 Dark Mode";
    }
});

logoutBtn.addEventListener('click', function() {
    // Optionally, you can also emit a custom logout event to the server here
    location.reload();
});

const typingIndicator = document.createElement('div');
typingIndicator.id = 'typing-indicator';
typingIndicator.style.textAlign = 'left';
typingIndicator.style.fontSize = '0.95em';
typingIndicator.style.color = '#888';
messagesContainer.parentNode.appendChild(typingIndicator);

let typingTimeout;
messageInput.addEventListener('input', () => {
    socket.emit('typing', { room: currentRoom, name: username });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop-typing', { room: currentRoom, name: username });
    }, 1200);
});

socket.on('show-typing', (name) => {
    if (name !== username) {
        typingIndicator.innerText = `${name} is typing...`;
    }
});
socket.on('hide-typing', (name) => {
    if (name !== username) {
        typingIndicator.innerText = '';
    }
});

// NOTE: If you see a CORS error, make sure your server at localhost:8000 allows CORS requests from http://127.0.0.1:5500
// This is a server-side configuration. In your Node.js server, use the 'cors' package or set headers manually.
