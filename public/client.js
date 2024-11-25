const socket = io(); // Підключення до Socket.IO
let localStream = null;
let peerConnection = null;

// Запит доступу до камери та мікрофона
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        document.getElementById('localVideo').srcObject = localStream; // Показуємо своє відео
    })
    .catch((error) => {
        console.error('Помилка доступу до камери/мікрофона:', error);
        alert('Не вдалося отримати доступ до камери/мікрофона');
    });

// Підключення до кімнати
function startCall(roomId) {
    socket.emit('joinRoom', roomId); // Повідомляємо сервер про підключення до кімнати

    // Слухаємо події від сервера
    socket.on('userJoined', (peerId) => {
        initializePeerConnection(peerId, true); // Починаємо з'єднання з іншим користувачем
    });

    socket.on('signal', async ({ from, signalData }) => {
        if (!peerConnection) {
            initializePeerConnection(from, false);
        }

        if (signalData.type === 'offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('signal', { to: from, signalData: peerConnection.localDescription });
        } else if (signalData.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
        } else if (signalData.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signalData));
        }
    });

    socket.on('roomFull', () => {
        alert('Кімната вже заповнена двома користувачами.');
    });
}

// Ініціалізація PeerConnection
function initializePeerConnection(peerId, isInitiator) {
    peerConnection = new RTCPeerConnection();

    // Передаємо локальні треки (камера/мікрофон) до віддаленого пристрою
    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    // Обробка отриманого відеопотоку
    peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    // Відправка ICE-кандидатів іншому користувачу
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { to: peerId, signalData: event.candidate });
        }
    };

    // Якщо ми ініціатор (хост), створюємо пропозицію (offer)
    if (isInitiator) {
        peerConnection.createOffer()
            .then((offer) => peerConnection.setLocalDescription(offer))
            .then(() => {
                socket.emit('signal', { to: peerId, signalData: peerConnection.localDescription });
            });
    }
}

// Завершення дзвінка
function endCall(roomId) {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    socket.emit('leaveRoom', roomId); // Повідомляємо сервер про вихід
}
