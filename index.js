const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Зберігаємо кількість користувачів в кожній кімнаті
const roomUserCounts = {
    1: 0,
    2: 0,
    3: 0
};

// Обробка з'єднань
io.on('connection', (socket) => {
    console.log(`Користувач підключився: ${socket.id}`);

    // Підключення до кімнати
    socket.on('joinRoom', (roomId) => {
        if (roomUserCounts[roomId] < 2) {
            socket.join(roomId);
            roomUserCounts[roomId]++;
            console.log(`${socket.id} приєднався до кімнати ${roomId}`);
            socket.to(roomId).emit('userJoined', socket.id); // Сповіщення інших
        } else {
            console.log(`Кімната ${roomId} вже заповнена. Користувач ${socket.id} не може приєднатися.`);
            socket.emit('roomFull', roomId); // Сповіщення клієнта, що кімната заповнена
        }
    });

    // Пересилання сигналів WebRTC
    socket.on('signal', ({ to, signalData }) => {
        console.log(`Сигнал від ${socket.id} до ${to}:`, signalData);
        io.to(to).emit('signal', { from: socket.id, signalData }); // Пересилання сигналу
    });

    // Вихід із кімнати
    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        roomUserCounts[roomId]--;  // Зменшуємо кількість користувачів у кімнаті
        console.log(`${socket.id} покинув кімнату ${roomId}`);

        // Сповіщаємо інших користувачів про вихід
        socket.to(roomId).emit('userLeft', socket.id);
    });

    // Відключення клієнта
    socket.on('disconnect', () => {
        console.log(`Користувач відключився: ${socket.id}`);

        // Перевіряємо в яких кімнатах знаходиться цей користувач і зменшуємо їхні лічильники
        for (let roomId in roomUserCounts) {
            if (io.sockets.adapter.rooms[roomId] && io.sockets.adapter.rooms[roomId].sockets[socket.id]) {
                roomUserCounts[roomId]--;
                console.log(`Користувач ${socket.id} відключився від кімнати ${roomId}`);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});
