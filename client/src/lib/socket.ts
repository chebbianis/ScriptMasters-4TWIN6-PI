import io from "socket.io-client";

// Configuration améliorée avec options de reconnexion
export const socket = io("http://localhost:3000", {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    autoConnect: true
});

// Ajouter des écouteurs d'événements pour le debug
socket.on('connect', () => {
    console.log('✅ Connexion Socket.IO établie:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion Socket.IO:', error.message);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Déconnexion Socket.IO:', reason);
});

socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Tentative de reconnexion Socket.IO #${attemptNumber}`);
});

export default socket;