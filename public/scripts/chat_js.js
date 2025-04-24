const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const roomIdElement = document.getElementById("room-id");
const copyIcon = document.querySelector(".copy-icon");
const leaveButton = document.querySelector(".leave-chat");
const deleteButton = document.querySelector(".delete-chat");
const fileInput = document.getElementById("file-input");
const toggleVanish = document.getElementById("toggle-delete");

const IP = "anonychat-no20.onrender.com"; // Replace with your local IP address
// const ws = new WebSocket(`w`);
const ws = new WebSocket(`wss://anonychat-no20.onrender.com`);

//generate SECRET_KEY from roomId
const SECRET_KEY = CryptoJS.SHA256(getRoomIdFromURL).toString();

let currentUsername = `user-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
let vanishMode = false;

// AES Encryption/Decryption
function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
}

function decryptMessage(ciphertext) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8) || ciphertext;
    } catch (e) {
        return ciphertext;
    }
}

function getRoomIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("room").substring(0, 5);
}

function getIsAdmin() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("room").substring(6, 7) == "A";
}

function setRoomId() {
    const roomId = getRoomIdFromURL();
    if (roomId) {
        roomIdElement.innerHTML = `<strong>${roomId}</strong>`;
    } else {
        window.location.href = "index.html";
    }
    const isAdmin = getIsAdmin();
    if (isAdmin) {
        deleteButton.classList.remove("hidden");
        toggleVanish.classList.remove("hidden");
    }
}

setRoomId();

ws.addEventListener("open", () => {
    const roomId = getRoomIdFromURL();
    if (roomId) {
        ws.send(JSON.stringify({ type: "join", roomId, username: currentUsername }));
    } else {
        alert("Invalid room ID");
        window.location.href = "index.html";
    }
});

ws.addEventListener("message", (event) => {
    const message = event.data;
    dec_message = decryptMessage(message);
    if (dec_message.startsWith("data:image/")) {
        const message = dec_message;
        const imageContainer = document.createElement("div");
        const imageElement = document.createElement("img");
        imageElement.src = message;
        imageElement.style.width = "400px";
        imageElement.style.height = "400px";
        imageElement.style.objectFit = "cover";
        imageElement.style.borderRadius = "10px";
        imageElement.style.margin = "10px";
        imageElement.classList.add("received-image");
        imageContainer.appendChild(imageElement);
        messagesDiv.appendChild(imageContainer);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        //on click, open in new tab
        imageElement.addEventListener("click", () => {
            const newWindow = window.open();
            newWindow.document.write(`<html><head><title>Image</title></head><body><img src="${message}" style="height:100%; width:auto;"></body></html>`);
            newWindow.document.close();

            //on clicking anywhere, close the new tab
            newWindow.addEventListener("click", () => {
                newWindow.close();
            });
            
        });

        if (vanishMode) {
            setTimeout(() => {
                imageElement.style.opacity = "0";
                setTimeout(() => imageElement.remove(), 300);
            }, 5000);
        }
    } else if (message.startsWith("{")) {
        const data = JSON.parse(message);
        if (data.type === "delete") {
            window.location.href = "index.html";
        }
        if (data.type === "leave") {
            const leaveMessage = `<i><b>${data.username} has left the room.</b></i>`;
            displayMessage(leaveMessage);
        }
        if (data.type === "vanish") {
            let vanishMessage;
            if (vanishMode) {
                vanishMessage = `<i><b>${data.username} has disabled vanish mode.</b></i>`;
                toggleVanish.style.backgroundColor = "white";
                toggleVanish.style.color = "black";
                toggleVanish.style.borderColor = "black";
                messageInput.style.backgroundColor = "#f8f9fa";
                messageInput.style.color = "black";
                vanishMode = false;
            } else {
                vanishMessage = `<i><b>${data.username} has enabled vanish mode.</b></i>`;
                toggleVanish.style.backgroundColor = "black";
                toggleVanish.style.color = "white";
                toggleVanish.style.borderColor = "white";
                messageInput.style.backgroundColor = "black";
                messageInput.style.color = "white";
                vanishMode = true;
            }
            displayMessage(vanishMessage);
        }
        if (data.type === "join") {
            const joinMessage = `<i><b>${data.username} has joined the room.</b></i>`;
            displayMessage(joinMessage);
        }
    } else {
        const decrypted = decryptMessage(message);
        displayMessage(decrypted);
    }
});

sendButton.addEventListener("click", () => {
    if (messageInput.value.trim()) {
        const message = messageInput.value.trim();
        const encrypted = encryptMessage(message);
        ws.send(encrypted);
        displayMessage(message, true);
        messageInput.value = "";
    }
});

messageInput.addEventListener("keydown", (e) => {
    if (messageInput.value.trim() && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const message = messageInput.value.trim();
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const formattedMessage = `${message}</br><small><i>${timeString} • ${currentUsername}</i></small>`;
        const encryptedMessage = encryptMessage(formattedMessage);
        ws.send(encryptedMessage);

        const sender = "You";
        const sentMessage = `${message}</br><small><i>${timeString} • ${sender}</i></small>`;
        displayMessage(sentMessage, true);
        messageInput.value = "";
    }
});

function displayMessage(message, isSender = false) {
    const messageContainer = document.createElement("div");
    const messageElement = document.createElement("div");
    messageElement.innerHTML = message;

    messageContainer.classList.add("message-container");

    if (isSender) {
        messageContainer.classList.add("sender-message-container");
        messageElement.classList.add("message-bubble", "sender-message-bubble");
    } else {
        messageElement.classList.add("message-bubble");
    }

    messageContainer.appendChild(messageElement);
    messagesDiv.appendChild(messageContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (vanishMode) {
        let count = 100;
        const interval = setInterval(() => {
            updateProgress(messageElement, count, isSender);
            count--;
            if (count < 0) clearInterval(interval);
        }, 50);
        setTimeout(() => {
            messageElement.style.opacity = "0";
            setTimeout(() => messageElement.remove(), 300);
        }, 5000);
    }
}

function updateProgress(messageElement, percent, isSender = false) {
    if (isSender) {
        messageElement.style.background = `linear-gradient(90deg, #007bff ${percent}%, rgb(91, 170, 255) ${percent}%)`;
    } else {
        messageElement.style.background = `linear-gradient(90deg, rgb(0, 0, 0) ${percent}%, rgb(115, 115, 115) ${percent}%)`;
    }
}

leaveButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to leave this chat?")) {
        ws.send(JSON.stringify({ type: "leave", roomId: getRoomIdFromURL(), username: currentUsername }));
        window.location.href = "index.html";
    }
});

deleteButton.addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete this chat?")) {
        try {
            const response = await fetch(`http://${IP}/delete-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (response.ok) {
                alert('Room has been deleted!');
            } else {
                console.error('❌ Failed to delete room:', data.error);
            }

            ws.send(JSON.stringify({ type: "delete", roomId: getRoomIdFromURL() }));
            window.location.href = "index.html";
        } catch (error) {
            console.error('🚨 Error deleting room:', error);
        }
    }
});

copyIcon.addEventListener("click", () => {
    const roomId = getRoomIdFromURL();
    const textarea = document.createElement("textarea");
    textarea.value = roomId;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
        const successful = document.execCommand("copy");
        alert(successful ? "Room ID copied to clipboard!" : "Failed to copy Room ID.");
    } catch (err) {
        console.error("❌ Copy failed:", err);
        alert("Copy not supported in this browser.");
    }

    document.body.removeChild(textarea);
});

fileInput.addEventListener("click", () => {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageData = e.target.result;
            ws.send(encryptMessage(imageData));
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const imageDesc = `<i><b>${currentUsername} sent an image at ${timeString}</b></i>`;
            ws.send(imageDesc);

            const imageContainer = document.createElement("div");
            const imageElement = document.createElement("img");
            imageElement.src = imageData;
            imageElement.style.width = "200px";
            imageElement.style.height = "200px";
            imageElement.style.objectFit = "cover";
            imageElement.style.borderRadius = "10px";
            imageElement.style.margin = "10px";
            imageElement.classList.add("sent-image");

            imageContainer.appendChild(imageElement);
            imageContainer.style.display = "flex";
            imageContainer.style.justifyContent = "flex-end";
            messagesDiv.appendChild(imageContainer);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            if (vanishMode) {
                setTimeout(() => {
                    imageElement.style.opacity = "0";
                    setTimeout(() => imageElement.remove(), 300);
                }, 5000);
            }
        };
        reader.readAsDataURL(file);
    } else {
        alert("Please select a valid image file.");
    }
});

toggleVanish.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "vanish", roomId: getRoomIdFromURL(), username: currentUsername }));
    vanishMode = !vanishMode;
    if (vanishMode) {
        toggleVanish.style.backgroundColor = "black";
        toggleVanish.style.color = "white";
        toggleVanish.style.borderColor = "white";
        messageInput.style.backgroundColor = "black";
        messageInput.style.color = "white";
    } else {
        toggleVanish.style.backgroundColor = "white";
        toggleVanish.style.color = "black";
        toggleVanish.style.borderColor = "black";
        messageInput.style.backgroundColor = "#f8f9fa";
        messageInput.style.color = "black";
    }
});