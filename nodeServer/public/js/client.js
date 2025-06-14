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
const customRoomCheckbox = document.getElementById('custom-room-checkbox');
const customRoomCodeInput = document.getElementById('custom-room-code-inp');
// Always hide by default (in case of browser cache or reload)
customRoomCodeInput.style.display = 'none';
const loginPage = document.getElementById('login-page');
const loginInput = document.getElementById('login-username');
const loginBtn = document.getElementById('login-btn');
var audit = new Audio('/ting.mp3');

let username = '';
let currentRoom = '';

const append = (message, position) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messagesContainer.append(messageElement);
    if (position == 'left' && !isMuted) {
        audit.play();
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide chat section initially
chatSection.style.display = 'none';

function showLoginPage() {
    loginPage.style.display = '';
    roomSection.style.display = 'none';
    chatSection.style.display = 'none';
}
function showRoomSection() {
    loginPage.style.display = 'none';
    roomSection.style.display = '';
    chatSection.style.display = 'none';
}
function showChatSection() {
    loginPage.style.display = 'none';
    roomSection.style.display = 'none';
    chatSection.style.display = '';
}

// Hide room and chat sections initially, show login
showLoginPage();

// Login page logic
loginBtn.addEventListener('click', () => {
    const name = loginInput.value.trim();
    if (!name) {
        loginInput.focus();
        loginInput.style.borderColor = 'red';
        setTimeout(() => loginInput.style.borderColor = '', 600);
        return;
    }
    username = name;
    socket.emit('login', username, () => {
        showRoomSection();
    });
});
loginInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

// Ensure custom room code input is hidden by default
customRoomCodeInput.style.display = 'none';

// Show/hide custom room code input based on checkbox
customRoomCheckbox.addEventListener('change', () => {
    if (customRoomCheckbox.checked) {
        customRoomCodeInput.style.display = '';
        customRoomCodeInput.focus();
    } else {
        customRoomCodeInput.style.display = 'none';
        customRoomCodeInput.value = '';
    }
});

// Room creation
createBtn.addEventListener('click', () => {
    if (customRoomCheckbox.checked) {
        const customCode = customRoomCodeInput.value.trim().toUpperCase();
        if (!customCode) {
            alert('Please enter a custom room code.');
            return;
        }
        socket.emit('create-room', customCode, (result) => {
            if (result.success) {
                currentRoom = customCode;
                roomCodeDisplay.innerText = `Room Code: ${customCode}`;
                showChatSection();
                append(`<b>Room created. Share this code: ${customCode}</b>`, 'right');
            } else {
                alert(result.message || 'Room code already exists. Try another.');
            }
        });
    } else {
        socket.emit('create-room', (roomCode) => {
            currentRoom = roomCode;
            roomCodeDisplay.innerText = `Room Code: ${roomCode}`;
            showChatSection();
            append(`<b>Room created. Share this code: ${roomCode}</b>`, 'right');
        });
    }
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
        li.setAttribute('data-initial', name ? name[0].toUpperCase() : '?');
        userListElement.appendChild(li);
    });
});

// Background and mode switching
const bgSelect = document.getElementById('bg-select');
const toggleModeBtn = document.getElementById('toggle-mode');
const logoutBtn = document.getElementById('logout-btn');
const body = document.body;
// Add mute button
const muteBtn = document.getElementById('mute-btn');
let isMuted = false;

muteBtn.addEventListener('click', function() {
    isMuted = !isMuted;
    muteBtn.innerText = isMuted ? "🔇" : "🔊";
    muteBtn.classList.toggle('muted', isMuted);
});

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
    // Removed: bg27, bg28, bg29, bg30, bg31, bg32
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

// Remove the static typing-indicator div usage and instead create and append it dynamically as before:
let typingIndicator = document.createElement('div');
typingIndicator.id = 'typing-indicator';
typingIndicator.style.textAlign = 'left';
typingIndicator.style.fontSize = '0.95em';
typingIndicator.style.color = '#888';
// Insert the typing indicator above messagesContainer
messagesContainer.parentNode.insertBefore(typingIndicator, messagesContainer);

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
