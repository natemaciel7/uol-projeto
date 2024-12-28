const API_BASE = "https://mock-api.driven.com.br/api/v6/uol";
const roomUUID = "22390dbd-1f2b-4647-9dc4-fab480e6f6c2";
let userName = "";
let currentRecipient = "Todos";
let messageType = "public";

async function askName() {
    while (true) {
        userName = prompt("Qual é o seu nome?");
        if (!userName || userName.trim() === "") {
            alert("Digite um nome válido para entrar no chat.");
            continue;
        }

        const nameIsValid = await checkNameAvailability(userName);
        if (nameIsValid) {
            break;
        }
        alert("Nome já em uso. Escolha outro.");
    }
    joinChat();
}

async function checkNameAvailability(name) {
    try {
        await axios.post(`${API_BASE}/participants/${roomUUID}`, { name });
        return true; // Nome é válido
    } catch {
        return false; // Nome já em uso
    }
}

async function joinChat() {
    keepConnection();
    loadMessages();
    loadParticipants();
}

async function keepConnection() {
    setInterval(async () => {
        await axios.post(`${API_BASE}/participants/${roomUUID}`, { name: userName });
    }, 5000);
}

async function loadMessages() {
    const { data } = await axios.get(`${API_BASE}/messages/${roomUUID}`);
    renderMessages(data);
}

function renderMessages(messages) {
    const chatWindow = document.getElementById("messages");
    chatWindow.innerHTML = "";
    messages.forEach(msg => {
        const li = document.createElement("li");
        li.classList.add(msg.type);
        li.textContent = `(${msg.time}) ${msg.from} para ${msg.to}: ${msg.text}`;
        chatWindow.appendChild(li);
    });
    chatWindow.lastElementChild?.scrollIntoView();
}

async function loadParticipants() {
    const { data } = await axios.get(`${API_BASE}/participants/${roomUUID}`);
    const participantsList = document.getElementById("participants");
    participantsList.innerHTML = '<li onclick="selectRecipient(\'Todos\')">Todos</li>';
    data.forEach(participant => {
        const li = document.createElement("li");
        li.textContent = participant.name;
        li.onclick = () => selectRecipient(participant.name);
        participantsList.appendChild(li);
    });
}

function selectRecipient(name) {
    currentRecipient = name;
    document.getElementById("message-status").textContent = `Enviando para ${name} (${messageType === "private" ? "Reservadamente" : "Público"})`;
}

document.getElementById("message-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("message-input");
    const message = {
        from: userName,
        to: currentRecipient,
        text: input.value,
        type: messageType === "private" ? "private_message" : "message",
    };
    input.value = "";
    await axios.post(`${API_BASE}/messages/${roomUUID}`, message);
    loadMessages();
});

document.getElementById("toggle-participants").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("visible");
});

document.getElementById("close-sidebar").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("visible");
});

document.querySelectorAll("input[name='visibility']").forEach(input => {
    input.addEventListener("change", (e) => {
        messageType = e.target.value;
        document.getElementById("message-status").textContent = `Enviando para ${currentRecipient} (${messageType === "private" ? "Reservadamente" : "Público"})`;
    });
});

// Iniciar o chat solicitando o nome do usuário
askName();
