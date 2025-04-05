const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const roomIdElement = document.getElementById("room-id");
const copyIcon = document.querySelector(".copy-icon");
const leaveButton = document.querySelector(".leave-chat");
const deleteButton = document.querySelector(".delete-chat");
const fileInput = document.getElementById("file-input");
const toggleVanish = document.getElementById("toggle-delete");
const ws = new WebSocket("ws://localhost:3000");

let currentUsername = `user-${Math.floor(
    1000000000 + Math.random() * 9000000000
)}`;

let vanishMode = false;

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

// match the room ID in the URL with the one in the WebSocket connection if not matched close the connection
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
    if (message.startsWith("data:image/")) {
        const imageContainer = document.createElement("div");
        const imageElement = document.createElement("img");
        imageElement.src = message;
        imageElement.style.width = "200px";
        imageElement.style.height = "200px";
        imageElement.style.objectFit = "cover";
        imageElement.style.borderRadius = "10px";
        imageElement.style.margin = "10px";
        imageElement.classList.add("received-image");
        imageContainer.appendChild(imageElement);
        messagesDiv.appendChild(imageContainer);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        if (vanishMode) {
            setTimeout(() => {
                imageElement.style.opacity = "0";
                setTimeout(() => imageElement.remove(), 300);
            }, 5000);
        }
    }
    // {"type":"join","roomId":"83479","username":"user-2845582552"}
    else if (message.startsWith("{")) {
        const data = JSON.parse(message);
        if (data.type === "delete") {
            // alert("Chat deleted by admin");
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
                // alert("Vanish mode disabled.");
                vanishMode = !vanishMode;
                displayMessage(vanishMessage);
            }
            else {
                vanishMessage = `<i><b>${data.username} has enabled vanish mode.</b></i>`;
                toggleVanish.style.backgroundColor = "black";
                toggleVanish.style.color = "white";
                toggleVanish.style.borderColor = "white";
                messageInput.style.backgroundColor = "black";
                messageInput.style.color = "white";
                // alert("Vanish mode enabled.");
                displayMessage(vanishMessage);
                vanishMode = !vanishMode;
            }
            
        }
        if (data.type === "join") {
            const joinMessage = `<i><b>${data.username} has joined the room.</b></i>`;
            displayMessage(joinMessage);
        }
    }
    else {
        displayMessage(message);
    }
});

sendButton.addEventListener("click", () => {
    if (messageInput.value.trim()) {
        const message = messageInput.value.trim();
        ws.send(message);
        displayMessage(message, true);
        messageInput.value = "";
    }
});
messageInput.addEventListener("keydown", (e) => {
    if (messageInput.value.trim() && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const message = messageInput.value.trim();
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        const formattedMessage = `${message}</br>
        <small><i>${timeString} • ${currentUsername}</i></small>`;
        ws.send(formattedMessage);
        const sender = "You";
        const sentMessage = `${message}</br>
        <small><i>${timeString} • ${sender}</i></small>`;
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
            // updateProgress(messageElement, 30, isSender);
            let count = 100;
            const interval = setInterval(() => {
                updateProgress(messageElement, count, isSender);
                count--;
                if (count < 0) {
                    clearInterval(interval);
                }
                console.log(count);
            }
            , 50);
            setTimeout(() => {
                messageElement.style.opacity = "0";
                setTimeout(() => messageElement.remove(), 300);
            }, 5000);
    }
}

function updateProgress(messageElement, percent, isSender = false) {
    const progressBar = messageElement;
        if(isSender){
            progressBar.style.background = `linear-gradient(90deg, #007bff ${percent}%,rgb(91, 170, 255) ${percent}%)`;
        }
        else{
            progressBar.style.background = `linear-gradient(90deg,rgb(0, 0, 0) ${percent}%,rgb(115, 115, 115) ${percent}%)`;
        }
}

// Leave Chat
leaveButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to leave this chat?")) {
        ws.send(
            JSON.stringify({
                type: "leave",
                roomId: getRoomIdFromURL(),
                username: currentUsername,
            })
        );
        window.location.href = "index.html";
    }
});

// Delete Chat Button
deleteButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this chat?")) {
        localStorage.removeItem("roomId");
        ws.send(JSON.stringify({ type: "delete", roomId: getRoomIdFromURL() }));
        window.location.href = "index.html";
    }
});

// Copy Room ID to Clipboard
copyIcon.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(getRoomIdFromURL());
        alert("Room ID copied to clipboard!");
    } catch (err) {
        console.error("Failed to copy:", err);
    }
});
// on clicking the file input, open the file picker
fileInput.addEventListener("click", () => {
    document.getElementById("fileInput").click();
});
// select only image files and send them to the server
document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageData = e.target.result;
            ws.send(imageData);
            const now = new Date();
            const timeString = now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
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
            imageContainer.style.alignItems = "flex-end";
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
    if (vanishMode) {
        vanishMode = false;
        toggleVanish.style.backgroundColor = "white";
        toggleVanish.style.color = "black";
        toggleVanish.style.borderColor = "black";
        messageInput.style.backgroundColor = "#f8f9fa";
        messageInput.style.color = "black";
        // alert("Vanish mode disabled.");
        ws.send(JSON.stringify({ type: "vanish", roomId: getRoomIdFromURL(), username: currentUsername }));
    } else {
        vanishMode = true;
        toggleVanish.style.backgroundColor = "black";
        toggleVanish.style.color = "white";
        toggleVanish.style.borderColor = "white";
        messageInput.style.backgroundColor = "black";
        messageInput.style.color = "white";
        // alert("Vanish mode enabled.");
        ws.send(JSON.stringify({ type: "vanish", roomId: getRoomIdFromURL(), username: currentUsername }));
    }
}
);