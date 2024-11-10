const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Створення серверу Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

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

// Визначаємо порт і IP
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});


