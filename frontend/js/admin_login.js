// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const messageDiv = document.getElementById('message');

    // Endereço da API do painel de administração (use localhost para o seu ambiente de teste)
    const API_ADMIN_URL = 'http://localhost:3000'; 

    adminLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Previne o comportamento padrão do formulário

        const submitButton = adminLoginForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'A autenticar...';
        displayMessage('', ''); // Limpa mensagens anteriores

        const email = document.getElementById('email').value;
        const password = document.getElementById('senha').value;

        try {
            const response = await fetch(`${API_ADMIN_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao autenticar.');
            }

            // Se o login for bem-sucedido:
            displayMessage('Login bem-sucedido! A redirecionar...', 'success');
            
            // Guarda o token de acesso no armazenamento local do navegador
            localStorage.setItem('adminToken', data.token);

            // Redireciona para a página principal do dashboard após 1.5 segundos
            setTimeout(() => {
                window.location.href = 'admin_dashboard.html';
            }, 1500);

        } catch (error) {
            displayMessage(error.message, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
        }
    });

    function displayMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = type ? `message ${type}` : '';
    }
});
