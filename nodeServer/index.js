// node server to handle socket connections

const crypto = require('crypto');
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(httpServer, {
    cors: {
        // In production, set this to your frontend domain:
        // origin: "https://yourfrontenddomain.com",
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const users = {}; // socket.id -> { name, room }
const rooms = {}; // roomCode -> [socket.id]

// Enable CORS for all routes (restrict origins if needed)
app.use(cors({
    origin: [
        'https://darkseid1729.github.io',
        'https://rooms-and-chatting.onrender.com',
        'https://cuddly-space-engine-jxp77gjjr7vcp647-5500.app.github.dev'
    ]
}));

// Ensure uploads directory exists before any upload or static middleware
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

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

    socket.on('create-room', (callback) => {
        const roomCode = generateUniqueRoomCode();
        rooms[roomCode] = [];
        users[socket.id].room = roomCode;
        socket.join(roomCode);
        rooms[roomCode].push(socket.id);
        callback && callback(roomCode);
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
            // If message is an image object, send it as top-level object
            if (typeof message === 'object' && message.type === 'image') {
                socket.to(user.room).emit('receive', {
                    type: 'image',
                    url: message.url,
                    name: user.name,
                    timestamp: timestamp
                });
                callback && callback(timestamp);
            } else {
                socket.to(user.room).emit('receive', {
                    message: message,
                    name: user.name,
                    timestamp: timestamp
                });
                callback && callback(timestamp);
            }
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
app.use('/uploads', express.static(uploadDir));

// Upload endpoint (field name can be 'image' or 'myFile' as needed)
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});

// Use PORT env variable for Render.com, fallback to 8000 locally
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});