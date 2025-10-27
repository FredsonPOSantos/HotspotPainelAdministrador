// Ficheiro: frontend/js/admin_dashboard.js
// [VERSÃO 14.4 - Fase 3.1 GESTÃO: Correção de timing robusta no loadPage]

// --- Variáveis Globais ---
let isProfileLoaded = false;
window.currentUserProfile = null;
let loadPageExternal;
window.systemSettings = null; 

// --- Funções Globais ---
const showForcePasswordChangeModal = () => {
    const changePasswordModal = document.getElementById('forceChangePasswordModal');
    if (changePasswordModal) {
        changePasswordModal.classList.remove('hidden');
        document.querySelector('.sidebar')?.classList.add('hidden');
        document.querySelector('.main-content')?.classList.add('hidden');
    } else {
        console.error("FATAL: Modal 'forceChangePasswordModal' não encontrado (V14.4)!");
    }
};

// apiRequest (Lógica V14.3 inalterada)
const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const API_ADMIN_URL = `http://${window.location.hostname}:3000`;
    const token = localStorage.getItem('adminToken');
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache' 
        }
    };

    let url = `${API_ADMIN_URL}${endpoint}`;

    if (method === 'GET') {
        url += (url.includes('?') ? '&' : '?') + `_=${Date.now()}`;
    }

    if (body instanceof FormData) {
        options.body = body;
    } else if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options); 
        if (!response.ok) {
            let errorData = {};
            try { errorData = await response.json(); }
            catch (e) { errorData.message = response.statusText || `Erro HTTP ${response.status}`; }

            if (response.status === 401) {
                console.warn("Token inválido/expirado (V14.4). Deslogando...");
                localStorage.removeItem('adminToken'); window.currentUserProfile = null; isProfileLoaded = false; window.systemSettings = null;
                window.location.href = 'admin_login.html'; throw new Error('Não autorizado.');
            } else if (errorData.code === 'PASSWORD_CHANGE_REQUIRED') {
                console.warn("API bloqueada (V14.4). Troca de senha obrigatória.");
                showForcePasswordChangeModal(); throw new Error(errorData.message || "Troca de senha obrigatória.");
            } else { throw new Error(errorData.message || `Erro ${response.status}`); }
        }
        if (response.status === 204) return null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) return await response.json();
        else return await response.text() || null;
    } catch (error) { console.error(`Erro em apiRequest (V14.4) ${method} ${endpoint}:`, error); throw error; }
};

// [NOVO V14.4] Helper para esperar que o HTML injetado esteja pronto
const waitForElement = (elementId, callback, retries = 20, delay = 50) => {
    return new Promise((resolve) => {
        const check = (retryCount) => {
            const el = document.getElementById(elementId);
            if (el) {
                // Elemento encontrado, executa a função init
                callback(); 
                resolve();  // Resolve a promessa
            } else if (retryCount > 0) {
                // Tenta novamente após o delay
                setTimeout(() => check(retryCount - 1), delay);
            } else {
                // Esgotou as tentativas
                console.error(`Timeout (V14.4): Elemento #${elementId} não encontrado após ${retries * delay}ms. initFunction para esta página não foi executada.`);
                resolve(); // Resolve mesmo assim para não bloquear a execução
            }
        };
        check(retries);
    });
};


