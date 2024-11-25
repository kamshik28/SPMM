const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`Користувач підключився: ${socket.id}`);

    socket.on('joinRoom', (roomId) => {
        const clients = io.sockets.adapter.rooms.get(roomId) || new Set();
        if (clients.size >= 2) {
            socket.emit('roomFull');
            return;
        }

        socket.join(roomId);
        console.log(`Користувач ${socket.id} приєднався до кімнати ${roomId}`);
        socket.to(roomId).emit('userJoined', socket.id);
    });

    socket.on('signal', ({ to, from, signalData }) => {
        io.to(to).emit('signal', { from, signalData });
    });

    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        console.log(`Користувач ${socket.id} покинув кімнату ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Користувач відключився: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});
