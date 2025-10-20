// Ficheiro: frontend/js/admin_dashboard.js

const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('adminToken');
    const API_ADMIN_URL = 'http://localhost:3000'; 

    const options = {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
    };

    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_ADMIN_URL}${endpoint}`, options);

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin_login.html';
        throw new Error('Não autorizado.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro na API.');
    }

    return data;
};

// Disponibiliza a função loadPage globalmente para os atalhos rápidos
let loadPageExternal;

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
        'admin_hotspot': window.initHotspotPage, // NOVO
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
                setTimeout(initFunction, 0);
            } else {
                console.warn(`Função de inicialização para a página '${pageName}' não encontrada.`);
            }

        } catch (error) {
            console.error(`Erro ao carregar a página ${pageName}:`, error);
            mainContentArea.innerHTML = '<h2>Erro ao carregar a página. Verifique a consola.</h2>';
        }
    };

    loadPageExternal = loadPage;

    const fetchUserProfile = async () => {
        try {
            const data = await apiRequest('/api/admin/profile');
            if (userNameElement) {
                userNameElement.textContent = data.profile.email;
            }
            if (data.profile.role === 'master' || data.profile.role === 'gestao') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'flex';
                });
            }
        } catch (error) {
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

    fetchUserProfile();

    const homeLink = document.querySelector('[data-page="admin_home"]');
    if (homeLink) {
        loadPage('admin_home', homeLink);
    }
});

