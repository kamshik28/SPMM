const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Сервіс статичних файлів
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для головної сторінки
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Сокет для обробки підключень
io.on('connection', socket => {
    console.log('Користувач підключений:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('userJoined', socket.id);
    });

    socket.on('signal', ({ roomId, signalData }) => {
        socket.to(roomId).emit('signal', signalData);
    });

    socket.on('disconnect', () => {
        console.log('Користувач відключився:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});
