// Ficheiro: frontend/js/admin_dashboard.js
// [VERSÃO 13 - Base V5 Estável + applyMenuPermissions com removeProperty + CSS Limpo + Load Settings]

// --- Variáveis Globais ---
let isProfileLoaded = false;
window.currentUserProfile = null;
let loadPageExternal;
window.systemSettings = null; // [NOVO V13] Para guardar configs gerais (nome, logo, cor)

// --- Funções Globais ---
const showForcePasswordChangeModal = () => {
    const changePasswordModal = document.getElementById('forceChangePasswordModal');
    if (changePasswordModal) {
        changePasswordModal.classList.remove('hidden');
        document.querySelector('.sidebar')?.classList.add('hidden');
        document.querySelector('.main-content')?.classList.add('hidden');
    } else {
        console.error("FATAL: Modal 'forceChangePasswordModal' não encontrado (V13)!");
    }
};

// [ATUALIZADO V13] Adiciona cache busting simples para GET
const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const API_ADMIN_URL = `http://${window.location.hostname}:3000`;
    const token = localStorage.getItem('adminToken');
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache' // [NOVO V13] Tenta evitar cache da API
        }
    };

    let url = `${API_ADMIN_URL}${endpoint}`;

    // Adiciona timestamp para GET para evitar cache do browser (cache busting)
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
        const response = await fetch(url, options); // Usa url com timestamp
        if (!response.ok) {
            let errorData = {};
            try { errorData = await response.json(); }
            catch (e) { errorData.message = response.statusText || `Erro HTTP ${response.status}`; }

            if (response.status === 401) {
                console.warn("Token inválido/expirado (V13). Deslogando...");
                localStorage.removeItem('adminToken'); window.currentUserProfile = null; isProfileLoaded = false; window.systemSettings = null;
                window.location.href = 'admin_login.html'; throw new Error('Não autorizado.');
            } else if (errorData.code === 'PASSWORD_CHANGE_REQUIRED') {
                console.warn("API bloqueada (V13). Troca de senha obrigatória.");
                showForcePasswordChangeModal(); throw new Error(errorData.message || "Troca de senha obrigatória.");
            } else { throw new Error(errorData.message || `Erro ${response.status}`); }
        }
        if (response.status === 204) return null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) return await response.json();
        else return await response.text() || null;
    } catch (error) { console.error(`Erro em apiRequest (V13) ${method} ${endpoint}:`, error); throw error; }
};

// [NOVO V13] Função para aplicar as configurações visuais (Nome, Logo, Cor)
const applyVisualSettings = (settings) => {
    if (!settings) {
        console.warn("applyVisualSettings (V13): Configurações não fornecidas.");
        return;
    }
    console.log("applyVisualSettings (V13): Aplicando configurações...", settings);

    // 1. Nome da Empresa (Sidebar Header)
    const sidebarTitle = document.querySelector('.sidebar-header h2');
    if (sidebarTitle && settings.company_name) {
        sidebarTitle.textContent = settings.company_name;
        console.log(` - Nome aplicado: ${settings.company_name}`);
    } else if (!sidebarTitle) {
         console.warn("Elemento .sidebar-header h2 não encontrado para aplicar nome.");
    }

    // 2. Logótipo (Sidebar Header) - Assume que existe um <img> com id="sidebarLogo"
    const sidebarLogo = document.getElementById('sidebarLogo'); // PRECISA ADICIONAR ESTE ID NO HTML (<img id="sidebarLogo" src="#" alt="Logótipo" style="display: none;">)
    if (sidebarLogo) {
        if (settings.logo_url) {
            const API_ADMIN_URL = `http://${window.location.hostname}:3000`;
            const logoPath = settings.logo_url.startsWith('/') ? settings.logo_url : '/' + settings.logo_url;
            sidebarLogo.src = `${API_ADMIN_URL}${logoPath}?t=${Date.now()}`; // Cache busting
            sidebarLogo.style.display = 'block'; // Mostra a imagem
            sidebarLogo.alt = settings.company_name || "Logótipo"; // Alt text
            console.log(` - Logo aplicado: ${sidebarLogo.src}`);
             // Opcional: Esconder o H2 se o logo for mostrado
             if(sidebarTitle) sidebarTitle.style.display = 'none';
        } else {
            sidebarLogo.style.display = 'none'; // Esconde se não houver logo
            sidebarLogo.src = '#';
            console.log(" - Nenhum logo URL, logo escondido.");
             // Opcional: Mostrar o H2 se o logo for escondido
             if(sidebarTitle) sidebarTitle.style.removeProperty('display');
        }
    } else {
        console.warn("Elemento #sidebarLogo não encontrado para aplicar logótipo.");
        // Se não encontrar o logo, garante que o H2 esteja visível
         if(sidebarTitle) sidebarTitle.style.removeProperty('display');
    }

    // 3. Cor Primária (Variável CSS)
    if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
        // Calcula uma cor mais escura para hover/gradiente (exemplo simples)
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
         // Remove/reseta as variáveis se não houver cor definida
         document.documentElement.style.removeProperty('--primary-color');
         document.documentElement.style.removeProperty('--primary-color-dark');
    }
};


