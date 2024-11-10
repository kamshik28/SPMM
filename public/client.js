let localStream = null;
let micEnabled = false;
let videoEnabled = false;

const hasGetUserMedia = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

if (!hasGetUserMedia()) {
    alert("Ваш браузер не підтримує getUserMedia. Будь ласка, використовуйте сучасний браузер, як-от Chrome або Firefox.");
}

// Функція для приєднання до виклику
const joinCall = () => {
    if (hasGetUserMedia()) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = stream;

                // Вимикаємо відео та аудіо за замовчуванням
                localStream.getVideoTracks()[0].enabled = false;
                localStream.getAudioTracks()[0].enabled = false;
                micEnabled = false;
                videoEnabled = false;

                showControlsForUser(); // Показуємо кнопки камери та мікрофона
                console.log("Локальний потік отримано.");
            })
            .catch(error => {
                console.error('Помилка при доступі до відео/аудіо:', error);
            });
    } else {
        console.error('getUserMedia не підтримується в цьому браузері.');
    }
};

// Функція для виходу з виклику
const leaveCall = () => {
    console.log("Користувач залишив конференцію.");
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = null;
    }

    hideControlsForUser(); // Ховаємо кнопки камери та мікрофона
};

// Функція для приховування контролів
const hideControlsForUser = () => {
    document.getElementById('controlsUser1').classList.add('hidden');
};

// Функція для показу контролів
const showControlsForUser = () => {
    document.getElementById('controlsUser1').classList.remove('hidden');
};

// Функція для ввімкнення/вимкнення камери
const toggleCamera = () => {
    if (localStream && localStream.getVideoTracks().length > 0) {
        videoEnabled = !videoEnabled;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = videoEnabled;
        });

        const cameraIcon = document.getElementById('cameraIcon');
        cameraIcon.src = videoEnabled ? '/images/cameraOn.png' : '/images/cameraOff.png';

        console.log(`Камера ${videoEnabled ? "ввімкнена" : "вимкнена"}`);
    } else {
        console.error("Потік відео не отриманий або відсутні відеотреки.");
    }
};

// Функція для ввімкнення/вимкнення мікрофона
const toggleMic = () => {
    if (localStream && localStream.getAudioTracks().length > 0) {
        micEnabled = !micEnabled;
        localStream.getAudioTracks().forEach(track => {
            track.enabled = micEnabled;
        });

        const micIcon = document.getElementById('micIcon');
        micIcon.src = micEnabled ? '/images/microon.png' : '/images/microoff.png';

        console.log(`Мікрофон ${micEnabled ? "ввімкнений" : "вимкнений"}`);
    } else {
        console.error("Потік аудіо не отриманий або відсутні аудіотреки.");
    }
};

// Додаємо обробник для кнопки приєднання
document.getElementById('joinCall').addEventListener('click', () => {
    joinCall();
    document.getElementById('joinCall').classList.add('hidden');
    document.getElementById('leaveCall').classList.remove('hidden');
});

// Додаємо обробник для кнопки виходу з виклику
document.getElementById('leaveCall').addEventListener('click', () => {
    leaveCall();
    document.getElementById('joinCall').classList.remove('hidden');
    document.getElementById('leaveCall').classList.add('hidden');
});

// Додаємо обробники для кнопок камери та мікрофона
document.getElementById('toggleCamera').addEventListener('click', toggleCamera);
document.getElementById('toggleMic').addEventListener('click', toggleMic);
