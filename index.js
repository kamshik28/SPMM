const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.get('/favicon.ico', (req, res) => res.status(204));

// Обробка WebSocket-з'єднань
io.on('connection', (socket) => {
    console.log(`Користувач підключився: ${socket.id}`);

    socket.on('joinRoom', (roomId) => {
        console.log(`${socket.id} приєднався до кімнати ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit('userJoined', socket.id); // Повідомляємо інших учасників
    });

    socket.on('signal', ({ to, signalData }) => {
        console.log(`Сигнал від ${socket.id} до ${to}:`, signalData);
        io.to(to).emit('signal', { from: socket.id, signalData }); // Пересилаємо сигнал
    });

    socket.on('leaveRoom', (roomId) => {
        console.log(`${socket.id} покинув кімнату ${roomId}`);
        socket.leave(roomId);
    });

    socket.on('disconnect', () => {
        console.log(`Користувач відключився: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});
