document.addEventListener('DOMContentLoaded', () => {
    const createChatBtn = document.getElementById('create-chat');
    const joinChatBtn = document.getElementById('join-chat');
    const joinContainer = document.getElementById('join-container');
    const roomCodeInput = document.getElementById('room-code');

    const IP = "192.168.1.47"; // Replace with your local IP address
    const ws = new WebSocket(`ws://${IP}:3000`);

    // Create new room
    createChatBtn.addEventListener('click', async () => {
        const roomId = Math.floor(10000 + Math.random() * 90000).toString();
        localStorage.setItem('roomId', roomId);
        // http://127.0.0.1:5000/api/customers
        try {
            await fetch(`http://${IP}:3000/save-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roomId })
            });
            console.log('📌 Room ID saved:', roomId);
            window.location.href = `chat.html?room=${roomId}?A`;
        } catch (err) {
            console.error('❌ Failed to save room on server:', err);
            alert('Something went wrong. Please try again.');
        }
    });

    // Join existing room
    joinChatBtn.addEventListener('click', async () => {
        if (roomCodeInput.classList.contains('hidden')) {
            roomCodeInput.classList.remove('hidden');
            joinChatBtn.textContent = 'Join Room';
        } else {
            const enteredCode = roomCodeInput.value.trim();
            
            if (enteredCode.length === 5 && !isNaN(enteredCode)) {
                try {
                    const res = await fetch(`http://${IP}:3000/get-room`);
                    const data = await res.json();
                    console.log('📥 Current room ID:', data);
                    if (data.roomId === enteredCode) {
                        // localStorage.setItem('roomId', enteredCode);
                        window.location.href = `chat.html?room=${enteredCode}?N`;
                    } else {
                        alert('Invalid room code or room does not exist.');
                    }
                } catch (err) {
                    console.error('❌ Error fetching room ID:', err);
                    alert('Unable to verify room. Please try again.');
                }
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