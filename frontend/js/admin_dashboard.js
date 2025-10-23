// Ficheiro: frontend/js/admin_dashboard.js
// [VERSÃO ATUALIZADA - FASE 1.2 / MATRIZ V4 - Correção de Escopo]

// --- API REQUEST (Função de Comunicação) ---
const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const API_ADMIN_URL = `http://${window.location.hostname}:3000`;
    const token = localStorage.getItem('adminToken');

    const options = {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
    };

    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_ADMIN_URL}${endpoint}`, options);
        
        if (response.ok) {
            if (response.status === 204) {
                return null; 
            }
            return await response.json();
        }

        // --- Se a resposta NÃO ESTIVER OK (ex: 401, 403, 500) ---
        
        if (response.status === 401) {
            console.warn("Token inválido ou expirado. A deslogar...");
            localStorage.removeItem('adminToken');
            window.location.href = 'admin_login.html';
            throw new Error('Não autorizado.');
        }
        
        const errorData = await response.json();

        if (errorData.code === 'PASSWORD_CHANGE_REQUIRED') {
            console.warn("API bloqueada. Troca de senha é obrigatória.");
            showForcePasswordChangeModal(); // Mostra o modal de bloqueio
            throw new Error(errorData.message);
        }

        throw new Error(errorData.message || 'Ocorreu um erro na API.');

    } catch (error) {
        throw error; // Propaga o erro
    }
};

// --- [NOVA] LÓGICA DO MODAL DE TROCA DE SENHA ---
// [MOVIDA] para o escopo global para ser acessível pelo apiRequest

// Mostra o modal de bloqueio
const showForcePasswordChangeModal = () => {
    // [ALTERADO] Busca o elemento do modal no momento da chamada
    const changePasswordModal = document.getElementById('forceChangePasswordModal');
    
    if (changePasswordModal) {
        changePasswordModal.classList.remove('hidden');
        // Esconde o menu e o conteúdo principal para focar o utilizador
        document.querySelector('.sidebar')?.classList.add('hidden');
        document.querySelector('.main-content')?.classList.add('hidden');
    } else {
        // Este erro é a causa mais provável do seu problema.
        console.error("----------------------------------------------------------");
        console.error("ERRO FATAL: O Modal 'forceChangePasswordModal' não foi encontrado no seu ficheiro 'admin_dashboard.html'.");
        console.error("Por favor, garanta que o HTML do modal (que eu enviei anteriormente) existe no seu 'admin_dashboard.html'.");
        console.error("----------------------------------------------------------");
    }
};

// Disponibiliza a função loadPage globalmente para os atalhos rápidos
let loadPageExternal;
window.currentUserProfile = null; // Guarda o perfil do utilizador logado

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin_login.html';
        return;
    }
    
    // --- DOM ELEMENTS ---
    const userNameElement = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');
    const mainContentArea = document.querySelector('.content-area');
    const navLinks = document.querySelectorAll('.nav-item');
    const pageTitleElement = document.getElementById('pageTitle');
    
    // [NOVO] Elementos do Modal de Troca de Senha
    // (A função showForcePasswordChangeModal agora é global)
    const changePasswordForm = document.getElementById('forceChangePasswordForm');
    const changePasswordError = document.getElementById('forceChangePasswordError');
    const changePasswordSuccess = document.getElementById('forceChangePasswordSuccess');

    // Funções de inicialização de cada página
    const pageInitializers = {
        'admin_home': window.initHomePage,
        'admin_hotspot': window.initHotspotPage,
        'admin_users': window.initUsersPage,
        'admin_templates': window.initTemplatesPage,
        'admin_banners': window.initBannersPage,
        'admin_campaigns': window.initCampaignsPage,
        'admin_routers': window.initRoutersPage
    };

    // --- PAGE NAVIGATION ---
    const loadPage = async (pageName, linkElement) => {
        // Impede a navegação se a troca de senha for obrigatória
        if (window.currentUserProfile && window.currentUserProfile.must_change_password) {
            console.warn("Navegação bloqueada: Troca de senha pendente.");
            showForcePasswordChangeModal();
            return;
        }

        navLinks.forEach(link => link.classList.remove('active'));
        if(linkElement) {
            linkElement.classList.add('active');
            pageTitleElement.textContent = linkElement.textContent.trim().replace(/[\u{1F300}-\u{1F5FF}]/gu, '').trim();
        }

        try {
            const response = await fetch(`pages/${pageName}.html`);
            if (!response.ok) {
                throw new Error(`Página não encontrada: ${pageName}.html`);
            }
            
            mainContentArea.innerHTML = await response.text();

            const initFunction = pageInitializers[pageName];
            if (typeof initFunction === 'function') {
                setTimeout(initFunction, 0);
            }

        } catch (error) {
            console.error(`Erro ao carregar a página ${pageName}:`, error);
            mainContentArea.innerHTML = '<h2>Erro ao carregar a página. Verifique a consola.</h2>';
        }
    };

    loadPageExternal = loadPage;

    // --- USER PROFILE & AUTH ---
    const fetchUserProfile = async () => {
        try {
            const data = await apiRequest('/api/admin/profile');
            window.currentUserProfile = data.profile; // Guarda o perfil completo

            if (userNameElement) {
                userNameElement.textContent = data.profile.email;
            }
            
            // Lógica para mostrar links de admin (master, gestao, DPO)
            if (data.profile.role === 'master' || data.profile.role === 'gestao' || data.profile.role === 'DPO') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'flex';
                });
            }
            
            // Verifica a flag de troca de senha no carregamento do perfil
            if (data.profile.must_change_password) {
                console.log("Troca de senha obrigatória detetada no login.");
                showForcePasswordChangeModal();
            } else {
                // Se a troca não for necessária, carrega a página inicial
                const homeLink = document.querySelector('[data-page="admin_home"]');
                if (homeLink) {
                    loadPage('admin_home', homeLink);
                }
            }

        } catch (error) {
            // O erro 401 já redireciona no apiRequest.
            // Se for um erro 403 (ex: 'PASSWORD_CHANGE_REQUIRED'), a função showForcePasswordChangeModal já foi chamada.
            console.error("Falha ao buscar perfil:", error.message);
        }
    };

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin_login.html';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if(page) {
                loadPage(page, link);
            }
        });
    });

    
    // Submissão do formulário de troca de senha
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            changePasswordError.textContent = '';
            changePasswordSuccess.textContent = '';
            const submitButton = changePasswordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'A processar...';
            
            const currentPassword = e.target.currentTemporaryPassword.value;
            const newPassword = e.target.newPassword.value;

            try {
                // [IMPORTANTE] Esta rota (change-own-password) será a *única* permitida pelo middleware
                const result = await apiRequest('/api/admin/profile/change-own-password', 'POST', {
                    currentPassword,
                    newPassword
                });
                
                changePasswordSuccess.textContent = result.message + " O sistema será deslogado. Por favor, logue novamente.";
                
                // Desloga o utilizador após o sucesso (como solicitado)
                setTimeout(() => {
                    localStorage.removeItem('adminToken');
                    window.location.href = 'admin_login.html';
                }, 4000); // Espera 4 segundos para o utilizador ler a mensagem

            } catch (error) {
                changePasswordError.textContent = `Erro: ${error.message}`;
                submitButton.disabled = false;
                submitButton.textContent = 'Alterar Senha e Desbloquear';
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    fetchUserProfile(); // Carrega o perfil. O carregamento da página (loadPage) é chamado dentro dele.
});

