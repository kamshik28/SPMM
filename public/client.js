const socket = io();
let localStream = null;
let peerConnection = null;

// Отримуємо доступ до локальної камери та мікрофона
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        // Встановлюємо локальний відеопотік (себе)
        document.getElementById('localVideo').srcObject = stream;
    })
    .catch((error) => {
        console.error('Помилка доступу до камери/мікрофона:', error);
    });

function startCall(roomId) {
    // Приєднання до кімнати
    socket.emit('joinRoom', roomId);

    // Коли інший користувач приєднується до кімнати
    socket.on('userJoined', (peerId) => {
        initializePeerConnection(peerId);
    });

    // Отримання сигналу (WebRTC)
    socket.on('signal', async ({ from, signalData }) => {
        if (!peerConnection) {
            initializePeerConnection(from);
        }

        // Обробка сигналів WebRTC
        if (signalData.type === 'offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('signal', { to: from, from: socket.id, signalData: peerConnection.localDescription });
        } else if (signalData.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
        } else if (signalData.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signalData));
        }
    });

    // Обробка переповнення кімнати
    socket.on('roomFull', () => {
        alert('Кімната вже зайнята двома користувачами.');
    });
}

// Ініціалізація WebRTC PeerConnection
function initializePeerConnection(peerId) {
    peerConnection = new RTCPeerConnection();

    // Передача локальних треків до віддаленого пристрою
    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    // Отримання медіа-треків від іншого пристрою
    peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    // Обробка ICE кандидатів
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { to: peerId, from: socket.id, signalData: event.candidate });
        }
    };

    // Ініціалізація пропозиції (offer) для нового з'єднання
    peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
            socket.emit('signal', { to: peerId, from: socket.id, signalData: peerConnection.localDescription });
        });
}

// Завершення дзвінка
function endCall(roomId) {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    socket.emit('leaveRoom', roomId);
}
