// Ficheiro: frontend/js/admin_settings.js
// [VERSÃO 13.5.3 - GESTÃO BATCH: Implementa "Salvar Alterações"]

if (window.initSettingsPage) {
    console.warn("Tentativa de carregar admin_settings.js múltiplas vezes (V13.5.3).");
} else {
    // Flag para evitar múltiplas inicializações
    let isInitializingSettings = false;

    window.initSettingsPage = () => {
        if (isInitializingSettings) { console.warn("initSettingsPage (V13.5.3) chamado novamente. Ignorando."); return; }
        isInitializingSettings = true;
        console.log("A inicializar a página de Configurações (V13.5.3)...");

        // --- Elementos Comuns ---
        const tabNav = document.querySelector('.tab-nav');
        const tabLinks = document.querySelectorAll('.tab-nav .tab-link');
        const tabContentContainer = document.querySelector('.tab-content-container');
        const tabContents = document.querySelectorAll('.tab-content-container .tab-content');

        // --- Elementos das Abas (Inalterados) ---
        const changeOwnPasswordForm = document.getElementById('changeOwnPasswordForm');
        // ... (outros elementos inalterados) ...
        const generalSettingsForm = document.getElementById('generalSettingsForm');
        const hotspotSettingsForm = document.getElementById('hotspotSettingsForm');
        
        // --- [ATUALIZADO] Fase 3.1 GESTÃO BATCH Elements ---
        const permissionsTable = document.getElementById('permissionsTable'); // Tabela inteira
        const permissionsTableHeadRow = permissionsTable ? permissionsTable.querySelector('thead tr') : null; // Cabeçalho <tr>
        const permissionsTableBody = document.getElementById('permissionsTableBody'); // Corpo <tbody>
        const permissionsError = document.getElementById('permissionsError');
        const permissionsSuccess = document.getElementById('permissionsSuccess'); // Mensagem de sucesso
        const masterViewOnlyText = document.querySelector('.master-view-only');
        const dpoViewOnlyText = document.querySelector('.dpo-view-only');
        const savePermissionsBtn = document.getElementById('savePermissionsBtn'); // [NOVO] Botão Salvar
        const saveActionsContainer = document.querySelector('.save-actions-container'); // [NOVO] Container do botão

        // [NOVO] Para guardar o estado original das permissões
        let originalPermissions = new Set();
        
        // Timer para limpar a mensagem de sucesso
        let successTimer = null;

        // --- Função de Troca de Abas (Inalterada) ---
        const switchTab = (targetTabId) => {
             // ... (código V13.5.2 inalterado) ...
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

        // --- Lógicas das Abas (Funções estáveis inalteradas) ---
        // ... (changeOwnPasswordForm, loadGeneralSettings, generalSettingsForm, loadHotspotSettings, hotspotSettingsForm) ...
        // ... (Listeners de submit para estas formas permanecem os mesmos da V13.5.2) ...
        // Aba Meu Perfil (Lógica Estável)
        if (changeOwnPasswordForm) {
            changeOwnPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault(); console.log("Form 'Perfil' submit (V13.5.3).");
                const changeOwnPasswordError = document.getElementById('changeOwnPasswordError');
                const changeOwnPasswordSuccess = document.getElementById('changeOwnPasswordSuccess');
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
        const loadGeneralSettings = async () => { /* ... (Lógica V13.5.2 inalterada) ... */ 
            console.log("loadGeneralSettings (V13.5.3)..."); 
            const generalSettingsError = document.getElementById('generalSettingsError');
            const companyNameInput = document.getElementById('companyName');
            const primaryColorInput = document.getElementById('primaryColor');
            const currentLogoPreview = document.getElementById('currentLogoPreview');
            if(!window.currentUserProfile||window.currentUserProfile.role!=='master'){if(generalSettingsForm)generalSettingsForm.style.display='none';return false;} if(generalSettingsForm)generalSettingsForm.style.removeProperty('display'); 
            try{const s=await apiRequest('/api/settings/general'); console.log("loadGeneralSettings (V13.5.3) OK:",s); if(companyNameInput)companyNameInput.value=s?.company_name||''; if(primaryColorInput)primaryColorInput.value=s?.primary_color||'#3182CE'; if(currentLogoPreview){if(s?.logo_url){const a=`http://${window.location.hostname}:3000`,p=s.logo_url.startsWith('/')?s.logo_url:'/'+s.logo_url;currentLogoPreview.src=`${a}${p}?t=${Date.now()}`;currentLogoPreview.style.display='block';}else{currentLogoPreview.style.display='none';currentLogoPreview.src='#';}} return true;}
            catch(err){console.error("Erro loadGeneralSettings (V13.5.3):",err);if(generalSettingsError)generalSettingsError.textContent=`Erro: ${err.message}`;return false;} 
        };
        // Listener Geral (Lógica Estável)
        if (generalSettingsForm) { generalSettingsForm.addEventListener('submit', async (e) => { /* ... (Lógica V13.5.2 inalterada) ... */ 
            e.preventDefault(); console.log("Form 'Geral' submit (V13.5.3)."); 
            const generalSettingsError = document.getElementById('generalSettingsError');
            const generalSettingsSuccess = document.getElementById('generalSettingsSuccess');
            const companyNameInput = document.getElementById('companyName');
            const primaryColorInput = document.getElementById('primaryColor');
            const logoUploadInput = document.getElementById('logoUpload');
            if(generalSettingsError)generalSettingsError.textContent='';if(generalSettingsSuccess)generalSettingsSuccess.textContent=''; const fD=new FormData(); if(companyNameInput)fD.append('companyName',companyNameInput.value); if(primaryColorInput)fD.append('primaryColor',primaryColorInput.value); if(logoUploadInput&&logoUploadInput.files[0]){fD.append('companyLogo',logoUploadInput.files[0]);} const btn=generalSettingsForm.querySelector('button[type="submit"]'); if(btn){btn.disabled=true;btn.textContent='A guardar...';} 
            try{const r=await apiRequest('/api/settings/general','POST',fD); if(generalSettingsSuccess)generalSettingsSuccess.textContent=r.message||"Salvo!"; await loadGeneralSettings(); if(window.systemSettings&&r.settings){Object.assign(window.systemSettings,r.settings); if(typeof applyVisualSettings==='function'){applyVisualSettings(window.systemSettings);}}}
            catch(err){if(generalSettingsError)generalSettingsError.textContent=`Erro: ${err.message||'Falha.'}`;}
            finally{if(btn){btn.disabled=false;btn.textContent='Guardar Configurações Gerais';} if(logoUploadInput)logoUploadInput.value='';} 
        }); }
        else { console.warn("Form 'generalSettingsForm' (V13.5.3) não encontrado."); }

        // Carrega Config Hotspot (Lógica Estável)
        const loadHotspotSettings = async () => { /* ... (Lógica V13.5.2 inalterada) ... */ 
            console.log("loadHotspotSettings (V13.5.3)..."); 
            const hotspotSettingsError = document.getElementById('hotspotSettingsError');
            const sessionTimeoutInput = document.getElementById('sessionTimeoutMinutes');
            const domainWhitelistTextarea = document.getElementById('domainWhitelist');
            if(!window.currentUserProfile||window.currentUserProfile.role!=='master'){if(hotspotSettingsForm)hotspotSettingsForm.style.display='none';return false;} if(hotspotSettingsForm)hotspotSettingsForm.style.removeProperty('display'); 
            try{const s=await apiRequest('/api/settings/hotspot'); console.log("loadHotspotSettings (V13.5.3) OK:",s); if(sessionTimeoutInput)sessionTimeoutInput.value=s?.session_timeout_minutes||''; if(domainWhitelistTextarea){domainWhitelistTextarea.value=(s?.domain_whitelist||[]).join('\n');} return true;}
            catch(err){console.error("Erro loadHotspotSettings (V13.5.3):",err);if(hotspotSettingsError)hotspotSettingsError.textContent=`Erro: ${err.message}`;return false;} 
        };
        // Listener Hotspot (Lógica Estável)
        if (hotspotSettingsForm) { hotspotSettingsForm.addEventListener('submit', async (e) => { /* ... (Lógica V13.5.2 inalterada) ... */ 
            e.preventDefault(); console.log("Form 'Hotspot' submit (V13.5.3)."); 
            const hotspotSettingsError = document.getElementById('hotspotSettingsError');
            const hotspotSettingsSuccess = document.getElementById('hotspotSettingsSuccess');
            const domainWhitelistTextarea = document.getElementById('domainWhitelist');
            const sessionTimeoutInput = document.getElementById('sessionTimeoutMinutes');
            if(hotspotSettingsError)hotspotSettingsError.textContent='';if(hotspotSettingsSuccess)hotspotSettingsSuccess.textContent=''; const dWA=domainWhitelistTextarea?domainWhitelistTextarea.value.split('\n').map(d=>d.trim()).filter(d=>d&&d.length>0):[]; let tV=sessionTimeoutInput?parseInt(sessionTimeoutInput.value,10):null; if(tV!==null&&(isNaN(tV)||tV<=0)){if(hotspotSettingsError)hotspotSettingsError.textContent='Timeout inválido.';return;} const sD={sessionTimeoutMinutes:tV,domainWhitelist:dWA}; const btn=hotspotSettingsForm.querySelector('button[type="submit"]'); if(btn){btn.disabled=true;btn.textContent='A guardar...';} 
            try{const r=await apiRequest('/api/settings/hotspot','POST',sD); if(hotspotSettingsSuccess)hotspotSettingsSuccess.textContent=r.message||"Salvo!"; await loadHotspotSettings();}
            catch(err){if(hotspotSettingsError)hotspotSettingsError.textContent=`Erro: ${err.message||'Falha.'}`;}
            finally{if(btn){btn.disabled=false;btn.textContent='Guardar Configurações do Hotspot';}} 
        }); }
        else { console.warn("Form 'hotspotSettingsForm' (V13.5.3) não encontrado."); }

        // --- [FUNÇÃO REMOVIDA] handlePermissionChange (não é mais necessária) ---
        // const handlePermissionChange = async (e) => { ... }


        // --- [NOVA FUNÇÃO] Handler para o botão "Salvar Alterações" ---
        const handleSavePermissions = async () => {
            console.log("handleSavePermissions: Iniciado...");
            if (permissionsError) permissionsError.textContent = '';
            if (permissionsSuccess) permissionsSuccess.style.display = 'none';

            // 1. Encontrar todas as alterações
            const changes = [];
            const checkboxes = permissionsTableBody.querySelectorAll('input[type="checkbox"]');

            checkboxes.forEach(checkbox => {
                const role_name = checkbox.dataset.role;
                const permission_key = checkbox.dataset.key;
                const currentState = checkbox.checked;
                const originalState = originalPermissions.has(`${role_name}|${permission_key}`);

                // Se o estado mudou (e não for 'master'), adiciona à lista
                if (currentState !== originalState && role_name !== 'master') {
                    changes.push({
                        role_name,
                        permission_key,
                        has_permission: currentState
                    });
                }
            });

            // 2. Se não houver alterações, apenas informa
            if (changes.length === 0) {
                console.log("handleSavePermissions: Nenhuma alteração detectada.");
                if (permissionsSuccess) {
                    permissionsSuccess.textContent = 'Nenhuma alteração detectada.';
                    permissionsSuccess.style.display = 'block';
                    if (successTimer) clearTimeout(successTimer);
                    successTimer = setTimeout(() => {
                         if (permissionsSuccess) permissionsSuccess.style.display = 'none';
                    }, 3000);
                }
                return;
            }

            // 3. Se houver alterações, envia o lote
            console.log(`handleSavePermissions: Encontradas ${changes.length} alterações. Enviando...`);
            if (savePermissionsBtn) {
                savePermissionsBtn.disabled = true;
                savePermissionsBtn.textContent = 'A guardar...';
            }

            try {
                const result = await apiRequest('/api/permissions/update-batch', 'POST', { changes });

                // Sucesso: Mostra mensagem
                if (permissionsSuccess) {
                    permissionsSuccess.textContent = result.message || 'Alterações guardadas!';
                    permissionsSuccess.style.display = 'block';
                    if (successTimer) clearTimeout(successTimer);
                    successTimer = setTimeout(() => {
                         if (permissionsSuccess) permissionsSuccess.style.display = 'none';
                    }, 3000);
                }
                
                // [CRÍTICO] Atualiza o 'originalPermissions' para o novo estado
                changes.forEach(change => {
                    const key = `${change.role_name}|${change.permission_key}`;
                    if (change.has_permission) {
                        originalPermissions.add(key);
                    } else {
                        originalPermissions.delete(key);
                    }
                });
                console.log("handleSavePermissions: Estado original atualizado.");

            } catch (error) {
                console.error("Erro ao salvar permissões em lote:", error);
                if (permissionsError) permissionsError.textContent = `Erro: ${error.message}`;
                // Nota: Não revertemos os checkboxes, o utilizador pode tentar salvar novamente.
            } finally {
                if (savePermissionsBtn) {
                    savePermissionsBtn.disabled = false;
                    savePermissionsBtn.textContent = 'Salvar Alterações';
                }
            }
        };


        // --- [ATUALIZADO V13.5.3] Fase 3.1: Lógica da Aba "Funções e Permissões" (Modo GESTÃO BATCH) ---
        const loadPermissionsMatrix = async () => {
            console.log("loadPermissionsMatrix (V13.5.3 - GESTÃO BATCH)...");
            if (!permissionsTableBody || !permissionsTableHeadRow) {
                console.error("permissionsTableBody ou HeadRow (V13.5.3) not found!");
                return false;
            }
            if (permissionsError) permissionsError.textContent = '';
            if (permissionsSuccess) permissionsSuccess.style.display = 'none';
            permissionsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">A carregar...</td></tr>';
            
            // [NOVO] Limpa o estado original
            originalPermissions = new Set();
            
            const role = window.currentUserProfile?.role;
            const isMaster = (role === 'master');
            
            // 1. Verificação de acesso (Inalterada)
            // ... (código inalterado) ...
            if (role !== 'master' && role !== 'DPO') {
                console.log("loadPermissionsMatrix (V13.5.3): Access denied.");
                permissionsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Acesso negado.</td></tr>';
                if (masterViewOnlyText) masterViewOnlyText.style.display = 'none';
                if (dpoViewOnlyText) dpoViewOnlyText.style.display = 'none';
                if (saveActionsContainer) saveActionsContainer.style.display = 'none'; // Esconde botão
                return false;
            }

            // 2. Mostrar texto de ajuda E botão Salvar
            if (isMaster) {
                if (masterViewOnlyText) masterViewOnlyText.style.display = 'inline';
                if (dpoViewOnlyText) dpoViewOnlyText.style.display = 'none';
                if (saveActionsContainer) saveActionsContainer.style.display = 'block'; // [NOVO] Mostra botão
            } else { // é DPO
                if (masterViewOnlyText) masterViewOnlyText.style.display = 'none';
                if (dpoViewOnlyText) dpoViewOnlyText.style.display = 'inline';
                if (saveActionsContainer) saveActionsContainer.style.display = 'none'; // [NOVO] Esconde botão
            }

            try {
                // 3. Buscar dados da API (Inalterado)
                console.log("loadPermissionsMatrix (V13.5.3): Buscando dados da API /api/permissions/matrix...");
                const permissionsData = await apiRequest('/api/permissions/matrix');
                
                if (!permissionsData || !permissionsData.roles || !permissionsData.permissions) {
                     throw new Error("Formato de dados (gestão) da API de permissões inválido.");
                }
                console.log("loadPermissionsMatrix (V13.5.3): Dados recebidos.", permissionsData);

                // 4. Limpa e Constrói o Cabeçalho (Thead) (Inalterado)
                permissionsTableHeadRow.innerHTML = '<th>Funcionalidade</th><th>Ação</th>';
                permissionsData.roles.forEach(roleKey => {
                    const th = document.createElement('th');
                    th.textContent = roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
                    permissionsTableHeadRow.appendChild(th);
                });
                const totalColumns = permissionsData.roles.length + 2;

                // 5. Limpa e Constrói o Corpo (Tbody) (Inalterado)
                permissionsTableBody.innerHTML = '';
                
                if (permissionsData.permissions.length === 0) {
                     permissionsTableBody.innerHTML = `<tr><td colspan="${totalColumns}" style="text-align: center;">Nenhuma permissão encontrada na base de dados.</td></tr>`;
                     return true;
                }
                
                let lastFeatureName = ""; 
                permissionsData.permissions.forEach(perm => {
                    const row = document.createElement('tr');
                    
                    const featureCell = document.createElement('td');
                    if (perm.feature_name !== lastFeatureName) {
                        featureCell.innerHTML = `<strong>${perm.feature_name}</strong>`;
                        lastFeatureName = perm.feature_name;
                        row.classList.add('feature-group-start');
                    } else {
                         featureCell.className = 'feature-group-middle';
                    }
                    row.appendChild(featureCell);

                    const actionCell = document.createElement('td');
                    actionCell.textContent = perm.action_name;
                    actionCell.title = perm.permission_key; 
                    row.appendChild(actionCell);

                    // Coluna 3+: Roles (Checkboxes ou Texto)
                    permissionsData.roles.forEach(roleKey => {
                        const cell = document.createElement('td');
                        const isChecked = perm.assigned_roles.includes(roleKey);

                        // [ATUALIZADO] Guarda o estado original
                        if (isChecked) {
                            originalPermissions.add(`${roleKey}|${perm.permission_key}`);
                        }

                        if (isMaster) {
                            // MODO MASTER (Edição) - (Lógica inalterada)
                            const label = document.createElement('label');
                            label.className = 'checkbox-container';
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.checked = isChecked;
                            checkbox.dataset.role = roleKey;
                            checkbox.dataset.key = perm.permission_key;
                            
                            if (roleKey === 'master') {
                                checkbox.disabled = true;
                                label.title = "Permissões de Master não podem ser alteradas.";
                            }
                            
                            const span = document.createElement('span');
                            span.className = 'checkmark';
                            label.appendChild(checkbox);
                            label.appendChild(span);
                            cell.appendChild(label);
                        } else {
                            // MODO DPO (Visualização) - (Lógica inalterada)
                            cell.innerHTML = isChecked ? '&#10003;' : '&mdash;'; 
                            cell.className = isChecked ? 'perm-read' : 'perm-none';
                        }
                        row.appendChild(cell);
                    });
                    permissionsTableBody.appendChild(row);
                });

                // 6. [REMOVIDO] Listener de 'change' do TBody
                // permissionsTableBody.removeEventListener('change', handlePermissionChange);
                
                return true; // Sucesso

            } catch (error) {
                console.error("Erro loadPermissionsMatrix (V13.5.3):", error);
                if (permissionsError) permissionsError.textContent = `Erro: ${error.message}`;
                const colspan = (permissionsTableHeadRow.querySelectorAll('th')?.length || 6);
                permissionsTableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: var(--error-text);">Falha ao carregar permissões da API.</td></tr>`;
                return false; // Falha
            }
        };


        // --- Função Central de Inicialização (Praticamente Inalterada) ---
        const initializeSettingsPage = async (retryCount = 0, maxRetries = 10, delay = 300) => {
             console.log(`initializeSettingsPage (V13.5.3 - Tentativa ${retryCount + 1}/${maxRetries}): Verificando perfil...`);

             if (window.currentUserProfile && window.currentUserProfile.role) {
                 const role = window.currentUserProfile.role;
                 console.log(`initializeSettingsPage (V13.5.3): Perfil OK! Role: ${role}`);
                 const isMaster = (role === 'master');
                 const isDPO = (role === 'DPO');

                 // Mostra/Esconde abas e conteúdos (Lógica V13.5.2 inalterada)
                 console.log("initializeSettingsPage (V13.5.3): Aplicando visibilidade...");
                 let firstVisibleTabId = null;
                 if (tabLinks && tabContents) {
                      tabLinks.forEach(link => {
                           const tabId=link.getAttribute('data-tab');
                           const content=document.getElementById(tabId);
                           if (!content) return; 
                           let show=true;
                           const linkClasses = link.classList;
                           if (linkClasses.contains('admin-only') && !['master','gestao','DPO'].includes(role)) { show = false; }
                           if (linkClasses.contains('master-only') && !isMaster) { show = false; }
                           if (tabId === 'tab-permissoes' && !(isMaster || isDPO)) { show = false; }
                           if (show) {
                               link.style.removeProperty('display');
                               content.style.removeProperty('display');
                               if(!firstVisibleTabId) firstVisibleTabId = tabId;
                           } else {
                               link.style.display='none';
                               content.style.display='none';
                           }
                      });
                 } else { console.error("Tabs não encontradas (V13.5.3)!"); isInitializingSettings = false; return; }
                 console.log(`initializeSettingsPage (V13.5.3): Visibilidade OK. Primeira visível: ${firstVisibleTabId}`);

                 // Carrega dados das configurações visíveis (Lógica V13.5.2 inalterada)
                 console.log("initializeSettingsPage (V13.5.3): Carregando dados...");
                 let loadPromises = [];
                 if (isMaster && generalSettingsForm && document.querySelector('.tab-link[data-tab="tab-geral"]')?.style.display !== 'none') { loadPromises.push(loadGeneralSettings()); }
                 if (isMaster && hotspotSettingsForm && document.querySelector('.tab-link[data-tab="tab-hotspot"]')?.style.display !== 'none') { loadPromises.push(loadHotspotSettings()); }
                 
                 const permTabVisible = document.querySelector('.tab-link[data-tab="tab-permissoes"]')?.style.display !== 'none';
                 if ((isMaster || isDPO) && permissionsTableBody && permTabVisible) {
                      console.log("Iniciando loadPermissionsMatrix (Gestão Batch)...");
                      loadPromises.push(loadPermissionsMatrix());
                 }

                 if (loadPromises.length > 0) { try { await Promise.all(loadPromises); } catch(loadError) { console.error("Erro load Promises (V13.5.3):", loadError); } }
                 else { console.log("Nenhum dado a carregar (V13.5.3).");}
                 console.log("initializeSettingsPage (V13.5.3): Carregamento dados OK.");

                 // Define aba ativa inicial (Lógica V13.5.2 inalterada)
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

        // --- Adiciona listeners de clique às abas (Inalterado) ---
        if (tabLinks.length > 0) { tabLinks.forEach(link => { link.removeEventListener('click', handleTabClick); link.addEventListener('click', handleTabClick); }); }
        function handleTabClick(e) { e.preventDefault(); const targetTabId = e.currentTarget.getAttribute('data-tab'); if(targetTabId) switchTab(targetTabId); else console.error("Click aba sem 'data-tab' (V13.5.3)."); }
        
        // --- [NOVO] Adiciona listener de clique ao botão Salvar ---
        if (savePermissionsBtn) {
            savePermissionsBtn.addEventListener('click', handleSavePermissions);
        } else {
            console.warn("Botão 'savePermissionsBtn' (V13.5.3) não encontrado no HTML.");
        }


        // --- Chama a inicialização ---
        initializeSettingsPage(); // Inicia a primeira tentativa

    }; // Fim de window.initSettingsPage
}

