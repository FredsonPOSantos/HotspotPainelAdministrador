// Ficheiro: frontend/js/admin_dashboard.js

const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('adminToken');
    
    // [CORRIGIDO] Constrói a URL do backend dinamicamente.
    // Ele vai usar http://127.0.0.1:3000 ou http://172.16.12.239:3000
    // baseado em como você acedeu a página.
    const API_ADMIN_URL = `${window.location.protocol}//${window.location.hostname}:3000`; 

    const options = {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
    };

    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_ADMIN_URL}${endpoint}`, options);

    // [CORRIGIDO] Trata 401 (Não Autenticado) como um erro fatal que força o logout.
    if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin_login.html';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // [CORRIGIDO] Trata 403 (Não Autorizado/Proibido) como um erro de permissão,
    // mas NÃO desloga. Apenas rejeita a promessa para o .catch() da página lidar.
    if (response.status === 403) {
        // Tenta ler a mensagem de erro da API, se houver
        const dataError = await response.json().catch(() => ({ message: 'Acesso negado.' }));
        throw new Error(dataError.message || 'Acesso negado. Você não tem permissão para esta ação.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro na API.');
    }

    return data;
};

// Disponibiliza a função loadPage globalmente para os atalhos rápidos
let loadPageExternal;
// [NOVO] Disponibiliza o perfil do utilizador globalmente para outros scripts
window.currentUserProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin_login.html';
        return;
    }
    
    const userNameElement = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');
    const mainContentArea = document.querySelector('.content-area');
    const navLinks = document.querySelectorAll('.nav-item');
    const pageTitleElement = document.getElementById('pageTitle');

    const pageInitializers = {
        'admin_home': window.initHomePage,
        'admin_hotspot': window.initHotspotPage,
        'admin_users': window.initUsersPage,
        'admin_templates': window.initTemplatesPage,
        'admin_banners': window.initBannersPage,
        'admin_campaigns': window.initCampaignsPage,
        'admin_routers': window.initRoutersPage
    };

    const loadPage = async (pageName, linkElement) => {
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
                setTimeout(initFunction, 0); // Executa a inicialização após o HTML ser renderizado
            } else {
                console.warn(`Função de inicialização para a página '${pageName}' não encontrada.`);
            }

        } catch (error) {
            console.error(`Erro ao carregar a página ${pageName}:`, error);
            mainContentArea.innerHTML = '<h2>Erro ao carregar a página. Verifique a consola.</h2>';
        }
    };

    loadPageExternal = loadPage; // Disponibiliza a função globalmente

    const fetchUserProfile = async () => {
        try {
            const data = await apiRequest('/api/admin/profile');
            window.currentUserProfile = data.profile; // [MODIFICADO] Guarda o perfil completo

            if (userNameElement) {
                userNameElement.textContent = window.currentUserProfile.email; // [MODIFICADO] Usa a nova variável
            }
            
            // [MODIFICADO] Usa a nova variável global e verifica se ela existe
            if (window.currentUserProfile && (window.currentUserProfile.role === 'master' || window.currentUserProfile.role === 'gestao')) {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'flex';
                });
            }
        } catch (error) {
            console.error("Falha ao buscar perfil:", error.message);
            // Se falhar o fetchUserProfile (ex: token antigo), o apiRequest já tratou o logout
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

    // Ações de inicialização
    fetchUserProfile(); // Busca o perfil primeiro

    const homeLink = document.querySelector('[data-page="admin_home"]');
    if (homeLink) {
        loadPage('admin_home', homeLink); // Carrega a página inicial
    }
});

