const socket = io(); // Підключення до Socket.IO
let localStream = null;
let peerConnection = null;

// Налаштування ICE-серверів
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Запит доступу до камери та мікрофона
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        document.getElementById('localVideo').srcObject = stream;
        console.log('Локальний відеопотік отримано');
    })
    .catch((error) => {
        console.error('Помилка доступу до камери/мікрофона:', error);
        alert('Не вдалося отримати доступ до камери/мікрофона');
    });

// Підключення до кімнати
function startCall(roomId) {
    socket.emit('joinRoom', roomId); // Повідомляємо сервер про підключення до кімнати

    socket.on('userJoined', (peerId) => {
        console.log('Користувач приєднався:', peerId);
        initializePeerConnection(peerId, true); // Починаємо з'єднання з іншим користувачем
    });

    socket.on('signal', async ({ from, signalData }) => {
        if (!peerConnection) {
            initializePeerConnection(from, false);
        }

        try {
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
        } catch (error) {
            console.error('Помилка обробки сигналу:', error);
        }
    });

    socket.on('roomFull', () => {
        alert('Кімната вже заповнена двома користувачами.');
    });
}

// Ініціалізація PeerConnection
function initializePeerConnection(peerId, isInitiator) {
    if (peerConnection) {
        console.warn('З\'єднання вже існує');
        return;
    }

    peerConnection = new RTCPeerConnection(configuration);

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = event.streams[0];
            console.log('Отримано віддалений потік');
        }
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { to: peerId, signalData: event.candidate });
        }
    };

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
    console.log('Дзвінок завершено');
}
