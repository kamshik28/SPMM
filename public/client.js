let localStream; // Локальний медіапотік
let remoteStream; // Віддалений медіапотік
let peerConnection; // WebRTC-з'єднання
let socket; // Підключення до Socket.IO
let isCameraOn = true; // Стан камери
let isMicrophoneOn = true; // Стан мікрофона

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302", // STUN-сервер
        },
    ],
};

// Запуск дзвінка
async function startCall(roomId) {
    socket = io();

    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");

    // Запит доступу до камери та мікрофона
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        localVideo.srcObject = localStream;

        // Обробники для кнопок
        document.getElementById("toggleCamera").addEventListener("click", toggleCamera);
        document.getElementById("toggleMicrophone").addEventListener("click", toggleMicrophone);

        socket.emit("joinRoom", roomId);

        socket.on("userJoined", async (userId) => {
            console.log(`Користувач приєднався: ${userId}`);
            await createOffer(userId);
        });

        socket.on("signal", async ({ from, signalData }) => {
            if (signalData.type === "offer") {
                await handleOffer(signalData, from);
            } else if (signalData.type === "answer") {
                await handleAnswer(signalData);
            } else if (signalData.candidate) {
                await handleCandidate(signalData);
            }
        });

        socket.on("userLeft", (userId) => {
            console.log(`Користувач покинув: ${userId}`);
            closeConnection();
        });

    } catch (error) {
        console.error("Помилка доступу до медіа:", error);
    }
}

// Створення пропозиції (offer)
async function createOffer(userId) {
    peerConnection = new RTCPeerConnection(configuration);

    // Додати локальний потік до з'єднання
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            document.getElementById("remoteVideo").srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("signal", {
                to: userId,
                signalData: { candidate: event.candidate },
            });
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("signal", {
        to: userId,
        signalData: offer,
    });
}

// Обробка пропозиції (offer)
async function handleOffer(offer, userId) {
    peerConnection = new RTCPeerConnection(configuration);

    // Додати локальний потік до з'єднання
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            document.getElementById("remoteVideo").srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("signal", {
                to: userId,
                signalData: { candidate: event.candidate },
            });
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("signal", {
        to: userId,
        signalData: answer,
    });
}

// Обробка відповіді (answer)
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Обробка кандидатів ICE
async function handleCandidate(candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Закриття з'єднання
function closeConnection() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    remoteStream = null;
    document.getElementById("remoteVideo").srcObject = null;
}

// Вимкнення/ввімкнення камери
function toggleCamera() {
    isCameraOn = !isCameraOn;
    localStream.getVideoTracks()[0].enabled = isCameraOn;
    document.getElementById("cameraIcon").src = isCameraOn
        ? "images/cameraOn.png"
        : "images/cameraOff.png";
}

// Вимкнення/ввімкнення мікрофона
function toggleMicrophone() {
    isMicrophoneOn = !isMicrophoneOn;
    localStream.getAudioTracks()[0].enabled = isMicrophoneOn;
    document.getElementById("microphoneIcon").src = isMicrophoneOn
        ? "images/microon.png"
        : "images/microoff.png";
}

// Завершення дзвінка
function endCall(roomId) {
    socket.emit("leaveRoom", roomId);
    closeConnection();
    socket.disconnect();
}