// applyVisualSettings (Lógica V14.3 inalterada)
const applyVisualSettings = (settings) => {
    if (!settings) {
        console.warn("applyVisualSettings (V14.4): Configurações não fornecidas.");
        return;
    }
    console.log("applyVisualSettings (V14.4): Aplicando configurações...", settings);

    // 1. Nome da Empresa (Sidebar Header)
    const sidebarTitle = document.querySelector('.sidebar-header h2');
    if (sidebarTitle && settings.company_name) {
        sidebarTitle.textContent = settings.company_name;
        console.log(` - Nome aplicado: ${settings.company_name}`);
    } else if (!sidebarTitle) {
         console.warn("Elemento .sidebar-header h2 não encontrado para aplicar nome.");
    }

    // 2. Logótipo (Sidebar Header) 
    const sidebarLogo = document.getElementById('sidebarLogo'); 
    if (sidebarLogo) {
        if (settings.logo_url) {
            const API_ADMIN_URL = `http://${window.location.hostname}:3000`;
            const logoPath = settings.logo_url.startsWith('/') ? settings.logo_url : '/' + settings.logo_url;
            sidebarLogo.src = `${API_ADMIN_URL}${logoPath}?t=${Date.now()}`; 
            sidebarLogo.alt = settings.company_name || "Logótipo"; 
            
            // --- [CORREÇÃO V14.1] ---
            sidebarLogo.style.display = 'block'; 
            sidebarLogo.style.maxHeight = '50px'; 
            sidebarLogo.style.width = 'auto'; 
            sidebarLogo.style.marginBottom = '10px'; 
            // --- Fim da Correção ---

            console.log(` - Logo aplicado: ${sidebarLogo.src}`);
             if(sidebarTitle) sidebarTitle.style.display = 'none';
        } else {
            sidebarLogo.style.display = 'none'; 
            sidebarLogo.src = '#';
            console.log(" - Nenhum logo URL, logo escondido.");
             if(sidebarTitle) sidebarTitle.style.removeProperty('display');
        }
    } else {
        console.warn("Elemento #sidebarLogo não encontrado para aplicar logótipo.");
         if(sidebarTitle) sidebarTitle.style.removeProperty('display');
    }

    // 3. Cor Primária (Variável CSS)
    if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
        try {
             let darkerColor = settings.primary_color;
             if (settings.primary_color.startsWith('#') && settings.primary_color.length === 7) {
                 let r = parseInt(settings.primary_color.substring(1, 3), 16);
                 let g = parseInt(settings.primary_color.substring(3, 5), 16);
                 let b = parseInt(settings.primary_color.substring(5, 7), 16);
                 r = Math.max(0, r - 30).toString(16).padStart(2, '0');
                 g = Math.max(0, g - 30).toString(16).padStart(2, '0');
                 b = Math.max(0, b - 30).toString(16).padStart(2, '0');
                 darkerColor = `#${r}${g}${b}`;
             }
             document.documentElement.style.setProperty('--primary-color-dark', darkerColor);
              console.log(` - Cores aplicadas: ${settings.primary_color}, ${darkerColor}`);
        } catch (colorError) {
             console.error("Erro ao calcular cor escura:", colorError);
             document.documentElement.style.setProperty('--primary-color-dark', settings.primary_color); // Fallback
              console.log(` - Cor primária aplicada: ${settings.primary_color} (fallback)`);
        }
    } else {
         console.warn("Cor primária não definida nas configurações.");
         document.documentElement.style.removeProperty('--primary-color');
         document.documentElement.style.removeProperty('--primary-color-dark');
    }
};


