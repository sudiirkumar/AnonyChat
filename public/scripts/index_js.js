document.addEventListener('DOMContentLoaded', () => {
    const createChatBtn = document.getElementById('create-chat');
    const joinChatBtn = document.getElementById('join-chat');
    const joinContainer = document.getElementById('join-container');
    const roomCodeInput = document.getElementById('room-code');
    
    // Connect to Socket.IO server (same as chat.js)
    const ws = new WebSocket("ws://localhost:3000");

    // Create new room
    createChatBtn.addEventListener('click', () => {
        const roomId = Math.floor(10000 + Math.random() * 90000);
        localStorage.setItem('roomId', roomId);
        // alert('Room created successfully! Your room ID is ' + roomId);
        window.location.href = `chat.html?room=${roomId}?A`;
    });

    // Toggle room code input
    joinChatBtn.addEventListener('click', () => {
        if (roomCodeInput.classList.contains('hidden')) {
            roomCodeInput.classList.remove('hidden');
            joinChatBtn.textContent = 'Join Room';
        } else {
            const code = roomCodeInput.value.trim();
            if (localStorage.getItem('roomId') == code && code.length === 5 && !isNaN(code)) {
                window.location.href = `chat.html?room=${code}?N`;
            } else {
                alert('Please enter a valid 5-digit room code');
            }
        }
    });
    roomCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            joinChatBtn.click();
        }
    });
});