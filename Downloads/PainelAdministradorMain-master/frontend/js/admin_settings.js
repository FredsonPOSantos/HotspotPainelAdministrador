// Ficheiro: frontend/js/admin_settings.js
// [VERSÃO 13.5.3 - GESTÃO BATCH (Salvar Alterações)]
// Esta versão implementa o botão "Salvar Alterações"

if (window.initSettingsPage) {
    console.warn("Tentativa de carregar admin_settings.js múltiplas vezes (V13.5.3).");
} else {
    // Flag para evitar múltiplas inicializações
    let isInitializingSettings = false;
    
    // [NOVO V13.5.3] Variável para guardar o estado original das permissões
    let originalPermissionsState = {};

    window.initSettingsPage = () => {
        if (isInitializingSettings) { console.warn("initSettingsPage (V13.5.3) chamado novamente. Ignorando."); return; }
        isInitializingSettings = true;
        console.log("A inicializar a página de Configurações (V13.5.3 - Batch)...");

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
        const permissionsTableBody = document.getElementById('permissionsTableBody');
        const permissionsError = document.getElementById('permissionsError');
        const permHelpTextMaster = document.getElementById('permHelpTextMaster');
        const permHelpTextDPO = document.getElementById('permHelpTextDPO');
        // [NOVO V13.5.3] Elementos do Batch Save
        const permSaveChangesContainer = document.getElementById('permSaveChangesContainer');
        const permSaveChangesBtn = document.getElementById('permSaveChangesBtn');
        const permSaveStatus = document.getElementById('permSaveStatus');

        // --- Função de Troca de Abas ---
        const switchTab = (targetTabId) => {
             console.log(`switchTab (V13.5.3): Ativando aba ${targetTabId}`);
             if (!targetTabId) { console.error("switchTab (V13.5.3): ID inválido."); return; }
             if (tabContents) tabContents.forEach(content => content.classList.remove('active'));
             if (tabLinks) tabLinks.forEach(link => link.classList.remove('active'));
             const targetContent = document.getElementById(targetTabId);
             const targetLink = tabNav ? tabNav.querySelector(`.tab-link[data-tab="${targetTabId}"]`) : null;
             if (targetContent && targetContent.style.display !== 'none') { targetContent.classList.add('active'); }
             else if (!targetContent) { console.error(`switchTab (V13.5.3): Conteúdo ${targetTabId} não encontrado.`); }
             else { console.warn(`switchTab (V13.5.3): Conteúdo ${targetTabId} está escondido.`);}
             if (targetLink && targetLink.style.display !== 'none') { targetLink.classList.add('active'); }
             else if (!targetLink) { console.error(`switchTab (V13.5.3): Link ${targetTabId} não encontrado.`); }
              else { console.warn(`switchTab (V13.5.3): Link ${targetTabId} está escondido.`);}
        };

        // --- Lógicas das Abas ---

        // Aba Meu Perfil (Lógica Estável)
        if (changeOwnPasswordForm) {
            changeOwnPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault(); console.log("Form 'Perfil' submit (V13.5.3).");
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
        } else { console.warn("Form 'changeOwnPasswordForm' (V13.5.3) não encontrado."); }

        // Carrega Config Geral (Lógica Estável)
        const loadGeneralSettings = async () => { /* ... */ console.log("loadGeneralSettings (V13.5.3)..."); if(!window.currentUserProfile||window.currentUserProfile.role!=='master'){if(generalSettingsForm)generalSettingsForm.style.display='none';return false;} if(generalSettingsForm)generalSettingsForm.style.removeProperty('display'); try{const s=await apiRequest('/api/settings/general'); console.log("loadGeneralSettings (V13.5.3) OK:",s); if(companyNameInput)companyNameInput.value=s?.company_name||''; if(primaryColorInput)primaryColorInput.value=s?.primary_color||'#3182CE'; if(currentLogoPreview){if(s?.logo_url){const a=`http://${window.location.hostname}:3000`,p=s.logo_url.startsWith('/')?s.logo_url:'/'+s.logo_url;currentLogoPreview.src=`${a}${p}?t=${Date.now()}`;currentLogoPreview.style.display='block';}else{currentLogoPreview.style.display='none';currentLogoPreview.src='#';}} return true;}catch(err){console.error("Erro loadGeneralSettings (V13.5.3):",err);if(generalSettingsError)generalSettingsError.textContent=`Erro: ${err.message}`;return false;} };
        // Listener Geral (Lógica Estável)
        if (generalSettingsForm) { generalSettingsForm.addEventListener('submit', async (e) => { /* ... */ e.preventDefault(); console.log("Form 'Geral' submit (V13.5.3)."); if(generalSettingsError)generalSettingsError.textContent='';if(generalSettingsSuccess)generalSettingsSuccess.textContent=''; const fD=new FormData(); if(companyNameInput)fD.append('companyName',companyNameInput.value); if(primaryColorInput)fD.append('primaryColor',primaryColorInput.value); if(logoUploadInput&&logoUploadInput.files[0]){fD.append('companyLogo',logoUploadInput.files[0]);} const btn=generalSettingsForm.querySelector('button[type="submit"]'); if(btn){btn.disabled=true;btn.textContent='A guardar...';} try{const r=await apiRequest('/api/settings/general','POST',fD); if(generalSettingsSuccess)generalSettingsSuccess.textContent=r.message||"Salvo!"; await loadGeneralSettings(); if(window.systemSettings&&r.settings){Object.assign(window.systemSettings,r.settings); if(typeof applyVisualSettings==='function'){applyVisualSettings(window.systemSettings);}}}catch(err){if(generalSettingsError)generalSettingsError.textContent=`Erro: ${err.message||'Falha.'}`;}finally{if(btn){btn.disabled=false;btn.textContent='Guardar Configurações Gerais';} if(logoUploadInput)logoUploadInput.value='';} }); }
        else { console.warn("Form 'generalSettingsForm' (V13.5.3) não encontrado."); }

        // Carrega Config Hotspot (Lógica Estável)
        const loadHotspotSettings = async () => { /* ... */ console.log("loadHotspotSettings (V13.5.3)..."); if(!window.currentUserProfile||window.currentUserProfile.role!=='master'){if(hotspotSettingsForm)hotspotSettingsForm.style.display='none';return false;} if(hotspotSettingsForm)hotspotSettingsForm.style.removeProperty('display'); try{const s=await apiRequest('/api/settings/hotspot'); console.log("loadHotspotSettings (V13.5.3) OK:",s); if(sessionTimeoutInput)sessionTimeoutInput.value=s?.session_timeout_minutes||''; if(domainWhitelistTextarea){domainWhitelistTextarea.value=(s?.domain_whitelist||[]).join('\n');} return true;}catch(err){console.error("Erro loadHotspotSettings (V13.5.3):",err);if(hotspotSettingsError)hotspotSettingsError.textContent=`Erro: ${err.message}`;return false;} };
        // Listener Hotspot (Lógica Estável)
        if (hotspotSettingsForm) { hotspotSettingsForm.addEventListener('submit', async (e) => { /* ... */ e.preventDefault(); console.log("Form 'Hotspot' submit (V13.5.3)."); if(hotspotSettingsError)hotspotSettingsError.textContent='';if(hotspotSettingsSuccess)hotspotSettingsSuccess.textContent=''; const dWA=domainWhitelistTextarea?domainWhitelistTextarea.value.split('\n').map(d=>d.trim()).filter(d=>d&&d.length>0):[]; let tV=sessionTimeoutInput?parseInt(sessionTimeoutInput.value,10):null; if(tV!==null&&(isNaN(tV)||tV<=0)){if(hotspotSettingsError)hotspotSettingsError.textContent='Timeout inválido.';return;} const sD={sessionTimeoutMinutes:tV,domainWhitelist:dWA}; const btn=hotspotSettingsForm.querySelector('button[type="submit"]'); if(btn){btn.disabled=true;btn.textContent='A guardar...';} try{const r=await apiRequest('/api/settings/hotspot','POST',sD); if(hotspotSettingsSuccess)hotspotSettingsSuccess.textContent=r.message||"Salvo!"; await loadHotspotSettings();}catch(err){if(hotspotSettingsError)hotspotSettingsError.textContent=`Erro: ${err.message||'Falha.'}`;}finally{if(btn){btn.disabled=false;btn.textContent='Guardar Configurações do Hotspot';}} }); }
        else { console.warn("Form 'hotspotSettingsForm' (V13.5.3) não encontrado."); }


        // [NOVO V13.5.3] Lógica do Botão Salvar (Batch Update)
        const handleSavePermissions = async () => {
            if (!permSaveChangesBtn) return;
            if (permSaveStatus) permSaveStatus.textContent = 'A guardar...';
            permSaveChangesBtn.disabled = true;
            
            const changes = []; // Array para guardar apenas as mudanças
            const checkboxes = permissionsTableBody.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(box => {
                const key = box.id; // Ex: 'master|routers.read'
                const currentState = box.checked;
                const originalState = originalPermissionsState[key];
                
                // Compara o estado atual com o original
                if (currentState !== originalState) {
                    changes.push({
                        role: box.dataset.role,
                        permission: box.dataset.permission,
                        checked: currentState
                    });
                }
            });

            if (changes.length === 0) {
                if (permSaveStatus) permSaveStatus.textContent = 'Nenhuma alteração detetada.';
                permSaveChangesBtn.disabled = false;
                setTimeout(() => { if (permSaveStatus) permSaveStatus.textContent = ''; }, 3000);
                return;
            }

            console.log(`handleSavePermissions (V13.5.3): Enviando ${changes.length} alterações...`, changes);

            try {
                // Envia o array de mudanças para a nova rota 'update-batch'
                const response = await apiRequest('/api/permissions/update-batch', 'POST', { changes });
                if (permSaveStatus) {
                    permSaveStatus.textContent = response.message || 'Alterações guardadas!';
                    permSaveStatus.style.color = 'var(--success-text)';
                }
                
                // Atualiza o estado original para o novo estado salvo
                changes.forEach(change => {
                    const key = `${change.role}|${change.permission}`;
                    originalPermissionsState[key] = change.checked;
                });

            } catch (error) {
                console.error("Erro ao salvar permissões (V13.5.3):", error);
                if (permSaveStatus) {
                    permSaveStatus.textContent = `Erro: ${error.message}`;
                    permSaveStatus.style.color = 'var(--error-text)';
                }
                // Não recarrega, para o utilizador não perder as alterações
            } finally {
                permSaveChangesBtn.disabled = false;
                setTimeout(() => { if (permSaveStatus) { permSaveStatus.textContent = ''; permSaveStatus.style.color = ''; } }, 4000);
            }
        };

        // [ATUALIZADO V13.5.3] Fase 3.1: Lógica da Aba "Funções e Permissões"
        const loadPermissionsMatrix = async () => {
            console.log("loadPermissionsMatrix (V13.5.3)...");
            if (!permissionsTableBody) { console.error("permissionsTableBody (V13.5.3) not found!"); return false; }
            if (permissionsError) permissionsError.textContent = '';
            permissionsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">A carregar...</td></tr>';
            
            const role = window.currentUserProfile?.role;
            if (role !== 'master' && role !== 'DPO') {
                console.log("loadPermissionsMatrix (V13.5.3): Acesso negado (não é Master/DPO).");
                permissionsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Acesso negado.</td></tr>';
                const permMatrixEl = document.querySelector('.permissions-matrix');
                if (permMatrixEl) permMatrixEl.style.display = 'none';
                return false;
            }
            
            // Define o modo (Master pode editar, DPO só vê)
            const isMaster = (role === 'master');
            
            if (isMaster && permHelpTextMaster) permHelpTextMaster.style.display = 'block';
            if (!isMaster && permHelpTextDPO) permHelpTextDPO.style.display = 'block';

            try {
                // [MODIFICADO V13.5.2] Chama a API real em vez de MOCK DATA
                const matrixData = await apiRequest('/api/permissions/matrix');
                
                // [NOVO V13.5.3] Reseta o estado original
                originalPermissionsState = {}; 

                // --- Renderização do Cabeçalho ---
                const theadRow = document.querySelector('#permissionsTable thead tr');
                if (!theadRow) { console.error("Thead (V13.5.3) não encontrado!"); return false; }
                
                theadRow.innerHTML = '<th>Funcionalidade</th><th>Ação</th>'; // Limpa e define colunas fixas
                matrixData.roles.forEach(roleName => {
                    const th = document.createElement('th');
                    th.textContent = roleName.charAt(0).toUpperCase() + roleName.slice(1);
                    theadRow.appendChild(th);
                });
                
                // --- Renderização do Corpo ---
                permissionsTableBody.innerHTML = '';
                
                matrixData.permissions.forEach(perm => {
                    const row = document.createElement('tr');
                    
                    // Célula 1: Funcionalidade
                    const featureCell = document.createElement('td');
                    featureCell.innerHTML = `<strong>${perm.feature_name}</strong>`;
                    featureCell.style.textAlign = 'left';
                    row.appendChild(featureCell);

                    // Célula 2: Ação
                    const actionCell = document.createElement('td');
                    actionCell.textContent = perm.action_name;
                    actionCell.style.textAlign = 'left';
                    actionCell.style.fontSize = '12px';
                    actionCell.style.color = 'var(--text-secondary)';
                    row.appendChild(actionCell);

                    // Células 3+: Roles (Checkboxes ou Leitura)
                    matrixData.roles.forEach(roleName => {
                        const cell = document.createElement('td');
                        const permissionKey = perm.permission_key;
                        const isChecked = matrixData.assignments[roleName]?.[permissionKey] === true;
                        
                        // [NOVO V13.5.3] Guarda o estado original
                        const stateKey = `${roleName}|${permissionKey}`;
                        originalPermissionsState[stateKey] = isChecked;

                        if (isMaster) {
                            // --- MODO MASTER (Edição) ---
                            const checkboxId = `${roleName}|${permissionKey}`;
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.id = checkboxId;
                            checkbox.checked = isChecked;
                            checkbox.dataset.role = roleName; // Guarda dados para o evento
                            checkbox.dataset.permission = permissionKey;
                            
                            // Master não pode editar a si mesmo (segurança)
                            if (roleName === 'master') {
                                checkbox.disabled = true;
                            }
                            
                            const label = document.createElement('label');
                            label.htmlFor = checkboxId;
                            label.className = 'checkbox-label-hidden'; // Esconde visualmente o label
                            label.textContent = `Ativar ${perm.action_name} para ${roleName}`;
                            
                            cell.appendChild(checkbox);
                            cell.appendChild(label);
                            
                        } else {
                            // --- MODO DPO (Leitura) ---
                            cell.textContent = isChecked ? '✓' : '—';
                            cell.className = isChecked ? 'perm-read' : 'perm-none';
                        }
                        
                        row.appendChild(cell);
                    });
                    
                    permissionsTableBody.appendChild(row);
                });
                
                // [NOVO V13.5.3] Adiciona listener ao botão Salvar (se for master)
                if (isMaster) {
                     if (permSaveChangesContainer) permSaveChangesContainer.style.display = 'block';
                     if (permSaveChangesBtn) {
                         permSaveChangesBtn.removeEventListener('click', handleSavePermissions); // Remove listener antigo
                         permSaveChangesBtn.addEventListener('click', handleSavePermissions); // Adiciona novo
                     }
                }

                return true; // Sucesso

            } catch (error) {
                console.error("Erro loadPermissionsMatrix (V13.5.3):", error);
                if (permissionsError) permissionsError.textContent = `Erro: ${error.message}`;
                const colspan = (document.querySelectorAll('#permissionsTable thead th')?.length || 5);
                permissionsTableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: var(--error-text);">Falha ao carregar.</td></tr>`;
                return false; // Falha
            }
        };


        // --- Função Central de Inicialização ---
        const initializeSettingsPage = async (retryCount = 0, maxRetries = 10, delay = 300) => {
             console.log(`initializeSettingsPage (V13.5.3 - Tentativa ${retryCount + 1}/${maxRetries}): Verificando perfil...`);

             if (window.currentUserProfile && window.currentUserProfile.role) {
                 const role = window.currentUserProfile.role;
                 console.log(`initializeSettingsPage (V13.5.3): Perfil OK! Role: ${role}`);
                 const isMaster = (role === 'master');

                 // Mostra/Esconde abas e conteúdos (Lógica V13)
                 console.log("initializeSettingsPage (V13.5.3): Aplicando visibilidade (Lógica V13)...");
                 let firstVisibleTabId = null;
                 if (tabLinks && tabContents) {
                      tabLinks.forEach(link => { 
                          const tabId = link.getAttribute('data-tab'); 
                          const content = document.getElementById(tabId); 
                          let show = true; 
                          
                          // Lógica V13 (Baseada em CSS classes)
                          if(link.classList.contains('admin-only') && !['master','gestao','DPO'].includes(role)){ show=false; } 
                          if(link.classList.contains('master-only') && !isMaster){ show=false; } 
                          
                          // [NOVO V13.5.2] Lógica específica para a aba de Permissões
                          // A aba 'tab-permissoes' (V13.5.2) é visível para 'master' E 'DPO'
                          if (tabId === 'tab-permissoes' && (role === 'master' || role === 'DPO')) {
                              show = true;
                          }
                          
                          if(show){ 
                              link.style.removeProperty('display'); 
                              if(content) content.style.removeProperty('display'); 
                              if(!firstVisibleTabId) firstVisibleTabId = tabId;
                          } else {
                              link.style.display='none'; 
                              if(content) content.style.display='none';
                          } 
                      });
                 } else { console.error("Tabs não encontradas (V13.5.3)!"); isInitializingSettings = false; return; }
                 console.log(`initializeSettingsPage (V13.5.3): Visibilidade OK. Primeira visível: ${firstVisibleTabId}`);

                 // Carrega dados das configurações visíveis
                 console.log("initializeSettingsPage (V13.5.3): Carregando dados...");
                 let loadPromises = [];
                 if (isMaster && generalSettingsForm && document.querySelector('.tab-link[data-tab="tab-geral"]')?.style.display !== 'none') { loadPromises.push(loadGeneralSettings()); }
                 if (isMaster && hotspotSettingsForm && document.querySelector('.tab-link[data-tab="tab-hotspot"]')?.style.display !== 'none') { loadPromises.push(loadHotspotSettings()); }
                 
                 // [ATUALIZADO V13.5.2] Carrega se for 'master' OU 'DPO'
                 const permTabVisible = document.querySelector('.tab-link[data-tab="tab-permissoes"]')?.style.display !== 'none';
                 if ((isMaster || role === 'DPO') && permissionsTableBody && permTabVisible) { 
                     loadPromises.push(loadPermissionsMatrix()); 
                 }

                 if (loadPromises.length > 0) { try { await Promise.all(loadPromises); } catch(loadError) { console.error("Erro load Promises (V13.5.3):", loadError); } }
                 else { console.log("Nenhum dado a carregar (V13.5.3).");}
                 console.log("initializeSettingsPage (V13.5.3): Carregamento dados OK.");

                 // Define aba ativa inicial
                 const initialTabId = firstVisibleTabId || 'tab-perfil';
                 console.log(`initializeSettingsPage (V13.5.3): Definindo aba inicial: ${initialTabId}`);
                 const initialTabLink = document.querySelector(`.tab-link[data-tab="${initialTabId}"]`);
                 if (initialTabLink && initialTabLink.style.display !== 'none') { switchTab(initialTabId); }
                 else { console.warn(`Aba inicial ${initialTabId} inviśivel (V13.5.3). Fallback 'tab-perfil'.`); switchTab('tab-perfil'); }

                 console.log("initializeSettingsPage (V13.5.3): Inicialização CONCLUÍDA.");
                 isInitializingSettings = false; // Concluído
                 return;

             } else if (retryCount < maxRetries) {
                 console.warn(`initializeSettingsPage (V13.5.3 - Tentativa ${retryCount + 1}): Perfil não disponível. Esperando ${delay}ms...`);
                 setTimeout(() => initializeSettingsPage(retryCount + 1, maxRetries, delay), delay);
             } else {
                 console.error(`ERRO CRÍTICO (V13.5.3): Perfil não carregado.`);
                 if(tabContentContainer) tabContentContainer.innerHTML = '<p class="form-message error">Falha permissões.</p>';
                 if(tabNav) tabNav.style.display = 'none';
                 isInitializingSettings = false; // Concluído com erro
             }
        };

        // --- Adiciona listeners de clique às abas ---
        if (tabLinks.length > 0) { tabLinks.forEach(link => { link.removeEventListener('click', handleTabClick); link.addEventListener('click', handleTabClick); }); }
        function handleTabClick(e) { e.preventDefault(); const targetTabId = e.currentTarget.getAttribute('data-tab'); if(targetTabId) switchTab(targetTabId); else console.error("Click aba sem 'data-tab' (V13.5.3)."); }

        // --- Chama a inicialização ---
        initializeSettingsPage(); // Inicia a primeira tentativa

    }; // Fim de window.initSettingsPage
}

