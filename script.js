const API_BASE = "https://mock-api.driven.com.br/api/v6/uol";
const roomUUID = "22390dbd-1f2b-4647-9dc4-fab480e6f6c2"; 
let userName = "";

// Inicializar
function askName() {
    userName = prompt("Qual é o seu nome?");
    while (!userName || userName.trim() === "") {
        userName = prompt("Digite um nome válido para entrar no chat:");
    }
    joinChat();
}


// Enviar nome ao servidor
async function joinChat() {
    try {
        await axios.post(`${API_BASE}/participants/${roomUUID}`, { name: userName });
        keepConnection();
        loadMessages();
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

// Renderizar mensagens
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

// Manter conexão ativa
function keepConnection() {
    if (!userName || userName.trim() === "") {
        console.error("Erro: Nome de usuário não definido. Não é possível manter conexão.");
        return;
    }

    setInterval(async () => {
        try {
            const response = await axios.post(`${API_BASE}/status/${roomUUID}`, {
                name: userName.trim(), // Certifique-se de que o nome está limpo
            });
            console.log("Conexão mantida com sucesso:", response.status);
        } catch (error) {
            console.error("Erro ao manter a conexão:", error.response?.data || error.message);
            alert("Você foi desconectado! Recarregando...");
            window.location.reload(); // Recarrega a página em caso de erro
        }
    }, 5000); // A cada 5 segundos
}


// Enviar mensagem
document.getElementById("message-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("message-input");
    const message = {
        from: userName,
        to: "Todos",
        text: input.value,
        type: "message",
    };
    input.value = "";
    await axios.post(`${API_BASE}/messages/${roomUUID}`, message);
    loadMessages();
});

// Alternar sidebar
const sidebar = document.getElementById("sidebar");
document.getElementById("toggle-participants").addEventListener("click", () => {
    sidebar.classList.toggle("visible");
});
document.getElementById("close-sidebar").addEventListener("click", () => {
    sidebar.classList.remove("visible");
});

// Inicializar chat
askName();