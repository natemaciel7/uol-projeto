const API_BASE = "https://mock-api.driven.com.br/api/v6/uol";
const roomUUID = "5ae0a056-2ae8-465f-8426-ff455106acaf";
let userName = "";
let currentRecipient = "Todos";
let messageType = "public";

function selectRecipient(name) {
    currentRecipient = name;
    document.getElementById("message-status").textContent = `Enviando para ${name} (${messageType === "private" ? "Reservadamente" : "Público"})`;
}

document.querySelectorAll('input[name="visibility"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
        messageType = event.target.value;
        document.getElementById("message-status").textContent = `Enviando para ${currentRecipient} (${messageType === "private" ? "Reservadamente" : "Público"})`;
    });
});

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

function askName() {
    userName = prompt("Qual é o seu nome?");
    while (!userName || userName.trim() === "") {
        userName = prompt("Digite um nome válido para entrar no chat:");
    }
    joinChat();
}

async function loadParticipants() {
    try {
        const { data } = await axios.get(`${API_BASE}/participants/${roomUUID}`);
        const participantsList = document.getElementById("participants");
        participantsList.innerHTML = '<li onclick="selectRecipient(\'Todos\')">Todos</li>';
        data.forEach(participant => {
            const li = document.createElement("li");
            li.textContent = participant.name;
            li.onclick = () => selectRecipient(participant.name);
            participantsList.appendChild(li);
        });
    } catch (error) {
        console.error("Erro ao carregar participantes:", error.response?.data || error.message);
    }
}

async function joinChat() {
    try {
        await axios.post(`${API_BASE}/participants/${roomUUID}`, { name: userName });
        keepConnection();
        loadParticipants();
        loadMessages();
        autoLoadMessages(); 
    } catch (error) {
        alert("Nome já em uso. Escolha outro.");
        askName();
    }
}
async function loadMessages() {
    try {
        const { data } = await axios.get(`${API_BASE}/messages/${roomUUID}`);
        renderMessages(data);
    } catch (error) {
        console.error("Erro ao buscar mensagens:", error.response?.data || error.message);
    }
}
function autoLoadMessages() {
    setInterval(loadMessages, 3000);
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

function keepConnection() {
    if (!userName || userName.trim() === "") {
        console.error("Erro: Nome de usuário não definido. Não é possível manter conexão.");
        return;
    }
    setInterval(async () => {
        try {
            const response = await axios.post(`${API_BASE}/status/${roomUUID}`, {
                name: userName.trim(), 
            });
            console.log("Conexão mantida com sucesso:", response.status);
        } catch (error) {
            console.error("Erro ao manter a conexão:", error.response?.data || error.message);
            alert("Você foi desconectado! Recarregando...");
            window.location.reload();
        }
    }, 5000);
}

const sidebar = document.getElementById("sidebar");

document.getElementById("toggle-participants").addEventListener("click", () => {
    sidebar.classList.toggle("visible");
});
document.getElementById("close-sidebar").addEventListener("click", () => {
    sidebar.classList.remove("visible");
});

askName();
