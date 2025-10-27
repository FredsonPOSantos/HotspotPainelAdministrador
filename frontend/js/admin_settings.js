// Ficheiro: frontend/js/admin_settings.js
// [VERSÃO 13.5.1 - Corrigido para Fase 3.1: Busca API real e alinha DPO]

if (window.initSettingsPage) {
    console.warn("Tentativa de carregar admin_settings.js múltiplas vezes (V13.5.1).");
} else {
    // Flag para evitar múltiplas inicializações
    let isInitializingSettings = false;

    window.initSettingsPage = () => {
        if (isInitializingSettings) { console.warn("initSettingsPage (V13.5.1) chamado novamente. Ignorando."); return; }
        isInitializingSettings = true;
        console.log("A inicializar a página de Configurações (V13.5.1)...");

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
        // Fase 3.1 Elements
        const permissionsTable = document.getElementById('permissionsTable'); // Tabela inteira
        const permissionsTableHeadRow = permissionsTable ? permissionsTable.querySelector('thead tr') : null; // Cabeçalho <tr>
        const permissionsTableBody = document.getElementById('permissionsTableBody'); // Corpo <tbody>
        const permissionsError = document.getElementById('permissionsError');

        // --- Função de Troca de Abas ---
        const switchTab = (targetTabId) => {
             console.log(`switchTab (V13.5.1): Ativando aba ${targetTabId}`);
             if (!targetTabId) { console.error("switchTab (V13.5.1): ID inválido."); return; }
             if (tabContents) tabContents.forEach(content => content.classList.remove('active'));
             if (tabLinks) tabLinks.forEach(link => link.classList.remove('active'));
             const targetContent = document.getElementById(targetTabId);
             const targetLink = tabNav ? tabNav.querySelector(`.tab-link[data-tab="${targetTabId}"]`) : null;
             if (targetContent && targetContent.style.display !== 'none') { targetContent.classList.add('active'); }
             else if (!targetContent) { console.error(`switchTab (V13.5.1): Conteúdo ${targetTabId} não encontrado.`); }
             else { console.warn(`switchTab (V13.5.1): Conteúdo ${targetTabId} está escondido.`);}
             if (targetLink && targetLink.style.display !== 'none') { targetLink.classList.add('active'); }
             else if (!targetLink) { console.error(`switchTab (V13.5.1): Link ${targetTabId} não encontrado.`); }
              else { console.warn(`switchTab (V13.5.1): Link ${targetTabId} está escondido.`);}
        };

        // --- Lógicas das Abas ---

        // Aba Meu Perfil (Lógica Estável)
        if (changeOwnPasswordForm) {
            changeOwnPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault(); console.log("Form 'Perfil' submit (V13.5.1).");
                if(changeOwnPasswordError) changeOwnPasswordError.textContent=''; if(changeOwnPasswordSuccess) changeOwnPasswordSuccess.textContent='';
                const cPI=document.getElementById('currentPassword'),nPI=document.getElementById('newVoluntaryPassword'),cNPI=document.getElementById('confirmNewVoluntaryPassword'),btn=changeOwnPasswordForm.querySelector('button[type="submit"]');
                if(!cPI||!nPI||!cNPI){if(changeOwnPasswordError)changeOwnPasswordError.textContent='Erro interno.';return;}
                const cP=cPI.value,nP=nPI.value,cNP=cNPI.value;
                if(nP!==cNP){if(changeOwnPasswordError)changeOwnPasswordError.textContent='Senhas não coincidem.';return;}
                if(nP.length<6){if(changeOwnPasswordError)changeOwnPasswordError.textContent='Senha < 6 chars.';return;}
                if(btn){btn.disabled=true;btn.textContent='A alterar...';}
                try{const r=await apiRequest('/api/admin/profile/change-own-password','POST',{currentPassword:cP,newPassword:nP}); if(changeOwnPasswordSuccess)changeOwnPasswordSuccess.textContent=r.message||'Senha alterada!'; changeOwnPasswordForm.reset();}
                catch(err){if(changeOwnPasswordError)changeOwnPasswordError.textContent=`Erro: ${err.message||'Falha.'}`;}
                finally{if(btn){btn.disabled=false;btn.textContent='Alterar Senha';}}
            });
        } else { console.warn("Form 'changeOwnPasswordForm' (V13.5.1) não encontrado."); }

        // Carrega Config Geral (Lógica Estável)
        const loadGeneralSettings = async () => { /* ... (Lógica V13.5 inalterada) ... */ console.log("loadGeneralSettings (V13.5.1)..."); if(!window.currentUserProfile||window.currentUserProfile.role!=='master'){if(generalSettingsForm)generalSettingsForm.style.display='none';return false;} if(generalSettingsForm)generalSettingsForm.style.removeProperty('display'); try{const s=await apiRequest('/api/settings/general'); console.log("loadGeneralSettings (V13.5.1) OK:",s); if(companyNameInput)companyNameInput.value=s?.company_name||''; if(primaryColorInput)primaryColorInput.value=s?.primary_color||'#3182CE'; if(currentLogoPreview){if(s?.logo_url){const a=`http://${window.location.hostname}:3000`,p=s.logo_url.startsWith('/')?s.logo_url:'/'+s.logo_url;currentLogoPreview.src=`${a}${p}?t=${Date.now()}`;currentLogoPreview.style.display='block';}else{currentLogoPreview.style.display='none';currentLogoPreview.src='#';}} return true;}catch(err){console.error("Erro loadGeneralSettings (V13.5.1):",err);if(generalSettingsError)generalSettingsError.textContent=`Erro: ${err.message}`;return false;} };
        // Listener Geral (Lógica Estável)
        if (generalSettingsForm) { generalSettingsForm.addEventListener('submit', async (e) => { /* ... (Lógica V13.5 inalterada) ... */ e.preventDefault(); console.log("Form 'Geral' submit (V13.5.1)."); if(generalSettingsError)generalSettingsError.textContent='';if(generalSettingsSuccess)generalSettingsSuccess.textContent=''; const fD=new FormData(); if(companyNameInput)fD.append('companyName',companyNameInput.value); if(primaryColorInput)fD.append('primaryColor',primaryColorInput.value); if(logoUploadInput&&logoUploadInput.files[0]){fD.append('companyLogo',logoUploadInput.files[0]);} const btn=generalSettingsForm.querySelector('button[type="submit"]'); if(btn){btn.disabled=true;btn.textContent='A guardar...';} try{const r=await apiRequest('/api/settings/general','POST',fD); if(generalSettingsSuccess)generalSettingsSuccess.textContent=r.message||"Salvo!"; await loadGeneralSettings(); if(window.systemSettings&&r.settings){Object.assign(window.systemSettings,r.settings); if(typeof applyVisualSettings==='function'){applyVisualSettings(window.systemSettings);}}}catch(err){if(generalSettingsError)generalSettingsError.textContent=`Erro: ${err.message||'Falha.'}`;}finally{if(btn){btn.disabled=false;btn.textContent='Guardar Configurações Gerais';} if(logoUploadInput)logoUploadInput.value='';} }); }
        else { console.warn("Form 'generalSettingsForm' (V13.5.1) não encontrado."); }

        // Carrega Config Hotspot (Lógica Estável)
        const loadHotspotSettings = async () => { /* ... (Lógica V13.5 inalterada) ... */ console.log("loadHotspotSettings (V13.5.1)..."); if(!window.currentUserProfile||window.currentUserProfile.role!=='master'){if(hotspotSettingsForm)hotspotSettingsForm.style.display='none';return false;} if(hotspotSettingsForm)hotspotSettingsForm.style.removeProperty('display'); try{const s=await apiRequest('/api/settings/hotspot'); console.log("loadHotspotSettings (V13.5.1) OK:",s); if(sessionTimeoutInput)sessionTimeoutInput.value=s?.session_timeout_minutes||''; if(domainWhitelistTextarea){domainWhitelistTextarea.value=(s?.domain_whitelist||[]).join('\n');} return true;}catch(err){console.error("Erro loadHotspotSettings (V13.5.1):",err);if(hotspotSettingsError)hotspotSettingsError.textContent=`Erro: ${err.message}`;return false;} };
        // Listener Hotspot (Lógica Estável)
        if (hotspotSettingsForm) { hotspotSettingsForm.addEventListener('submit', async (e) => { /* ... (Lógica V13.5 inalterada) ... */ e.preventDefault(); console.log("Form 'Hotspot' submit (V13.5.1)."); if(hotspotSettingsError)hotspotSettingsError.textContent='';if(hotspotSettingsSuccess)hotspotSettingsSuccess.textContent=''; const dWA=domainWhitelistTextarea?domainWhitelistTextarea.value.split('\n').map(d=>d.trim()).filter(d=>d&&d.length>0):[]; let tV=sessionTimeoutInput?parseInt(sessionTimeoutInput.value,10):null; if(tV!==null&&(isNaN(tV)||tV<=0)){if(hotspotSettingsError)hotspotSettingsError.textContent='Timeout inválido.';return;} const sD={sessionTimeoutMinutes:tV,domainWhitelist:dWA}; const btn=hotspotSettingsForm.querySelector('button[type="submit"]'); if(btn){btn.disabled=true;btn.textContent='A guardar...';} try{const r=await apiRequest('/api/settings/hotspot','POST',sD); if(hotspotSettingsSuccess)hotspotSettingsSuccess.textContent=r.message||"Salvo!"; await loadHotspotSettings();}catch(err){if(hotspotSettingsError)hotspotSettingsError.textContent=`Erro: ${err.message||'Falha.'}`;}finally{if(btn){btn.disabled=false;btn.textContent='Guardar Configurações do Hotspot';}} }); }
        else { console.warn("Form 'hotspotSettingsForm' (V13.5.1) não encontrado."); }


        // [CORRIGIDO V13.5.1] Fase 3.1: Lógica da Aba "Funções e Permissões"
        const loadPermissionsMatrix = async () => {
            console.log("loadPermissionsMatrix (V13.5.1)...");
            if (!permissionsTableBody || !permissionsTableHeadRow) {
                console.error("permissionsTableBody ou HeadRow (V13.5.1) not found!");
                return false;
            }
            if (permissionsError) permissionsError.textContent = '';
            permissionsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">A carregar...</td></tr>';
            
            // Verificação de permissão (mantida do V13.5, está correta)
            const role = window.currentUserProfile?.role;
            if (role !== 'master' && role !== 'DPO') {
                console.log("loadPermissionsMatrix (V13.5.1): Access denied.");
                permissionsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Acesso negado.</td></tr>';
                const permMatrixEl = document.querySelector('.permissions-matrix');
                if (permMatrixEl) permMatrixEl.style.display = 'none';
                return false;
            }

            try {
                // [CORRIGIDO] Substitui MOCK DATA pela chamada real à API
                console.log("loadPermissionsMatrix (V13.5.1): Buscando dados da API /api/permissions/matrix...");
                const permissionsData = await apiRequest('/api/permissions/matrix');
                
                if (!permissionsData || !permissionsData.roles || !permissionsData.features) {
                     throw new Error("Formato de dados da API de permissões inválido.");
                }
                console.log("loadPermissionsMatrix (V13.5.1): Dados recebidos.", permissionsData);

                // --- Limpa e Constrói o Cabeçalho (Thead) ---
                permissionsTableHeadRow.innerHTML = '<th>Funcionalidade</th>';
                permissionsData.roles.forEach(roleKey => {
                    const th = document.createElement('th');
                    th.textContent = roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
                    permissionsTableHeadRow.appendChild(th);
                });
                const totalColumns = permissionsData.roles.length + 1;

                // --- Limpa e Constrói o Corpo (Tbody) ---
                permissionsTableBody.innerHTML = '';
                
                // Pega os nomes das funcionalidades (features) e ordena
                const featureNames = Object.keys(permissionsData.features).sort();

                if (featureNames.length === 0) {
                     permissionsTableBody.innerHTML = `<tr><td colspan="${totalColumns}" style="text-align: center;">Nenhuma funcionalidade encontrada.</td></tr>`;
                     return true;
                }

                // Itera sobre cada funcionalidade (já ordenada)
                featureNames.forEach(featureName => {
                    const row = document.createElement('tr');
                    // 1. Célula da Funcionalidade
                    row.innerHTML = `<td style="text-align: left; white-space: normal;"><strong>${featureName}</strong></td>`;
                    
                    const featurePerms = permissionsData.features[featureName]; // Ex: { master: ['Ler'], gestao: ['Ler'] }

                    // 2. Células das Roles
                    permissionsData.roles.forEach(roleKey => {
                        // Pega as ações para esta role (ex: ['Criar', 'Ler']) ou um array vazio
                        const actions = featurePerms[roleKey] || [];
                        
                        // [CORRIGIDO] Lógica para definir o texto e a classe (baseado nas actions reais)
                        let pText = 'Nenhum';
                        let cls = 'perm-none';

                        if (actions.length > 0) {
                            // Converte ['Criar', 'Ler', 'Atualizar', 'Eliminar'] para 'CRUD'
                            const hasC = actions.includes('Criar');
                            const hasR = actions.includes('Ler');
                            const hasU = actions.includes('Atualizar');
                            const hasD = actions.includes('Eliminar');

                            if (hasC && hasR && hasU && hasD) {
                                pText = 'CRUD';
                                cls = 'perm-full';
                            } else if (actions.includes('R/W') || (hasR && (hasC || hasU))) {
                                // Se tiver R + (C ou U), ou R/W explícito
                                pText = actions.join(' / '); // Ex: "Ler / Criar"
                                cls = 'perm-partial';
                            } else if (hasR) {
                                pText = actions.join(' / '); // Ex: "Ler" ou "Ler / Exportar"
                                cls = 'perm-read';
                            } else {
                                pText = actions.join(' / '); // Outras (ex: "Executar")
                                cls = 'perm-partial';
                            }
                            
                            // Ajustes de texto para melhor leitura (baseado no mock V13.5)
                            if (pText === 'Ler / Exportar') pText = 'Ver/Exportar';
                            if (pText === 'Alterar Senha') cls = 'perm-read';
                            if (pText.includes('CRUD') || pText.includes('R/W') || pText.includes('Executar')) cls = 'perm-full';

                        }
                        // else (se actions.length === 0) -> pText e cls mantêm-se 'Nenhum' e 'perm-none'

                        const cell = document.createElement('td');
                        cell.className = cls;
                        cell.textContent = pText;
                        cell.title = actions.join(', ') || 'Nenhuma'; // Tooltip com ações reais
                        row.appendChild(cell);
                    });
                    permissionsTableBody.appendChild(row);
                });
                return true; // Sucesso

            } catch (error) {
                console.error("Erro loadPermissionsMatrix (V13.5.1):", error);
                if (permissionsError) permissionsError.textContent = `Erro: ${error.message}`;
                const colspan = (permissionsTableHeadRow.querySelectorAll('th')?.length || 5);
                permissionsTableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: var(--error-text);">Falha ao carregar permissões da API.</td></tr>`;
                return false; // Falha
            }
        };


        // --- Função Central de Inicialização ---
        const initializeSettingsPage = async (retryCount = 0, maxRetries = 10, delay = 300) => {
             console.log(`initializeSettingsPage (V13.5.1 - Tentativa ${retryCount + 1}/${maxRetries}): Verificando perfil...`);

             if (window.currentUserProfile && window.currentUserProfile.role) {
                 const role = window.currentUserProfile.role;
                 console.log(`initializeSettingsPage (V13.5.1): Perfil OK! Role: ${role}`);
                 const isMaster = (role === 'master');
                 const isDPO = (role === 'DPO'); // [NOVO]

                 // Mostra/Esconde abas e conteúdos (baseado na lógica V13.5)
                 console.log("initializeSettingsPage (V13.5.1): Aplicando visibilidade...");
                 let firstVisibleTabId = null;
                 if (tabLinks && tabContents) {
                      tabLinks.forEach(link => {
                           const tabId=link.getAttribute('data-tab');
                           const content=document.getElementById(tabId);
                           if (!content) return; // Segurança
                           
                           let show=true;
                           const linkClasses = link.classList;

                           // [CORRIGIDO] Lógica de visibilidade
                           // 1. Se for 'admin-only' e o user não for admin
                           if (linkClasses.contains('admin-only') && !['master','gestao','DPO'].includes(role)) {
                               show = false;
                           }
                           // 2. Se for 'master-only' e o user não for master
                           if (linkClasses.contains('master-only') && !isMaster) {
                               show = false;
                           }
                           
                           // [NOVA LÓGICA] Tratamento especial para a aba de permissões (que não tem mais master-only)
                           if (tabId === 'tab-permissoes' && !(isMaster || isDPO)) {
                               show = false;
                           }
                           // [NOTA] Adicionar lógica para 'tab-logs' e 'tab-lgpd' aqui quando implementadas

                           if (show) {
                               link.style.removeProperty('display');
                               content.style.removeProperty('display');
                               if(!firstVisibleTabId) firstVisibleTabId = tabId;
                           } else {
                               link.style.display='none';
                               content.style.display='none';
                           }
                      });
                 } else { console.error("Tabs não encontradas (V13.5.1)!"); isInitializingSettings = false; return; }
                 console.log(`initializeSettingsPage (V13.5.1): Visibilidade OK. Primeira visível: ${firstVisibleTabId}`);

                 // Carrega dados das configurações visíveis
                 console.log("initializeSettingsPage (V13.5.1): Carregando dados...");
                 let loadPromises = [];
                 // (Lógica V13.5 mantida)
                 if (isMaster && generalSettingsForm && document.querySelector('.tab-link[data-tab="tab-geral"]')?.style.display !== 'none') { loadPromises.push(loadGeneralSettings()); }
                 if (isMaster && hotspotSettingsForm && document.querySelector('.tab-link[data-tab="tab-hotspot"]')?.style.display !== 'none') { loadPromises.push(loadHotspotSettings()); }
                 
                 // (Lógica V13.5 mantida - já estava correta)
                 const permTabVisible = document.querySelector('.tab-link[data-tab="tab-permissoes"]')?.style.display !== 'none';
                 if ((isMaster || isDPO) && permissionsTableBody && permTabVisible) {
                      console.log("Iniciando loadPermissionsMatrix...");
                      loadPromises.push(loadPermissionsMatrix());
                 }

                 if (loadPromises.length > 0) { try { await Promise.all(loadPromises); } catch(loadError) { console.error("Erro load Promises (V13.5.1):", loadError); } }
                 else { console.log("Nenhum dado a carregar (V13.5.1).");}
                 console.log("initializeSettingsPage (V13.5.1): Carregamento dados OK.");

                 // Define aba ativa inicial (Lógica V13.5 mantida)
                 const initialTabId = firstVisibleTabId || 'tab-perfil';
                 console.log(`initializeSettingsPage (V13.5.1): Definindo aba inicial: ${initialTabId}`);
                 const initialTabLink = document.querySelector(`.tab-link[data-tab="${initialTabId}"]`);
                 if (initialTabLink && initialTabLink.style.display !== 'none') { switchTab(initialTabId); }
                 else { console.warn(`Aba inicial ${initialTabId} inviśivel (V13.5.1). Fallback 'tab-perfil'.`); switchTab('tab-perfil'); }

                 console.log("initializeSettingsPage (V13.5.1): Inicialização CONCLUÍDA.");
                 isInitializingSettings = false; // Concluído
                 return;

             } else if (retryCount < maxRetries) {
                 console.warn(`initializeSettingsPage (V13.5.1 - Tentativa ${retryCount + 1}): Perfil não disponível. Esperando ${delay}ms...`);
                 setTimeout(() => initializeSettingsPage(retryCount + 1, maxRetries, delay), delay);
             } else {
                 console.error(`ERRO CRÍTICO (V13.5.1): Perfil não carregado.`);
                 if(tabContentContainer) tabContentContainer.innerHTML = '<p class="form-message error">Falha permissões.</p>';
                 if(tabNav) tabNav.style.display = 'none';
                 isInitializingSettings = false; // Concluído com erro
             }
        };

        // --- Adiciona listeners de clique às abas ---
        if (tabLinks.length > 0) { tabLinks.forEach(link => { link.removeEventListener('click', handleTabClick); link.addEventListener('click', handleTabClick); }); }
        function handleTabClick(e) { e.preventDefault(); const targetTabId = e.currentTarget.getAttribute('data-tab'); if(targetTabId) switchTab(targetTabId); else console.error("Click aba sem 'data-tab' (V13.5.1)."); }

        // --- Chama a inicialização ---
        initializeSettingsPage(); // Inicia a primeira tentativa

    }; // Fim de window.initSettingsPage
}
