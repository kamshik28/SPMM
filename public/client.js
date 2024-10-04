document.getElementById('joinCall').addEventListener('click', () => {
    joinCall();
    // Приховуємо кнопку "+" і показуємо кнопку "-"
    document.getElementById('joinCall').classList.add('hidden');
    document.getElementById('leaveCall').classList.remove('hidden');
});

document.getElementById('leaveCall').addEventListener('click', () => {
    leaveCall();
    // Показуємо кнопку "+" і приховуємо кнопку "-"
    document.getElementById('joinCall').classList.remove('hidden');
    document.getElementById('leaveCall').classList.add('hidden');
});

function leaveCall() {
    console.log("Користувач залишив конференцію.");
    // Додаємо логіку для виходу з конференції
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop()); // Зупиняємо всі треки
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = null;  // Прибираємо відео
    }
    // Можна також повідомити сервер про вихід з конференції через Socket.IO
    socket.emit('leaveRoom', roomId);
}
