const API_BASE = "https://mock-api.driven.com.br/api/v6/uol";
const roomUUID = "22390dbd-1f2b-4647-9dc4-fab480e6f6c2"; 
let userName = "";
let participantsList = [];
let selectedParticipant = "Todos";
let isPrivate = false;

// Solicita o nome do usuário
function askName() {
    userName = prompt("Qual é o seu nome?");
    while (!userName || userName.trim() === "") {
        userName = prompt("Digite um nome válido para entrar no chat:");
    }
    joinChat();
}

// Entrar no chat
async function joinChat() {
    try {
        await axios.post(`${API_BASE}/participants/${roomUUID}`, { name: userName });
        keepConnection();
        loadMessages();
        loadParticipants();
    } catch (error) {
        alert("Nome já em uso. Escolha outro.");
        askName();
    }
}

// Carregar mensagens
async function loadMessages() {
    try {
        const { data } = await axios.get(`${API_BASE}/messages/${roomUUID}`);
        renderMessages(data);
    } catch (error) {
        console.error("Erro ao buscar mensagens.", error);
    }
}

// Renderizar mensagens no chat
function renderMessages(messages) {
    const chatWindow = document.getElementById("messages");
    chatWindow.innerHTML = "";
    messages.forEach(msg => {
        if (msg.type === "private_message" && msg.to !== userName && msg.from !== userName) {
            return; // Ignorar mensagens privadas que não são para o usuário
        }

        const li = document.createElement("li");
        li.classList.add(msg.type);
        li.textContent = `(${msg.time}) ${msg.from} para ${msg.to}: ${msg.text}`;
        chatWindow.appendChild(li);
    });
    chatWindow.lastElementChild?.scrollIntoView();
}

// Manter a conexão ativa
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

// Carregar participantes
async function loadParticipants() {
    try {
        const { data } = await axios.get(`${API_BASE}/participants/${roomUUID}`);
        participantsList = data;
        renderParticipants();
    } catch (error) {
        console.error("Erro ao carregar participantes:", error);
    }
}

// Renderizar participantes no sidebar
function renderParticipants() {
    const participantsContainer = document.getElementById("participants");
    participantsContainer.innerHTML = participantsList
        .map(participant => 
            `<li onclick="selectParticipant('${participant.name}')">${participant.name}</li>`
        )
        .join("");
}

// Selecionar um participante para mensagem privada
function selectParticipant(name) {
    selectedParticipant = name;
    isPrivate = true;

    // Atualizar interface visual
    const participantsContainer = document.getElementById("participants");
    Array.from(participantsContainer.children).forEach(li => li.classList.remove("selected"));

    const selectedLi = Array.from(participantsContainer.children).find(li => li.textContent === name);
    if (selectedLi) selectedLi.classList.add("selected");

    // Atualizar status da mensagem
    const statusElement = document.getElementById("message-status");
    statusElement.textContent = `Enviando para ${selectedParticipant} (Privado)`;
}

// Enviar mensagens
document.getElementById("message-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("message-input");
    const message = {
        from: userName,
        to: selectedParticipant,
        text: input.value,
        type: isPrivate ? "private_message" : "message",
    };

    if (input.value.trim() === "") return; // Evitar envio de mensagens vazias

    try {
        await axios.post(`${API_BASE}/messages/${roomUUID}`, message);
        input.value = "";
        loadMessages();
        if (isPrivate) {
            document.getElementById("message-status").textContent = `Enviando para Todos (Público)`;
            isPrivate = false; // Resetar para público após envio
        }
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
    }
});

// Toggle do sidebar de participantes
const sidebar = document.getElementById("sidebar");
document.getElementById("toggle-participants").addEventListener("click", () => {
    sidebar.classList.toggle("visible");
});
document.getElementById("close-sidebar").addEventListener("click", () => {
    sidebar.classList.remove("visible");
});

// Iniciar aplicação
askName();
setInterval(loadParticipants, 10000); // Atualizar lista de participantes a cada 10 segundos
setInterval(loadMessages, 3000); // Atualizar mensagens a cada 3 segundos