// --- INICIALIZAÇÃO PRINCIPAL (DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Carregado (V13). Iniciando Dashboard...");
    const token = localStorage.getItem('adminToken');
    if (!token) { console.log("Nenhum token (V13). Redirecionando."); window.location.href = 'admin_login.html'; return; }

    // --- DOM Elements ---
    const userNameElement = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');
    const mainContentArea = document.querySelector('.content-area');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    const allNavItems = document.querySelectorAll('.sidebar-nav .nav-item, .sidebar-nav .nav-title'); // Para permissões
    const pageTitleElement = document.getElementById('pageTitle');
    const changePasswordModal = document.getElementById('forceChangePasswordModal');
    const changePasswordForm = document.getElementById('forceChangePasswordForm');
    const changePasswordError = document.getElementById('forceChangePasswordError');
    const changePasswordSuccess = document.getElementById('forceChangePasswordSuccess');

    // Mapeamento de inicializadores
    const pageInitializers = { 'admin_home': window.initHomePage, 'admin_hotspot': window.initHotspotPage, 'admin_users': window.initUsersPage, 'admin_templates': window.initTemplatesPage, 'admin_banners': window.initBannersPage, 'admin_campaigns': window.initCampaignsPage, 'admin_routers': window.initRoutersPage, 'admin_settings': window.initSettingsPage };

    // --- PAGE NAVIGATION ---
    const loadPage = async (pageName, linkElement) => {
        if (!isProfileLoaded) { console.warn(`loadPage (${pageName}) chamado antes do perfil (V13).`); }
        if (isProfileLoaded && window.currentUserProfile?.must_change_password) { console.warn(`Navegação ${pageName} bloqueada (V13): Senha.`); showForcePasswordChangeModal(); return; }
        console.log(`loadPage (V13): Carregando ${pageName}...`);
        navLinks.forEach(link => link.classList.remove('active'));
        let currentTitle = pageName;
        // Lógica título V11 (mantida)
        if (linkElement) { linkElement.classList.add('active'); const txt=(linkElement.textContent||'').trim().replace(/[\u{1F300}-\u{1F5FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,'').trim(); currentTitle=txt||pageName; }
        else { const curr=document.querySelector(`.sidebar-nav .nav-item[data-page="${pageName}"]`); if(curr){ curr.classList.add('active'); const txt=(curr.textContent||'').trim().replace(/[\u{1F300}-\u{1F5FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,'').trim(); currentTitle=txt||pageName; }}
        if (pageTitleElement) pageTitleElement.textContent = currentTitle;
        try {
            console.log(`Fetch (V13): pages/${pageName}.html`); const response = await fetch(`pages/${pageName}.html?_=${Date.now()}`); /* Cache Bust */ console.log(`Fetch status (V13) ${pageName}: ${response.status}`);
            if (!response.ok) throw new Error(`Página ${pageName}.html não encontrada (${response.status})`);
            if (mainContentArea) { mainContentArea.innerHTML = await response.text(); console.log(`HTML (V13) ${pageName} injetado.`); }
            else { console.error("'.content-area' (V13) não encontrado."); return; }
            const initFunction = pageInitializers[pageName];
            if (typeof initFunction === 'function') { console.log(`Exec init (V13) ${pageName}...`); setTimeout(initFunction, 0); }
            else { console.warn(`Init function (V13) ${pageName} não encontrada.`); }
        } catch (error) { console.error(`Erro loadPage ${pageName} (V13):`, error); if (mainContentArea) mainContentArea.innerHTML = `<h2>Erro ${pageName}.</h2><p>${error.message}.</p>`; }
    };
    loadPageExternal = loadPage;

    // --- USER PROFILE & AUTH ---
    const fetchUserProfile = async () => {
         isProfileLoaded = false; window.currentUserProfile = null; // Reseta V13
        try {
            console.log("fetchUserProfile (V13): Buscando perfil...");
            const data = await apiRequest('/api/admin/profile');
            if (!data || !data.profile || !data.profile.role) throw new Error("Perfil inválido (V13).");
            console.log("fetchUserProfile (V13): Perfil recebido:", data.profile);
            window.currentUserProfile = data.profile; // Define global ANTES da flag
            isProfileLoaded = true; // SUCESSO
            if (userNameElement) userNameElement.textContent = data.profile.email;
            // [MODIFICADO V13] applyMenuPermissions é chamado DEPOIS de carregar as settings
            // applyMenuPermissions(data.profile.role); // NÃO MAIS AQUI
            if (data.profile.must_change_password) { console.log("fetchUserProfile (V13): Senha obrigatória."); showForcePasswordChangeModal(); return false; } // Continua bloqueando aqui
            console.log("fetchUserProfile (V13): Perfil OK."); return true;
        } catch (error) {
            console.error("Falha CRÍTICA perfil (V13):", error.message); isProfileLoaded = false; window.currentUserProfile = null; window.systemSettings = null;
            if(mainContentArea) mainContentArea.innerHTML = '<h2>Erro perfil. Recarregue.</h2>'; document.querySelector('.sidebar')?.classList.add('hidden'); document.querySelector('.main-content')?.classList.add('hidden');
            if (!error.message || (!error.message.includes('Não autorizado') && !error.message.includes('obrigatória'))) { setTimeout(() => { localStorage.removeItem('adminToken'); window.location.href = 'admin_login.html'; }, 4000); }
            return false;
        }
    };

    // [CORRIGIDO V13] Usa removeProperty ou style.display = 'none'
    const applyMenuPermissions = (role) => {
        console.log(`applyMenuPermissions (V13): Aplicando para role: ${role}`);
        if (!role) { console.error("applyMenuPermissions (V13): Role inválida!"); return; } // Segurança extra
        const isAdmin = ['master', 'gestao', 'DPO'].includes(role); const isMaster = (role === 'master');
        console.log(`applyMenuPermissions (V13): isAdmin=${isAdmin}, isMaster=${isMaster}`);

        allNavItems.forEach(el => {
            let shouldBeVisible = true; let reason = "Padrão"; const pageName = el.getAttribute('data-page') || el.textContent.trim();

            if (el.classList.contains('admin-only')) { if (!isAdmin) { shouldBeVisible = false; reason = "admin-only/!admin"; } else { reason = "admin-only/admin"; } }
            else if (el.classList.contains('master-only')) { if (!isMaster) { shouldBeVisible = false; reason = "master-only/!master"; } else { reason = "master-only/master"; } }

            // Usa removeProperty para mostrar, 'none' para esconder
            if (shouldBeVisible) {
                el.style.removeProperty('display');
            } else {
                el.style.display = 'none';
            }
            // Log para verificar o resultado real após aplicar
            // console.log(`[V13 Perms] Item "${pageName}": Visível? ${shouldBeVisible} (${reason}) -> Estilo aplicado: display=${getComputedStyle(el).display}`);
        });
        console.log("applyMenuPermissions (V13): Permissões do menu aplicadas.");
    };


    // --- Logout ---
    if (logoutButton) logoutButton.addEventListener('click', () => { console.log("Logout (V13)."); localStorage.removeItem('adminToken'); window.currentUserProfile = null; isProfileLoaded = false; window.systemSettings = null; window.location.href = 'admin_login.html'; });
    else console.warn("Botão logout (V13) não encontrado.");

    // --- Navegação ---
    navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); const page = link.getAttribute('data-page'); if(page) loadPage(page, link); else console.warn("Click item sem 'data-page' (V13)."); }));

    // --- Modal Troca Senha (Lógica Mantida V11) ---
    if (changePasswordForm) { changePasswordForm.addEventListener('submit', async (e) => { /* ... Lógica V11 ... */ e.preventDefault(); console.log("Form troca senha submetido (V13)."); if(changePasswordError)changePasswordError.textContent=''; if(changePasswordSuccess)changePasswordSuccess.textContent=''; const btn = changePasswordForm.querySelector('button[type="submit"]'); if(btn){ btn.disabled = true; btn.textContent = 'A processar...'; } const currIn=document.getElementById('currentTemporaryPassword'); const newIn=document.getElementById('newPassword'); if(!currIn||!newIn){ if(changePasswordError)changePasswordError.textContent="Erro interno."; if(btn){ btn.disabled = false; btn.textContent = 'Alterar'; } return; } const curr=currIn.value; const nv=newIn.value; if(nv.length<6){ if(changePasswordError)changePasswordError.textContent='Senha < 6 chars.'; if(btn){ btn.disabled = false; btn.textContent = 'Alterar'; } return; } try { const result = await apiRequest('/api/admin/profile/change-own-password','POST',{currentPassword: curr,newPassword: nv}); if(changePasswordSuccess)changePasswordSuccess.textContent=(result.message||"Senha alterada!")+" Deslogando..."; setTimeout(()=>{ localStorage.removeItem('adminToken'); window.currentUserProfile=null; isProfileLoaded=false; window.systemSettings=null; window.location.href='admin_login.html'; },4000); } catch(error){ if(changePasswordError)changePasswordError.textContent=`Erro: ${error.message||'Falha.'}`; if(btn){ btn.disabled = false; btn.textContent = 'Alterar'; } } }); }
    else console.warn("Form 'forceChangePasswordForm' (V13) não encontrado.");

    // --- [REESTRUTURADO V13] INICIALIZAÇÃO ---
    console.log("Dashboard (V13): Iniciando sequência...");
    // 1. Busca o perfil E ESPERA
    const profileOK = await fetchUserProfile();
    console.log(`Dashboard (V13): Perfil carregado? ${profileOK}`);

    // Se perfil falhou ou senha obrigatória, para aqui.
    if (!profileOK) {
        console.log("Dashboard (V13): Inicialização INTERROMPIDA (fetchUserProfile falhou ou bloqueou).");
        return;
    }

    // 2. [NOVO V13] Busca as configurações gerais (APENAS se for master) e aplica-as
    if (window.currentUserProfile.role === 'master') {
        try {
            console.log("Dashboard (V13): Buscando configurações gerais...");
            // Usa apiRequest para buscar settings (já tem cache busting)
            const settings = await apiRequest('/api/settings/general');
            if (settings) {
                 window.systemSettings = settings; // Guarda globalmente
                 applyVisualSettings(settings); // Aplica nome, logo, cor
                 console.log("Dashboard (V13): Configurações visuais aplicadas.");
            } else {
                 console.warn("Dashboard (V13): Configurações gerais não retornadas pela API.");
                 window.systemSettings = {}; // Define como vazio para evitar erros
                  // Aplica visuais padrão se settings falharem (opcional)
                 // applyVisualSettings({ company_name: 'Painel Admin', primary_color: '#4299e1' });
            }
        } catch (settingsError) {
            console.error("Dashboard (V13): Erro ao buscar/aplicar configurações gerais:", settingsError);
            window.systemSettings = {}; // Define como vazio em caso de erro
             // Mostra um erro não bloqueante na consola ou UI se necessário
            // Aplica visuais padrão se settings falharem (opcional)
            // applyVisualSettings({ company_name: 'Painel Admin', primary_color: '#4299e1' });
        }
    } else {
         console.log("Dashboard (V13): Utilizador não é master, pulando busca de settings gerais.");
         window.systemSettings = {}; // Define como vazio para não masters
         // Aplica visuais padrão para não master (opcional)
         // applyVisualSettings({ company_name: 'Painel Admin', primary_color: '#4299e1' });
    }

    // 3. [MOVIDO V13] Aplica permissões ao menu DEPOIS de carregar perfil e settings
    //    Garante que currentUserProfile existe porque profileOK é true
    applyMenuPermissions(window.currentUserProfile.role);


    // 4. Carrega a página inicial
    console.log("Dashboard (V13): Carregando página inicial 'admin_home'...");
    const homeLink = document.querySelector('.sidebar-nav .nav-item[data-page="admin_home"]');
    if (homeLink) {
        loadPage('admin_home', homeLink);
    } else {
        console.error("Link 'admin_home' (V13) não encontrado!");
        loadPage('admin_home', null); // Tenta carregar mesmo assim
    }

    console.log("Dashboard (V13): Inicialização concluída com sucesso.");
}); // Fim do DOMContentLoaded

