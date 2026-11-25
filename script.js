let voiceEnabled = true;

let history = JSON.parse(
    localStorage.getItem("jarvisHistory") || "[]"
);

const chatbox = document.getElementById("chatbox");
const statusText = document.getElementById("status");

function showMessage(text, sender) {
    const div = document.createElement("div");

    div.className = "message " + sender;
    div.textContent =
        (sender === "user" ? "YOU: " : "JARVIS: ") + text;

    chatbox.appendChild(div);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function renderHistory() {
    chatbox.innerHTML = "";

    history.forEach(item => {
        showMessage(item.content, item.role === "user" ? "user" : "jarvis");
    });
}

renderHistory();

async function sendMessage() {

    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) return;

    input.value = "";

    history.push({
        role: "user",
        content: message
    });

    showMessage(message, "user");

    statusText.textContent = "JARVIS IS THINKING...";

    try {

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: history.slice(-12)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed");
        }

        const reply = data.reply;

        history.push({
            role: "assistant",
            content: reply
        });

        localStorage.setItem(
            "jarvisHistory",
            JSON.stringify(history)
        );

        showMessage(reply, "jarvis");

        speak(reply);

        statusText.textContent = "JARVIS IS READY.";

    } catch (error) {

        showMessage(error.message, "jarvis");
        statusText.textContent = "CONNECTION ERROR";

    }
}

function speak(text) {

    if (!voiceEnabled || !("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "hi-IN";
    speech.rate = 1;
    speech.pitch = 0.9;

    speechSynthesis.speak(speech);
}

function toggleVoice() {
    voiceEnabled = !voiceEnabled;

    if (!voiceEnabled && "speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

    statusText.textContent =
        voiceEnabled ? "VOICE ENABLED" : "VOICE DISABLED";
}

function startListening() {

    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!Recognition) {
        alert("Voice recognition is not supported in this browser.");
        return;
    }

    const recognition = new Recognition();

    recognition.lang = "hi-IN";
    recognition.interimResults = false;

    recognition.onstart = () => {
        statusText.textContent = "LISTENING...";
    };

    recognition.onresult = (event) => {
        document.getElementById("userInput").value =
            event.results[0][0].transcript;

        sendMessage();
    };

    recognition.onerror = () => {
        statusText.textContent = "VOICE ERROR";
    };

    recognition.start();
}

function clearChat() {

    history = [];

    localStorage.removeItem("jarvisHistory");

    chatbox.innerHTML = "";

    statusText.textContent = "CHAT CLEARED";
}

document.getElementById("userInput")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
