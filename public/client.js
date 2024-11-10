let localStream = null;
let micEnabled = false;
let videoEnabled = false;

// Перевірка підтримки getUserMedia
const hasGetUserMedia = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

if (!hasGetUserMedia()) {
    alert("Ваш браузер не підтримує getUserMedia. Будь ласка, використовуйте сучасний браузер, як-от Chrome або Firefox.");
}

// Отримання локального відео та аудіо
const joinCall = () => {
    if (hasGetUserMedia()) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = stream;

                // Вимкнемо камеру та мікрофон після приєднання за замовчуванням
                localStream.getVideoTracks()[0].enabled = false;
                localStream.getAudioTracks()[0].enabled = false;
                micEnabled = false;
                videoEnabled = false;
                updateMicStatus('Мікрофон вимкнений');

                // Показуємо статус мікрофонів та контролі для всіх користувачів
                showMicStatusForAllUsers();
                showControlsForUser();

                console.log("Локальний потік отримано.");
            })
            .catch(error => {
                console.error('Помилка при доступі до відео/аудіо:', error);
            });
    } else {
        console.error('getUserMedia не підтримується в цьому браузері.');
    }
};

// Функція для виходу з конференції
const leaveCall = () => {
    console.log("Користувач залишив конференцію.");
    // Додаємо логіку для виходу з конференції
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop()); // Зупиняємо всі треки
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = null;  // Прибираємо відео
    }

    // Ховаємо контролі після виходу з конференції
    hideControlsForUser();
    hideMicStatusForAllUsers();
};

// Функція для приховування контролів
const hideControlsForUser = () => {
    document.getElementById('controlsUser1').classList.add('hidden');
};

// Функція для показу контролів
const showControlsForUser = () => {
    document.getElementById('controlsUser1').classList.remove('hidden');
};

const hideMicStatusForAllUsers = () => {
    document.getElementById('micStatusUser1').classList.add('hidden');
    document.getElementById('micStatusUser2').classList.add('hidden');
    document.getElementById('micStatusUser3').classList.add('hidden');
};

const showMicStatusForAllUsers = () => {
    document.getElementById('micStatusUser1').classList.remove('hidden');
    document.getElementById('micStatusUser2').classList.remove('hidden');
    document.getElementById('micStatusUser3').classList.remove('hidden');
};

const updateMicStatus = (enabled) => {
    const micStatusUser1 = document.getElementById('micStatusUser1');
    micStatusUser1.innerHTML = ''; // Очищуємо текст
    const img = document.createElement('img');
    img.src = enabled ? '/images/microon.png' : '/images/microoff.png';
    img.alt = enabled ? 'Мікрофон увімкнений' : 'Мікрофон вимкнений';
    img.style.width = '20px'; // Налаштуйте розмір за потреби
    img.style.height = '20px';
    micStatusUser1.appendChild(img);
};


// Функція для ввімкнення/вимкнення камери
const toggleCamera = () => {
    if (localStream && localStream.getVideoTracks().length > 0) {
        videoEnabled = !videoEnabled;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = videoEnabled;  // Включаємо/вимикаємо всі відеотреки
        });
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
        updateMicStatus(micEnabled); // Передаємо стан мікрофона як аргумент
        console.log(`Мікрофон ${micEnabled ? "ввімкнений" : "вимкнений"}`);
    } else {
        console.error("Потік аудіо не отриманий або відсутні аудіотреки.");
    }
};


document.getElementById('joinCall').addEventListener('click', () => { // Приєднання до виклику

    joinCall();
    document.getElementById('joinCall').classList.add('hidden');
    document.getElementById('leaveCall').classList.remove('hidden');
});

document.getElementById('leaveCall').addEventListener('click', () => { // Вихід з виклику

    leaveCall();
    document.getElementById('joinCall').classList.remove('hidden');
    document.getElementById('leaveCall').classList.add('hidden');
});

document.getElementById('toggleCamera').addEventListener('click', toggleCamera);
document.getElementById('toggleMic').addEventListener('click', toggleMic);
