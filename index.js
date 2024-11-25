const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Обробка з'єднань
io.on('connection', (socket) => {
    console.log(`Користувач підключився: ${socket.id}`);

    // Підключення до кімнати
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} приєднався до кімнати ${roomId}`);
        socket.to(roomId).emit('userJoined', socket.id); // Сповіщення інших
    });

    // Пересилання сигналів WebRTC
    socket.on('signal', ({ to, signalData }) => {
        console.log(`Сигнал від ${socket.id} до ${to}:`, signalData);
        io.to(to).emit('signal', { from: socket.id, signalData }); // Пересилання сигналу
    });

    // Вихід із кімнати
    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        console.log(`${socket.id} покинув кімнату ${roomId}`);
    });

    // Відключення клієнта
    socket.on('disconnect', () => {
        console.log(`Користувач відключився: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});
