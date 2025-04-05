// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDaVBQkqmOa90VJklnZoQIyqUKeQ0lJvu8",
    authDomain: "videollamadas-8f967.firebaseapp.com",
    projectId: "videollamadas-8f967",
    storageBucket: "videollamadas-8f967.firebasestorage.app",
    messagingSenderId: "122152428416",
    appId: "1:122152428416:web:4cbf9ea703f40dd24d9765",
    measurementId: "G-6MBE7X0Q7S"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos de index.html
const loginContainer = document.getElementById('loginContainer');
const signupContainer = document.getElementById('signupContainer');
const forgotContainer = document.getElementById('forgotContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const googleLogin = document.getElementById('googleLogin');
const microsoftLogin = document.getElementById('microsoftLogin');
const githubLogin = document.getElementById('githubLogin');
const signupLink = document.getElementById('signupLink');
const forgotLink = document.getElementById('forgotLink');
const backToLogin = document.getElementById('backToLogin');
const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');

// Elementos de calls.html
const callContainer = document.getElementById('callContainer');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const joinButton = document.getElementById('joinButton');
const hangupButton = document.getElementById('hangupButton');
const muteButton = document.getElementById('muteButton');
const videoOffButton = document.getElementById('videoOffButton');
const callIdInput = document.getElementById('callIdInput');
const logoutButton = document.getElementById('logoutButton');

let localStream;
let peerConnection;
let isMuted = false;
let isVideoOff = false;

const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Autenticación (index.html)
if (loginForm) {
    auth.onAuthStateChanged(user => {
        if (user && window.location.pathname.includes('index.html')) {
            window.location.href = 'calls.html';
        }
    });

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            alert('Error al iniciar sesión: ' + error.message);
        }
    });

    signupForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        try {
            await auth.createUserWithEmailAndPassword(email, password);
        } catch (error) {
            alert('Error al registrarse: ' + error.message);
        }
    });

    forgotForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        try {
            await auth.sendPasswordResetEmail(email);
            alert('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
            forgotContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
        } catch (error) {
            alert('Error al enviar el correo: ' + error.message);
        }
    });

    googleLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            alert('Error con Google: ' + error.message);
        }
    });

    microsoftLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.OAuthProvider('microsoft.com');
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            alert('Error con Microsoft: ' + error.message);
        }
    });

    githubLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.GithubAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            alert('Error con GitHub: ' + error.message);
        }
    });

    signupLink.addEventListener('click', e => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'flex';
    });

    forgotLink.addEventListener('click', e => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        forgotContainer.style.display = 'flex';
    });

    backToLogin.addEventListener('click', e => {
        e.preventDefault();
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
    });

    backToLoginFromForgot.addEventListener('click', e => {
        e.preventDefault();
        forgotContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
    });
}

// Videollamadas (calls.html)
if (callContainer) {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        }
    });

    startButton.addEventListener('click', () => startCall(callIdInput.value || 'call1'));
    joinButton.addEventListener('click', () => joinCall(callIdInput.value));
    hangupButton.addEventListener('click', hangup);
    muteButton.addEventListener('click', toggleMute);
    videoOffButton.addEventListener('click', toggleVideo);
    logoutButton.addEventListener('click', () => auth.signOut());

    async function startCall(callId) {
        startButton.disabled = true;
        joinButton.disabled = true;
        hangupButton.disabled = false;

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;

            peerConnection = new RTCPeerConnection(configuration);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.ontrack = event => {
                remoteVideo.srcObject = event.streams[0];
            };

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    db.collection('calls').doc(callId).collection('callerCandidates').add(event.candidate.toJSON());
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            await db.collection('calls').doc(callId).set({
                offer: { type: offer.type, sdp: offer.sdp }
            });

            db.collection('calls').doc(callId).onSnapshot(async snapshot => {
                const data = snapshot.data();
                if (!peerConnection.currentRemoteDescription && data && data.answer) {
                    const answer = new RTCSessionDescription(data.answer);
                    await peerConnection.setRemoteDescription(answer);
                }
            });

            db.collection('calls').doc(callId).collection('calleeCandidates').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        await peerConnection.addIceCandidate(candidate);
                    }
                });
            });

        } catch (error) {
            alert('Error al iniciar la llamada: ' + error.message);
            hangup();
        }
    }

    async function joinCall(callId) {
        if (!callId) {
            alert('Por favor, ingresa un ID de llamada.');
            return;
        }
        startButton.disabled = true;
        joinButton.disabled = true;
        hangupButton.disabled = false;

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;

            peerConnection = new RTCPeerConnection(configuration);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.ontrack = event => {
                remoteVideo.srcObject = event.streams[0];
            };

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    db.collection('calls').doc(callId).collection('calleeCandidates').add(event.candidate.toJSON());
                }
            };

            const callDoc = db.collection('calls').doc(callId);
            const callData = (await callDoc.get()).data();
            if (!callData) {
                throw new Error('No se encontró la llamada con ese ID.');
            }

            const offer = callData.offer;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            await callDoc.update({ answer: { type: answer.type, sdp: answer.sdp } });

            db.collection('calls').doc(callId).collection('callerCandidates').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        await peerConnection.addIceCandidate(candidate);
                    }
                });
            });

        } catch (error) {
            alert('Error al unirse a la llamada: ' + error.message);
            hangup();
        }
    }

    async function hangup() {
        if (peerConnection) peerConnection.close();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
        startButton.disabled = false;
        joinButton.disabled = false;
        hangupButton.disabled = true;

        const callId = callIdInput.value || 'call1';
        const callDoc = db.collection('calls').doc(callId);
        await callDoc.collection('callerCandidates').get().then(s => s.forEach(d => d.ref.delete()));
        await callDoc.collection('calleeCandidates').get().then(s => s.forEach(d => d.ref.delete()));
        await callDoc.delete();

        peerConnection = null;
        localStream = null;
    }

    function toggleMute() {
        if (localStream) {
            isMuted = !isMuted;
            localStream.getAudioTracks()[0].enabled = !isMuted;
            muteButton.textContent = isMuted ? 'Activar Mic' : 'Silenciar Mic';
        }
    }

    function toggleVideo() {
        if (localStream) {
            isVideoOff = !isVideoOff;
            localStream.getVideoTracks()[0].enabled = !isVideoOff;
            videoOffButton.textContent = isVideoOff ? 'Encender Cámara' : 'Apagar Cámara';
        }
    }
}