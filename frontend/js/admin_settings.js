// Ficheiro: frontend/js/admin_settings.js
// [VERSÃO 13.2 - Corrigido SyntaxError em loadPermissionsMatrix]

if (window.initSettingsPage) {
    console.warn("Tentativa de carregar admin_settings.js múltiplas vezes (V13.2).");
} else {
    // Flag para evitar múltiplas inicializações
    let isInitializingSettings = false;

    window.initSettingsPage = () => {
        if (isInitializingSettings) { console.warn("initSettingsPage (V13.2) chamado novamente. Ignorando."); return; }
        isInitializingSettings = true;
        console.log("A inicializar a página de Configurações (V13.2)...");

        // --- Elementos Comuns ---
        const tabNav = document.querySelector('.tab-nav');
        const tabLinks = document.querySelectorAll('.tab-nav .tab-link');
        const tabContentContainer = document.querySelector('.tab-content-container');
        const tabContents = document.querySelectorAll('.tab-content-container .tab-content');

        // --- Elementos das Abas ---
        const changeOwnPasswordForm = document.getElementById('changeOwnPasswordForm');
        const changeOwnPasswordError = document.getElementById('changeOwnPasswordError');
        const changeOwnPasswordSuccess = document.getElementById('changeOwnPasswordSuccess');
        const generalSettingsForm = document.getElementById('generalSettingsForm');
        const companyNameInput = document.getElementById('companyName');
        const logoUploadInput = document.getElementById('logoUpload');
        const currentLogoPreview = document.getElementById('currentLogoPreview');
        const primaryColorInput = document.getElementById('primaryColor');
        const generalSettingsError = document.getElementById('generalSettingsError');
        const generalSettingsSuccess = document.getElementById('generalSettingsSuccess');
        const hotspotSettingsForm = document.getElementById('hotspotSettingsForm');
        const sessionTimeoutInput = document.getElementById('sessionTimeoutMinutes');
        const domainWhitelistTextarea = document.getElementById('domainWhitelist');
        const hotspotSettingsError = document.getElementById('hotspotSettingsError');
        const hotspotSettingsSuccess = document.getElementById('hotspotSettingsSuccess');
        // V14 -> V13.1 Elements Fase 3.1
        const permissionsTableBody = document.getElementById('permissionsTableBody');
        const permissionsError = document.getElementById('permissionsError');

        // --- Função de Troca de Abas ---
        const switchTab = (targetTabId) => {
             console.log(`switchTab (V13.2): Ativando aba ${targetTabId}`);
             if (!targetTabId) { console.error("switchTab (V13.2): ID inválido."); return; }
             if (tabContents) tabContents.forEach(content => content.classList.remove('active'));
             if (tabLinks) tabLinks.forEach(link => link.classList.remove('active'));
             const targetContent = document.getElementById(targetTabId);
             const targetLink = tabNav ? tabNav.querySelector(`.tab-link[data-tab="${targetTabId}"]`) : null;
             if (targetContent && targetContent.style.display !== 'none') { targetContent.classList.add('active'); }
             else if (!targetContent) { console.error(`switchTab (V13.2): Conteúdo ${targetTabId} não encontrado.`); }
             else { console.warn(`switchTab (V13.2): Conteúdo ${targetTabId} está escondido.`);}
             if (targetLink && targetLink.style.display !== 'none') { targetLink.classList.add('active'); }
             else if (!targetLink) { console.error(`switchTab (V13.2): Link ${targetTabId} não encontrado.`); }
              else { console.warn(`switchTab (V13.2): Link ${targetTabId} está escondido.`);}
        };

        // --- Lógicas das Abas ---

        // Aba Meu Perfil
        if (changeOwnPasswordForm) {
            changeOwnPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log("Form 'Perfil' submit (V13.2).");
                if(changeOwnPasswordError) changeOwnPasswordError.textContent = '';
                if(changeOwnPasswordSuccess) changeOwnPasswordSuccess.textContent = '';
                const currentPasswordInput = document.getElementById('currentPassword');
                const newPasswordInput = document.getElementById('newVoluntaryPassword');
                const confirmPasswordInput = document.getElementById('confirmNewVoluntaryPassword');
                const submitButton = changeOwnPasswordForm.querySelector('button[type="submit"]');

                if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
                    if(changeOwnPasswordError) changeOwnPasswordError.textContent = 'Erro interno no formulário.';
                    return;
                }
                const currentPassword = currentPasswordInput.value;
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                if (newPassword !== confirmPassword) {
                    if(changeOwnPasswordError) changeOwnPasswordError.textContent = 'As novas senhas não coincidem.';
                    return;
                }
                if (newPassword.length < 6) {
                    if(changeOwnPasswordError) changeOwnPasswordError.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
                    return;
                }
                if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'A alterar...'; }

                try {
                    const result = await apiRequest('/api/admin/profile/change-own-password', 'POST', { currentPassword, newPassword });
                    if(changeOwnPasswordSuccess) changeOwnPasswordSuccess.textContent = result.message || 'Senha alterada com sucesso!';
                    changeOwnPasswordForm.reset();
                } catch (error) {
                    if(changeOwnPasswordError) changeOwnPasswordError.textContent = `Erro: ${error.message || 'Falha ao alterar senha.'}`;
                } finally {
                    if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'Alterar Senha'; }
                }
            });
        } else { console.warn("Form 'changeOwnPasswordForm' (V13.2) não encontrado."); }

        // Carrega Config Geral
        const loadGeneralSettings = async () => {
            console.log("loadGeneralSettings (V13.2)...");
            if (!window.currentUserProfile || window.currentUserProfile.role !== 'master') {
                if (generalSettingsForm) generalSettingsForm.style.display = 'none';
                return false;
            }
            if (generalSettingsForm) generalSettingsForm.style.removeProperty('display');

            try {
                const settings = await apiRequest('/api/settings/general');
                console.log("loadGeneralSettings (V13.2) OK:", settings);
                if (companyNameInput) companyNameInput.value = settings?.company_name || '';
                if (primaryColorInput) primaryColorInput.value = settings?.primary_color || '#3182CE';
                if (currentLogoPreview) {
                    if (settings?.logo_url) {
                        const API_ADMIN_URL = `http://${window.location.hostname}:3000`;
                        const logoPath = settings.logo_url.startsWith('/') ? settings.logo_url : '/' + settings.logo_url;
                        currentLogoPreview.src = `${API_ADMIN_URL}${logoPath}?t=${Date.now()}`;
                        currentLogoPreview.style.display = 'block';
                    } else {
                        currentLogoPreview.style.display = 'none';
                        currentLogoPreview.src = '#';
                    }
                }
                return true;
            } catch (error) {
                console.error("Erro loadGeneralSettings (V13.2):", error);
                if (generalSettingsError) generalSettingsError.textContent = `Erro ao carregar: ${error.message}`;
                return false;
            }
        };
        // Listener Geral
        if (generalSettingsForm) {
            generalSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log("Form 'Geral' submit (V13.2).");
                if (generalSettingsError) generalSettingsError.textContent = '';
                if (generalSettingsSuccess) generalSettingsSuccess.textContent = '';
                const formData = new FormData();
                if (companyNameInput) formData.append('companyName', companyNameInput.value);
                if (primaryColorInput) formData.append('primaryColor', primaryColorInput.value);
                if (logoUploadInput && logoUploadInput.files[0]) {
                    formData.append('companyLogo', logoUploadInput.files[0]);
                    console.log("Logo file added:", logoUploadInput.files[0].name);
                } else {
                    console.log("No logo file selected.");
                }
                const submitButton = generalSettingsForm.querySelector('button[type="submit"]');
                if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'A guardar...'; }

                try {
                    const result = await apiRequest('/api/settings/general', 'POST', formData);
                    console.log("Save General Response:", result);
                    if (generalSettingsSuccess) generalSettingsSuccess.textContent = result.message || "Salvo com sucesso!";
                    await loadGeneralSettings(); // Recarrega form
                    if (window.systemSettings && result.settings) {
                        Object.assign(window.systemSettings, result.settings);
                        if (typeof applyVisualSettings === 'function') {
                            applyVisualSettings(window.systemSettings);
                            console.log("Visual settings reapplied (V13.2).");
                        } else {
                            console.warn("applyVisualSettings not found.");
                        }
                    }
                } catch (error) {
                    console.error("Error saving general settings:", error);
                    if (generalSettingsError) generalSettingsError.textContent = `Erro: ${error.message || 'Falha.'}`;
                } finally {
                    if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Guardar Configurações Gerais'; }
                    if (logoUploadInput) logoUploadInput.value = '';
                }
            });
        } else { console.warn("Form 'generalSettingsForm' (V13.2) não encontrado."); }

        // Carrega Config Hotspot
        const loadHotspotSettings = async () => {
            console.log("loadHotspotSettings (V13.2)...");
            if (!window.currentUserProfile || window.currentUserProfile.role !== 'master') {
                if (hotspotSettingsForm) hotspotSettingsForm.style.display = 'none';
                return false;
            }
             if (hotspotSettingsForm) hotspotSettingsForm.style.removeProperty('display');

            try {
                const settings = await apiRequest('/api/settings/hotspot');
                console.log("loadHotspotSettings (V13.2) OK:", settings);
                if (sessionTimeoutInput) sessionTimeoutInput.value = settings?.session_timeout_minutes || '';
                if (domainWhitelistTextarea) { domainWhitelistTextarea.value = (settings?.domain_whitelist || []).join('\n'); }
                return true;
            } catch (error) {
                console.error("Erro loadHotspotSettings (V13.2):", error);
                if (hotspotSettingsError) hotspotSettingsError.textContent = `Erro ao carregar: ${error.message}`;
                return false;
            }
        };
        // Listener Hotspot
        if (hotspotSettingsForm) {
            hotspotSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log("Form 'Hotspot' submit (V13.2).");
                if(hotspotSettingsError) hotspotSettingsError.textContent = '';
                if(hotspotSettingsSuccess) hotspotSettingsSuccess.textContent = '';
                const domainWhitelistArray = domainWhitelistTextarea ? domainWhitelistTextarea.value.split('\n').map(d => d.trim()).filter(d => d && d.length > 0) : [];
                let timeoutValue = sessionTimeoutInput ? parseInt(sessionTimeoutInput.value, 10) : null;
                if (timeoutValue !== null && (isNaN(timeoutValue) || timeoutValue <= 0)) {
                    if(hotspotSettingsError) hotspotSettingsError.textContent = 'Tempo de sessão inválido.';
                    return;
                }
                const settingsData = { sessionTimeoutMinutes: timeoutValue, domainWhitelist: domainWhitelistArray };
                const submitButton = hotspotSettingsForm.querySelector('button[type="submit"]');
                if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'A guardar...'; }

                try {
                    const result = await apiRequest('/api/settings/hotspot', 'POST', settingsData);
                    if(hotspotSettingsSuccess) hotspotSettingsSuccess.textContent = result.message || "Salvo com sucesso!";
                    await loadHotspotSettings(); // Recarrega
                } catch (error) {
                    if (hotspotSettingsError) hotspotSettingsError.textContent = `Erro: ${error.message || 'Falha.'}`;
                } finally {
                    if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'Guardar Configurações do Hotspot'; }
                }
            });
        } else { console.warn("Form 'hotspotSettingsForm' (V13.2) não encontrado."); }

         // Fase 3.1: Lógica da Aba "Funções e Permissões"
         const loadPermissionsMatrix = async () => {
            console.log("loadPermissionsMatrix (V13.2)...");
            if (!permissionsTableBody) { console.error("permissionsTableBody (V13.2) not found!"); return false; }
            if (permissionsError) permissionsError.textContent = '';
            permissionsTableBody.innerHTML = '<tr><td colspan="5">A carregar...</td></tr>';
            const role = window.currentUserProfile?.role;
             if (role !== 'master' && role !== 'DPO') {
                 console.log("loadPermissionsMatrix (V13.2): Access denied.");
                 permissionsTableBody.innerHTML = '<tr><td colspan="5">Acesso negado.</td></tr>';
                 document.querySelector('.permissions-matrix')?.style.display = 'none';
                 return false;
             }
            try {
                // MOCK DATA (Mantido)
                const permissionsData = { roles: ['master', 'gestao', 'estetica', 'DPO'], permissions: [ { feature: 'Dashboard', actions: { master: 'Ver', gestao: 'Ver', estetica: 'Ver', DPO: 'Ver' } }, { feature: 'Hotspot (Relatórios)', actions: { master: 'Ver/Exportar', gestao: 'Ver/Exportar', estetica: 'Ver/Exportar', DPO: 'Nenhum' } }, { feature: 'Campanhas', actions: { master: 'CRUD', gestao: 'CRUD', estetica: 'CRU (sem Delete)', DPO: 'Nenhum' } }, { feature: 'Templates', actions: { master: 'CRUD', gestao: 'CRUD', estetica: 'CRU (sem Delete Padrão)', DPO: 'Nenhum' } }, { feature: 'Banners', actions: { master: 'CRUD', gestao: 'CRUD', estetica: 'CRU (sem Delete Padrão)', DPO: 'Nenhum' } }, { feature: 'Roteadores', actions: { master: 'CRUD', gestao: 'CRUD', estetica: 'Nenhum', DPO: 'Nenhum' } }, { feature: 'Utilizadores (Admin)', actions: { master: 'CRUD', gestao: 'R (limitado) + Reset Senha', estetica: 'Nenhum', DPO: 'R (completo)' } }, { feature: 'Configurações: Meu Perfil', actions: { master: 'Alterar Senha', gestao: 'Alterar Senha', estetica: 'Alterar Senha', DPO: 'Alterar Senha' } }, { feature: 'Configurações: Geral', actions: { master: 'R/W', gestao: 'Nenhum', estetica: 'Nenhum', DPO: 'R' } }, { feature: 'Configurações: Portal Hotspot', actions: { master: 'R/W', gestao: 'Nenhum', estetica: 'Nenhum', DPO: 'R' } }, { feature: 'Configurações: Permissões', actions: { master: 'R/W (Editar Futuro)', gestao: 'Nenhum', estetica: 'Nenhum', DPO: 'R' } }, { feature: 'Logs de Atividade', actions: { master: 'R', gestao: 'Nenhum', estetica: 'Nenhum', DPO: 'R/Exportar' } }, { feature: 'Gestão LGPD', actions: { master: 'R/W', gestao: 'Nenhum', estetica: 'Nenhum', DPO: 'R/W' } }, { feature: 'Suporte (Tickets)', actions: { master: 'CRUD', gestao: 'CRUD', estetica: 'Criar/Ver Próprios', DPO: 'Nenhum' } }, { feature: 'Sorteios (Execução)', actions: { master: 'Executar', gestao: 'Nenhum', estetica: 'Executar', DPO: 'Nenhum' } }, { feature: 'Sorteios (Auditoria)', actions: { master: 'Ver/Exportar', gestao: 'Nenhum', estetica: 'Nenhum', DPO: 'Ver/Exportar' } }, ] };

                permissionsTableBody.innerHTML = '';
                const theadRow = document.querySelector('#permissionsTable thead tr');
                if(theadRow) {
                     theadRow.innerHTML = '<th>Funcionalidade</th>';
                     permissionsData.roles.forEach(roleKey => theadRow.innerHTML += `<th>${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}</th>`);
                }

                permissionsData.permissions.forEach(perm => {
                    const row = document.createElement('tr');
                    row.innerHTML += `<td style="text-align: left; white-space: normal;"><strong>${perm.feature}</strong></td>`;
                    permissionsData.roles.forEach(roleKey => {
                        const pText = perm.actions[roleKey] || 'N/A';
                        let cls = 'perm-none';
                        // [CORRIGIDO V13.2] Adicionadas chaves {} aos if/else if
                        if (pText.includes('CRUD') || pText.includes('R/W') || pText.includes('Exportar') || pText.includes('Executar')) {
                             cls = 'perm-full';
                        } else if (pText.includes('R') || pText.includes('Ver') || pText.includes('Alterar')) {
                             cls = 'perm-read';
                        } else if (pText !== 'Nenhum' && pText !== 'N/A') {
                             cls = 'perm-partial';
                        }
                        const cell = document.createElement('td');
                        cell.className = cls;
                        let sText = pText;
                        if (sText.length > 20) sText = sText.substring(0, 18) + '...';
                        cell.textContent = sText;
                        cell.title = pText; // Tooltip com texto completo
                        row.appendChild(cell);
                    });
                    permissionsTableBody.appendChild(row);
                });
                return true;

            } catch (error) {
                console.error("Erro loadPermissionsMatrix (V13.2):", error);
                if (permissionsError) permissionsError.textContent = `Erro: ${error.message}`;
                const colspan = (document.querySelector('#permissionsTable thead th')?.length || 5);
                permissionsTableBody.innerHTML = `<tr><td colspan="${colspan}">Falha ao carregar.</td></tr>`;
                return false;
            }
        };

        // --- Função Central de Inicialização ---
        const initializeSettingsPage = async (retryCount = 0, maxRetries = 10, delay = 300) => {
             console.log(`initializeSettingsPage (V13.2 - Tentativa ${retryCount + 1}/${maxRetries}): Verificando perfil...`);

             if (window.currentUserProfile && window.currentUserProfile.role) {
                 const role = window.currentUserProfile.role;
                 console.log(`initializeSettingsPage (V13.2): Perfil OK! Role: ${role}`);
                 const isMaster = (role === 'master');

                 // Mostra/Esconde abas e conteúdos (removeProperty)
                 console.log("initializeSettingsPage (V13.2): Aplicando visibilidade...");
                 let firstVisibleTabId = null;
                 if (tabLinks && tabContents) {
                      tabLinks.forEach(link => { const tabId=link.getAttribute('data-tab'); const content=document.getElementById(tabId); let show=true; if(link.classList.contains('admin-only')&&!['master','gestao','DPO'].includes(role)){show=false;} if(link.classList.contains('master-only')&&!isMaster){show=false;} if(show){link.style.removeProperty('display'); if(content)content.style.removeProperty('display'); if(!firstVisibleTabId)firstVisibleTabId=tabId;} else {link.style.display='none'; if(content)content.style.display='none';} });
                 } else { console.error("Tabs não encontradas (V13.2)!"); isInitializingSettings = false; return; }
                 console.log(`initializeSettingsPage (V13.2): Visibilidade OK. Primeira visível: ${firstVisibleTabId}`);

                 // Carrega dados das configurações visíveis
                 console.log("initializeSettingsPage (V13.2): Carregando dados...");
                 let loadPromises = [];
                 if (isMaster && generalSettingsForm && document.querySelector('.tab-link[data-tab="tab-geral"]')?.style.display !== 'none') { loadPromises.push(loadGeneralSettings()); }
                 if (isMaster && hotspotSettingsForm && document.querySelector('.tab-link[data-tab="tab-hotspot"]')?.style.display !== 'none') { loadPromises.push(loadHotspotSettings()); }
                 const permTabVisible = document.querySelector('.tab-link[data-tab="tab-permissoes"]')?.style.display !== 'none';
                 if ((isMaster || role === 'DPO') && permissionsTableBody && permTabVisible) { loadPromises.push(loadPermissionsMatrix()); }

                 if (loadPromises.length > 0) { try { await Promise.all(loadPromises); } catch(loadError) { console.error("Erro load Promises (V13.2):", loadError); } }
                 else { console.log("Nenhum dado a carregar (V13.2).");}
                 console.log("initializeSettingsPage (V13.2): Carregamento dados OK.");

                 // Define aba ativa inicial
                 const initialTabId = firstVisibleTabId || 'tab-perfil';
                 console.log(`initializeSettingsPage (V13.2): Definindo aba inicial: ${initialTabId}`);
                 const initialTabLink = document.querySelector(`.tab-link[data-tab="${initialTabId}"]`);
                 if (initialTabLink && initialTabLink.style.display !== 'none') { switchTab(initialTabId); }
                 else { console.warn(`Aba inicial ${initialTabId} inviśivel (V13.2). Fallback 'tab-perfil'.`); switchTab('tab-perfil'); }

                 console.log("initializeSettingsPage (V13.2): Inicialização CONCLUÍDA.");
                 isInitializingSettings = false; // Concluído
                 return;

             } else if (retryCount < maxRetries) {
                 console.warn(`initializeSettingsPage (V13.2 - Tentativa ${retryCount + 1}): Perfil não disponível. Esperando ${delay}ms...`);
                 setTimeout(() => initializeSettingsPage(retryCount + 1, maxRetries, delay), delay);
             } else {
                 console.error(`ERRO CRÍTICO (V13.2): Perfil não carregado.`);
                 if(tabContentContainer) tabContentContainer.innerHTML = '<p class="form-message error">Falha permissões.</p>';
                 if(tabNav) tabNav.style.display = 'none';
                 isInitializingSettings = false; // Concluído com erro
             }
        };

        // --- Adiciona listeners de clique às abas ---
        if (tabLinks.length > 0) { tabLinks.forEach(link => { link.removeEventListener('click', handleTabClick); link.addEventListener('click', handleTabClick); }); }
        function handleTabClick(e) { e.preventDefault(); const targetTabId = e.currentTarget.getAttribute('data-tab'); if(targetTabId) switchTab(targetTabId); else console.error("Click aba sem 'data-tab' (V13.2)."); }

        // --- Chama a inicialização ---
        initializeSettingsPage(); // Inicia a primeira tentativa

    }; // Fim de window.initSettingsPage
}

