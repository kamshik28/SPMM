const socket = io(); // Підключення до Socket.IO
let localStream = null;
let peerConnection = null;
let iceCandidateQueue = []; // Черга для збереження ICE-кандидатів
let remoteDescriptionSet = false; // Стан, чи встановлений RemoteDescription

// Налаштування ICE-серверів
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Запит доступу до камери та мікрофона
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        document.getElementById('localVideo').srcObject = stream; // Показуємо локальне відео
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
            console.log('Створюємо PeerConnection');
            initializePeerConnection(from, false);
        }

        try {
            if (signalData.type === 'offer') {
                console.log('Отримано пропозицію (offer)');
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
                remoteDescriptionSet = true; // RemoteDescription встановлений
                processIceCandidateQueue(); // Обробляємо чергу ICE-кандидатів
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('signal', { to: from, signalData: peerConnection.localDescription });
            } else if (signalData.type === 'answer') {
                console.log('Отримано відповідь (answer)');
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
                remoteDescriptionSet = true; // RemoteDescription встановлений
                processIceCandidateQueue(); // Обробляємо чергу ICE-кандидатів
            } else if (signalData.candidate) {
                console.log('Отримано ICE-кандидата');
                if (remoteDescriptionSet) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(signalData));
                } else {
                    console.log('Додаємо ICE-кандидата до черги');
                    iceCandidateQueue.push(signalData); // Зберігаємо кандидатів у черзі
                }
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
    if (!localStream) {
        console.error('Локальний потік ще не отримано');
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

// Обробка черги ICE-кандидатів
function processIceCandidateQueue() {
    console.log('Обробляємо чергу ICE-кандидатів:', iceCandidateQueue);
    while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift();
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
            console.error('Помилка додавання ICE-кандидата:', err);
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