// --- INICIALIZAÇÃO PRINCIPAL (DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Carregado (V14.4). Iniciando Dashboard...");
    const token = localStorage.getItem('adminToken');
    if (!token) { console.log("Nenhum token (V14.4). Redirecionando."); window.location.href = 'admin_login.html'; return; }

    // --- DOM Elements ---
    const userNameElement = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');
    const mainContentArea = document.querySelector('.content-area');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    const allNavItemsAndTitles = document.querySelectorAll('.sidebar-nav .nav-item, .sidebar-nav .nav-title'); // [ATUALIZADO V14]
    const pageTitleElement = document.getElementById('pageTitle');
    const changePasswordModal = document.getElementById('forceChangePasswordModal');
    const changePasswordForm = document.getElementById('forceChangePasswordForm');
    const changePasswordError = document.getElementById('forceChangePasswordError');
    const changePasswordSuccess = document.getElementById('forceChangePasswordSuccess');

    // Mapeamento de inicializadores (V14.3 inalterado)
    const pageInitializers = { 'admin_home': window.initHomePage, 'admin_hotspot': window.initHotspotPage, 'admin_users': window.initUsersPage, 'admin_templates': window.initTemplatesPage, 'admin_banners': window.initBannersPage, 'admin_campaigns': window.initCampaignsPage, 'admin_routers': window.initRoutersPage, 'admin_settings': window.initSettingsPage };

    // --- PAGE NAVIGATION ---
    const loadPage = async (pageName, linkElement) => {
        if (!isProfileLoaded) { console.warn(`loadPage (${pageName}) chamado antes do perfil (V14.4).`); }
        if (isProfileLoaded && window.currentUserProfile?.must_change_password) { console.warn(`Navegação ${pageName} bloqueada (V14.4): Senha.`); showForcePasswordChangeModal(); return; }
        console.log(`loadPage (V14.4): Carregando ${pageName}...`);
        navLinks.forEach(link => link.classList.remove('active'));
        let currentTitle = pageName;
        if (linkElement) { linkElement.classList.add('active'); const txt=(linkElement.textContent||'').trim().replace(/[\u{1F300}-\u{1F5FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,'').trim(); currentTitle=txt||pageName; }
        else { const curr=document.querySelector(`.sidebar-nav .nav-item[data-page="${pageName}"]`); if(curr){ curr.classList.add('active'); const txt=(curr.textContent||'').trim().replace(/[\u{1F300}-\u{1F5FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,'').trim(); currentTitle=txt||pageName; }}
        if (pageTitleElement) pageTitleElement.textContent = currentTitle;
        try {
            console.log(`Fetch (V14.4): pages/${pageName}.html`); const response = await fetch(`pages/${pageName}.html?_=${Date.now()}`); /* Cache Bust */ console.log(`Fetch status (V14.4) ${pageName}: ${response.status}`);
            if (!response.ok) throw new Error(`Página ${pageName}.html não encontrada (${response.status})`);
            
            if (mainContentArea) { mainContentArea.innerHTML = await response.text(); console.log(`HTML (V14.4) ${pageName} injetado.`); }
            else { console.error("'.content-area' (V14.4) não encontrado."); return; }
            
            const initFunction = pageInitializers[pageName];
            
            if (typeof initFunction === 'function') {
                console.log(`Exec init (V14.4) ${pageName}...`);
                
                // --- [CORREÇÃO V14.4] ---
                // Lógica robusta de espera. Em vez de um timeout fixo, espera que
                // um elemento principal da página exista antes de executar o init.
                // Isto corrige os erros "Form ... não encontrado" nos logs.
                
                // Mapeia o nome da página a um ID de elemento principal esperado nessa página.
                const pageElementIds = {
                    'admin_settings': 'tab-perfil', // ID principal da página de settings
                    'admin_users': 'usersTable',     // ID principal da página de users
                    // IDs 'supostos' para outras páginas (podem precisar de ajuste)
                    'admin_routers': 'routersTable', 
                    'admin_home': 'dashboardCardsContainer', // Supondo um ID para os cards
                    'admin_hotspot': 'hotspotReportsContainer', // Supondo um ID
                    'admin_templates': 'templatesGrid', // Supondo um ID
                    'admin_banners': 'bannersGrid', // Supondo um ID
                    'admin_campaigns': 'campaignsTable' // Supondo um ID
                };
                
                const elementIdToWaitFor = pageElementIds[pageName];

                if (elementIdToWaitFor) {
                    // Espera pelo elemento antes de chamar o init
                    await waitForElement(elementIdToWaitFor, initFunction);
                } else {
                     // Fallback para páginas sem ID mapeado
                    console.warn(`Init (V14.4): Sem ID de espera mapeado para ${pageName}. Usando timeout de 100ms.`);
                    setTimeout(initFunction, 100); 
                }

            } else {
                console.warn(`Init function (V14.4) ${pageName} não encontrada.`);
            }
        } catch (error) { console.error(`Erro loadPage ${pageName} (V14.4):`, error); if (mainContentArea) mainContentArea.innerHTML = `<h2>Erro ${pageName}.</h2><p>${error.message}.</p>`; }
    };
    loadPageExternal = loadPage;

    // --- USER PROFILE & AUTH (V14.3 inalterado) ---
    const fetchUserProfile = async () => {
         isProfileLoaded = false; window.currentUserProfile = null; // Reseta V14.4
        try {
            console.log("fetchUserProfile (V14.4): Buscando perfil...");
            const data = await apiRequest('/api/admin/profile');
            
            if (!data || !data.profile || !data.profile.role || !data.profile.permissions) {
                 throw new Error("Perfil inválido ou sem permissões (V14.4).");
            }
            
            console.log(`fetchUserProfile (V14.4): Perfil recebido (Role: ${data.profile.role}) com ${data.profile.permissions.length} permissões.`);
            window.currentUserProfile = data.profile; 
            isProfileLoaded = true; 
            
            if (userNameElement) userNameElement.textContent = data.profile.email;
            
            if (data.profile.must_change_password) { console.log("fetchUserProfile (V14.4): Senha obrigatória."); showForcePasswordChangeModal(); return false; } 
            
            console.log("fetchUserProfile (V14.4): Perfil OK."); return true;
        } catch (error) {
            console.error("Falha CRÍTICA perfil (V14.4):", error.message); isProfileLoaded = false; window.currentUserProfile = null; window.systemSettings = null;
            if(mainContentArea) mainContentArea.innerHTML = '<h2>Erro perfil. Recarregue.</h2>'; document.querySelector('.sidebar')?.classList.add('hidden'); document.querySelector('.main-content')?.classList.add('hidden');
            if (!error.message || (!error.message.includes('Não autorizado') && !error.message.includes('obrigatória'))) { setTimeout(() => { localStorage.removeItem('adminToken'); window.location.href = 'admin_login.html'; }, 4000); }
            return false;
        }
    };

    // --- [REESCRITO V14] applyMenuPermissions (Lógica V14.3 inalterada) ---
    const applyMenuPermissions = () => {
        console.log(`applyMenuPermissions (V14.4): Aplicando permissões dinâmicas...`);
        
        if (!window.currentUserProfile || !window.currentUserProfile.permissions) {
             console.error("applyMenuPermissions (V14.4): Perfil ou permissões não disponíveis!");
             return;
        }
        
        const userPermissions = new Set(window.currentUserProfile.permissions);
        console.log("applyMenuPermissions (V14.4): Permissões do utilizador:", userPermissions);

        // --- Passagem 1: Esconde/Mostra os links (nav-item) ---
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        
        navItems.forEach(item => {
            const requiredPermission = item.getAttribute('data-permission');
            
            if (requiredPermission) {
                if (userPermissions.has(requiredPermission)) {
                    item.style.removeProperty('display'); 
                } else {
                    item.style.display = 'none'; 
                }
            } else {
                item.style.removeProperty('display');
            }
        });
        
        // [ATUALIZADO V14] Lógica especial para 'Configurações' (admin-only)
        const settingsLink = document.querySelector('.nav-item[data-page="admin_settings"]');
        if (settingsLink) {
             const isAdmin = ['master', 'gestao', 'DPO'].includes(window.currentUserProfile.role);
             if (!isAdmin) {
                 settingsLink.style.display = 'none';
             }
        }

        // --- Passagem 2: Esconde títulos (nav-title) se todos os seus filhos estiverem escondidos ---
        const navTitles = document.querySelectorAll('.sidebar-nav .nav-title');
        
        navTitles.forEach(titleEl => {
            let nextEl = titleEl.nextElementSibling;
            let hasVisibleChild = false;
            
            while (nextEl && !nextEl.classList.contains('nav-title')) {
                if (nextEl.classList.contains('nav-item') && nextEl.style.display !== 'none') {
                    hasVisibleChild = true;
                    break; 
                }
                nextEl = nextEl.nextElementSibling;
            }
            
            if (!hasVisibleChild) {
                titleEl.style.display = 'none';
                 console.log(`applyMenuPermissions (V14.4): Escondendo título "${titleEl.textContent}" (sem filhos visíveis).`);
            } else {
                titleEl.style.removeProperty('display');
            }
        });
        
        console.log("applyMenuPermissions (V14.4): Permissões do menu aplicadas.");
    };


    // --- Logout (V14.3 inalterado) ---
    if (logoutButton) logoutButton.addEventListener('click', () => { console.log("Logout (V14.4)."); localStorage.removeItem('adminToken'); window.currentUserProfile = null; isProfileLoaded = false; window.systemSettings = null; window.location.href = 'admin_login.html'; });
    else console.warn("Botão logout (V14.4) não encontrado.");

    // --- Navegação (V14.3 inalterado) ---
    navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); const page = link.getAttribute('data-page'); if(page) loadPage(page, link); else console.warn("Click item sem 'data-page' (V14.4)."); }));

    // --- Modal Troca Senha (Lógica V14.3 inalterada) ---
    if (changePasswordForm) { changePasswordForm.addEventListener('submit', async (e) => { /* ... Lógica V14.3 ... */ e.preventDefault(); console.log("Form troca senha submetido (V14.4)."); if(changePasswordError)changePasswordError.textContent=''; if(changePasswordSuccess)changePasswordSuccess.textContent=''; const btn = changePasswordForm.querySelector('button[type="submit"]'); if(btn){ btn.disabled = true; btn.textContent = 'A processar...'; } const currIn=document.getElementById('currentTemporaryPassword'); const newIn=document.getElementById('newPassword'); if(!currIn||!newIn){ if(changePasswordError)changePasswordError.textContent="Erro interno."; if(btn){ btn.disabled = false; btn.textContent = 'Alterar'; } return; } const curr=currIn.value; const nv=newIn.value; if(nv.length<6){ if(changePasswordError)changePasswordError.textContent='Senha < 6 chars.'; if(btn){ btn.disabled = false; btn.textContent = 'Alterar'; } return; } try { const result = await apiRequest('/api/admin/profile/change-own-password','POST',{currentPassword: curr,newPassword: nv}); if(changePasswordSuccess)changePasswordSuccess.textContent=(result.message||"Senha alterada!")+" Deslogando..."; setTimeout(()=>{ localStorage.removeItem('adminToken'); window.currentUserProfile=null; isProfileLoaded=false; window.systemSettings=null; window.location.href='admin_login.html'; },4000); } catch(error){ if(changePasswordError)changePasswordError.textContent=`Erro: ${error.message||'Falha.'}`; if(btn){ btn.disabled = false; btn.textContent = 'Alterar'; } } }); }
    else console.warn("Form 'forceChangePasswordForm' (V14.4) não encontrado.");

    // --- [REESTRUTURADO V14] INICIALIZAÇÃO (Lógica V14.3 inalterada) ---
    console.log("Dashboard (V14.4): Iniciando sequência...");
    // 1. Busca o perfil E ESPERA (agora inclui permissões)
    const profileOK = await fetchUserProfile();
    console.log(`Dashboard (V14.4): Perfil carregado? ${profileOK}`);

    if (!profileOK) {
        console.log("Dashboard (V14.4): Inicialização INTERROMPIDA (fetchUserProfile falhou ou bloqueou).");
        return;
    }

    // 2. Busca as configurações gerais (Lógica V14.3 inalterada)
    if (window.currentUserProfile.role === 'master') {
        try {
            console.log("Dashboard (V14.4): Buscando configurações gerais...");
            const settings = await apiRequest('/api/settings/general');
            if (settings) {
                 window.systemSettings = settings; 
                 applyVisualSettings(settings); 
                 console.log("Dashboard (V14.4): Configurações visuais aplicadas.");
            } else {
                 console.warn("Dashboard (V14.4): Configurações gerais não retornadas pela API.");
                 window.systemSettings = {}; 
            }
        } catch (settingsError) {
            console.error("Dashboard (V14.4): Erro ao buscar/aplicar configurações gerais:", settingsError);
            window.systemSettings = {}; 
        }
    } else {
         console.log("Dashboard (V14.4): Utilizador não é master, pulando busca de settings gerais.");
         window.systemSettings = {}; 
    }

    // 3. [ATUALIZADO V14] Aplica permissões ao menu
    applyMenuPermissions();


    // 4. Carrega a página inicial (Lógica V14.3 inalterada)
    console.log("Dashboard (V14.4): Carregando página inicial 'admin_home'...");
    const homeLink = document.querySelector('.sidebar-nav .nav-item[data-page="admin_home"]');
    if (homeLink) {
        loadPage('admin_home', homeLink);
    } else {
        console.error("Link 'admin_home' (V14.4) não encontrado!");
        loadPage('admin_home', null); // Tenta carregar mesmo assim
    }

    console.log("Dashboard (V14.4): Inicialização concluída com sucesso.");
}); // Fim do DOMContentLoaded

