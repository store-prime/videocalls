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
const hangupButton = document.getElementById('hangupButton');
const muteButton = document.getElementById('muteButton');
const videoOffButton = document.getElementById('videoOffButton');
const logoutButton = document.getElementById('logoutButton');
const usersList = document.getElementById('usersList');
const incomingCall = document.getElementById('incomingCall');
const callerName = document.getElementById('callerName');
const acceptButton = document.getElementById('acceptButton');
const rejectButton = document.getElementById('rejectButton');

let localStream;
let peerConnection;
let isMuted = false;
let isVideoOff = false;
let currentCallId = null;
let currentUser = null;

const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Función para redirigir a calls.html
function redirectToCalls() {
    window.location.href = 'calls.html';
}

// Autenticación (index.html)
if (loginForm) {
    auth.onAuthStateChanged(user => {
        if (user && window.location.pathname.includes('index.html')) {
            console.log('Usuario autenticado, redirigiendo a calls.html');
            redirectToCalls();
        }
    });

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            console.log('Intentando iniciar sesión con email/contraseña');
            await auth.signInWithEmailAndPassword(email, password);
            console.log('Inicio de sesión exitoso con email/contraseña');
            redirectToCalls();
        } catch (error) {
            console.error('Error al iniciar sesión con email/contraseña:', error);
            alert('Error al iniciar sesión: ' + error.message);
        }
    });

    signupForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        try {
            console.log('Intentando registrarse con email/contraseña');
            await auth.createUserWithEmailAndPassword(email, password);
            console.log('Registro exitoso con email/contraseña');
            redirectToCalls();
        } catch (error) {
            console.error('Error al registrarse:', error);
            alert('Error al registrarse: ' + error.message);
        }
    });

    forgotForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        try {
            console.log('Enviando correo de recuperación');
            await auth.sendPasswordResetEmail(email);
            alert('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
            forgotContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
        } catch (error) {
            console.error('Error al enviar el correo de recuperación:', error);
            alert('Error al enviar el correo: ' + error.message);
        }
    });

    googleLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            console.log('Intentando iniciar sesión con Google');
            const result = await auth.signInWithPopup(provider);
            console.log('Inicio de sesión exitoso con Google:', result.user);
            redirectToCalls();
        } catch (error) {
            console.error('Error con Google:', error);
            if (error.code === 'auth/popup-blocked') {
                alert('El pop-up fue bloqueado. Por favor, permite los pop-ups e intenta de nuevo.');
            } else {
                alert('Error con Google: ' + error.message);
            }
        }
    });

    microsoftLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.OAuthProvider('microsoft.com');
        try {
            console.log('Intentando iniciar sesión con Microsoft');
            const result = await auth.signInWithPopup(provider);
            console.log('Inicio de sesión exitoso con Microsoft:', result.user);
            redirectToCalls();
        } catch (error) {
            console.error('Error con Microsoft:', error);
            if (error.code === 'auth/popup-blocked') {
                alert('El pop-up fue bloqueado. Por favor, permite los pop-ups e intenta de nuevo.');
            } else {
                alert('Error con Microsoft: ' + error.message);
            }
        }
    });

    githubLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.GithubAuthProvider();
        try {
            console.log('Intentando iniciar sesión con GitHub');
            const result = await auth.signInWithPopup(provider);
            console.log('Inicio de sesión exitoso con GitHub:', result.user);
            redirectToCalls();
        } catch (error) {
            console.error('Error con GitHub:', error);
            if (error.code === 'auth/popup-blocked') {
                alert('El pop-up fue bloqueado. Por favor, permite los pop-ups e intenta de nuevo.');
            } else {
                alert('Error con GitHub: ' + error.message);
            }
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
    auth.onAuthStateChanged(async user => {
        if (!user) {
            console.log('No hay usuario autenticado, redirigiendo a index.html');
            window.location.href = 'index.html';
        } else {
            currentUser = user;
            // Registrar usuario como conectado
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                online: true,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Escuchar usuarios conectados
            listenForUsers();
            // Escuchar llamadas entrantes
            listenForIncomingCalls();
        }
    });

    logoutButton.addEventListener('click', async () => {
        console.log('Cerrando sesión');
        await db.collection('users').doc(currentUser.uid).update({ online: false });
        auth.signOut();
    });

    hangupButton.addEventListener('click', hangup);
    muteButton.addEventListener('click', toggleMute);
    videoOffButton.addEventListener('click', toggleVideo);
    acceptButton.addEventListener('click', acceptCall);
    rejectButton.addEventListener('click', rejectCall);

    // Mostrar lista de usuarios conectados
    function listenForUsers() {
        db.collection('users').where('online', '==', true).onSnapshot(snapshot => {
            usersList.innerHTML = '';
            snapshot.forEach(doc => {
                const user = doc.data();
                if (doc.id !== currentUser.uid) { // No mostrar al usuario actual
                    const li = document.createElement('li');
                    li.textContent = user.displayName || user.email;
                    const callButton = document.createElement('button');
                    callButton.textContent = 'Llamar';
                    callButton.onclick = () => startCall(doc.id, user.displayName || user.email);
                    li.appendChild(callButton);
                    usersList.appendChild(li);
                }
            });
        });
    }

    // Iniciar una llamada
    async function startCall(targetUserId, targetUserName) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;

            peerConnection = new RTCPeerConnection(configuration);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.ontrack = event => {
                remoteVideo.srcObject = event.streams[0];
            };

            currentCallId = `${currentUser.uid}-${targetUserId}-${Date.now()}`;
            hangupButton.disabled = false;

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    db.collection('calls').doc(currentCallId).collection('callerCandidates').add(event.candidate.toJSON());
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            await db.collection('calls').doc(currentCallId).set({
                callerId: currentUser.uid,
                targetId: targetUserId,
                offer: { type: offer.type, sdp: offer.sdp },
                status: 'pending',
                callerName: currentUser.displayName || currentUser.email.split('@')[0]
            });

            db.collection('calls').doc(currentCallId).onSnapshot(async snapshot => {
                const data = snapshot.data();
                if (data && data.status === 'accepted' && !peerConnection.currentRemoteDescription && data.answer) {
                    const answer = new RTCSessionDescription(data.answer);
                    await peerConnection.setRemoteDescription(answer);
                } else if (data && data.status === 'rejected') {
                    alert(`${targetUserName} rechazó la llamada.`);
                    hangup();
                }
            });

            db.collection('calls').doc(currentCallId).collection('calleeCandidates').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        await peerConnection.addIceCandidate(candidate);
                    }
                });
            });

        } catch (error) {
            console.error('Error al iniciar la llamada:', error);
            alert('Error al iniciar la llamada: ' + error.message);
            hangup();
        }
    }

    // Escuchar llamadas entrantes
    function listenForIncomingCalls() {
        db.collection('calls').where('targetId', '==', currentUser.uid).where('status', '==', 'pending')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const callData = change.doc.data();
                        currentCallId = change.doc.id;
                        callerName.textContent = callData.callerName;
                        incomingCall.style.display = 'block';
                    }
                });
            });
    }

    // Aceptar llamada
    async function acceptCall() {
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
                    db.collection('calls').doc(currentCallId).collection('calleeCandidates').add(event.candidate.toJSON());
                }
            };

            const callDoc = db.collection('calls').doc(currentCallId);
            const callData = (await callDoc.get()).data();
            const offer = callData.offer;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            await callDoc.update({
                answer: { type: answer.type, sdp: answer.sdp },
                status: 'accepted'
            });

            db.collection('calls').doc(currentCallId).collection('callerCandidates').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        await peerConnection.addIceCandidate(candidate);
                    }
                });
            });

            incomingCall.style.display = 'none';
            hangupButton.disabled = false;

        } catch (error) {
            console.error('Error al aceptar la llamada:', error);
            alert('Error al aceptar la llamada: ' + error.message);
            hangup();
        }
    }

    // Rechazar llamada
    async function rejectCall() {
        await db.collection('calls').doc(currentCallId).update({ status: 'rejected' });
        incomingCall.style.display = 'none';
        currentCallId = null;
    }

    // Colgar llamada
    async function hangup() {
        if (peerConnection) peerConnection.close();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
        hangupButton.disabled = true;

        if (currentCallId) {
            const callDoc = db.collection('calls').doc(currentCallId);
            await callDoc.collection('callerCandidates').get().then(s => s.forEach(d => d.ref.delete()));
            await callDoc.collection('calleeCandidates').get().then(s => s.forEach(d => d.ref.delete()));
            await callDoc.delete();
            currentCallId = null;
        }

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
