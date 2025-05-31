// node server to handle socket connections

const crypto = require('crypto');
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "https://refactored-pancake-g45pqpxvxvw2vpq-5500.app.github.dev"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const users = {}; // socket.id -> { name, room }
const rooms = {}; // roomCode -> [socket.id]

function generateUniqueRoomCode() {
    let code;
    do {
        code = crypto.randomBytes(3).toString('hex').toUpperCase();
    } while (rooms[code]);
    return code;
}

function emitUserList(roomCode) {
    if (!rooms[roomCode]) return;
    const userList = rooms[roomCode].map(id => users[id]?.name).filter(Boolean);
    io.to(roomCode).emit('update-user-list', userList);
}

io.on('connection', socket => {
    socket.on('login', (name, callback) => {
        users[socket.id] = { name: name, room: null };
        callback && callback();
    });

    // Support custom or random room code creation
    socket.on('create-room', (customCodeOrCallback, callbackMaybe) => {
        let roomCode, callback;
        if (typeof customCodeOrCallback === 'string') {
            // Custom code requested
            roomCode = customCodeOrCallback.toUpperCase();
            callback = callbackMaybe;
            if (rooms[roomCode]) {
                callback && callback({ success: false, message: 'Room code already exists.' });
                return;
            }
        } else {
            // Random code requested
            callback = customCodeOrCallback;
            roomCode = generateUniqueRoomCode();
        }
        rooms[roomCode] = [];
        users[socket.id].room = roomCode;
        socket.join(roomCode);
        rooms[roomCode].push(socket.id);
        if (typeof callback === 'function') {
            if (typeof customCodeOrCallback === 'string') {
                callback({ success: true });
            } else {
                callback(roomCode);
            }
        }
        emitUserList(roomCode);
    });

    socket.on('join-room', (roomCode, callback) => {
        if (rooms[roomCode]) {
            users[socket.id].room = roomCode;
            socket.join(roomCode);
            rooms[roomCode].push(socket.id);
            callback && callback(true);
            socket.to(roomCode).emit('user-joined', users[socket.id].name);
            emitUserList(roomCode);
        } else {
            callback && callback(false);
        }
    });

    socket.on('send', (message, callback) => {
        const user = users[socket.id];
        if (user && user.room) {
            const timestamp = new Date().toLocaleTimeString();
            socket.to(user.room).emit('receive', {
                message: message,
                name: user.name,
                timestamp: timestamp
            });
            callback && callback(timestamp);
        }
    });

    socket.on('typing', ({ room, name }) => {
        if (room) {
            socket.to(room).emit('show-typing', name);
        }
    });

    socket.on('stop-typing', ({ room, name }) => {
        if (room) {
            socket.to(room).emit('hide-typing', name);
        }
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user && user.room && rooms[user.room]) {
            socket.to(user.room).emit('left', user.name);
            rooms[user.room] = rooms[user.room].filter(id => id !== socket.id);
            emitUserList(user.room);
            if (rooms[user.room].length === 0) {
                delete rooms[user.room];
            }
        }
        delete users[socket.id];
    });
});

// Serve static files from the public directory inside nodeServer
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/../')); // Serve root files like /chat.png, /backgroung.png, /ting.mp3

// Use PORT env variable for Render.com, fallback to 8000 locally
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});