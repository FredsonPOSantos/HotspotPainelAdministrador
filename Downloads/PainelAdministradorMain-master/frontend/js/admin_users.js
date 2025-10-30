// Ficheiro: js/admin_users.js
// [VERSÃO ATUALIZADA - FASE 1.2 / MATRIZ V3]

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona uma "guarda" para prevenir que o script seja executado mais de uma vez.
    if (window.initUsersPage) {
        console.warn("Tentativa de carregar admin_users.js múltiplas vezes. A segunda execução foi ignorada.");
    } else {

        window.initUsersPage = () => {
            console.log("A inicializar a página de gestão de utilizadores (V3)...");

            // --- PERMISSÕES ---
            // Busca o perfil do utilizador logado, guardado globalmente pelo admin_dashboard.js
            const currentUserRole = window.currentUserProfile ? window.currentUserProfile.role : null;
            const currentUserId = window.currentUserProfile ? window.currentUserProfile.id : null;

            // --- ELEMENTOS DO DOM ---
            const addUserBtn = document.getElementById('addUserBtn');
            const tableHead = document.querySelector('#usersTable thead tr');
            const tableBody = document.querySelector('#usersTable tbody');

            // Modal Principal (Adicionar/Editar)
            const userModal = document.getElementById('userModal');
            const userModalCloseBtn = userModal.querySelector('.modal-close-btn');
            const userModalCancelBtn = document.getElementById('cancelBtn');
            const userForm = document.getElementById('userForm');
            const modalTitle = document.getElementById('modalTitle');
            const passwordGroup = document.getElementById('passwordGroup');
            const sensitiveDataGroup = userModal.querySelector('.sensitive-data-group');
            
            // Modal de Reset de Senha
            const resetPasswordModal = document.getElementById('resetPasswordModal');
            const resetModalCloseBtn = resetPasswordModal.querySelector('.modal-close-btn');
            const resetModalCancelBtn = document.getElementById('cancelResetBtn');
            const resetPasswordForm = document.getElementById('resetPasswordForm');
            const resetUserEmailSpan = document.getElementById('resetUserEmail');
            
            // --- FUNÇÕES INTERNAS DA PÁGINA ---

            // Configura a visibilidade da página com base na função
            const setupPageByRole = () => {
                if (!currentUserRole) {
                    console.error("Não foi possível determinar a função do utilizador.");
                    return;
                }

                // 1. Mostrar/Esconder botão "Adicionar Utilizador" (Apenas Master)
                if (currentUserRole === 'master') {
                    addUserBtn.style.display = 'block';
                }

                // 2. Mostrar/Esconder colunas sensíveis (Apenas Master e DPO)
                if (currentUserRole === 'master' || currentUserRole === 'DPO') {
                    document.querySelectorAll('.sensitive-data').forEach(el => {
                        el.style.display = 'table-cell'; // Mostra as colunas na tabela
                    });
                }
            };

            const loadUsers = async () => {
                tableBody.innerHTML = `<tr><td colspan="8">A carregar...</td></tr>`;
                try {
                    // A API (backend) já filtra os dados que 'gestao' pode ver
                    const users = await apiRequest('/api/admin/users');
                    tableBody.innerHTML = '';
                    
                    if (users.length === 0) {
                        tableBody.innerHTML = `<tr><td colspan="8">Nenhum utilizador encontrado.</td></tr>`;
                        return;
                    }

                    const showSensitiveData = (currentUserRole === 'master' || currentUserRole === 'DPO');

                    users.forEach(user => {
                        const row = document.createElement('tr');
                        
                        // Constrói as células da linha
                        let cells = `
                            <td>${user.id}</td>
                            <td>${user.email}</td>
                            <td><span class="badge role-${user.role}">${user.role}</span></td>
                        `;
                        
                        // Adiciona colunas sensíveis se a permissão existir
                        if (showSensitiveData) {
                            cells += `
                                <td>${user.setor || 'N/A'}</td>
                                <td>${user.matricula || 'N/A'}</td>
                                <td>${user.cpf || 'N/A'}</td>
                            `;
                        }
                        
                        cells += `
                            <td><span class="badge status-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Ativo' : 'Inativo'}</span></td>
                            <td class="action-buttons">
                                ${generateActionButtons(user)}
                            </td>
                        `;
                        
                        row.innerHTML = cells;
                        tableBody.appendChild(row);
                    });
                    
                    // Adiciona os event listeners aos novos botões
                    attachActionListeners();

                } catch (error) {
                    tableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar utilizadores.</td></tr>`;
                    console.error("Erro ao carregar utilizadores:", error);
                }
            };

            // Gera os botões de ação corretos com base na permissão
            const generateActionButtons = (user) => {
                let buttons = '';
                const userId = user.id;

                // Ninguém pode editar ou eliminar o utilizador 'master' (id 1), exceto ele mesmo (e ele não pode se auto-eliminar)
                // Ninguém pode resetar a senha do 'master' (id 1) por esta interface
                const isSelf = (user.id === currentUserId);
                const isMasterUser = (user.id === 1);

                if (currentUserRole === 'master') {
                    buttons += `<button class="btn-edit" data-user-id="${userId}">Editar</button>`;
                    if (!isMasterUser) { // Master não pode ser eliminado
                        buttons += `<button class="btn-delete" data-user-id="${userId}">Eliminar</button>`;
                        buttons += `<button class="btn-secondary" data-user-id="${userId}" data-user-email="${user.email}">Resetar Senha</button>`;
                    }
                } else if (currentUserRole === 'gestao') {
                    if (!isMasterUser) { // 'gestao' não pode editar o 'master'
                        buttons += `<button class="btn-edit" data-user-id="${userId}">Editar</button>`;
                        if (!isSelf) { // 'gestao' não pode resetar a própria senha aqui
                           buttons += `<button class="btn-secondary" data-user-id="${userId}" data-user-email="${user.email}">Resetar Senha</button>`;
                        }
                    }
                }
                // DPO não tem botões de ação
                return buttons;
            };
            
            // Adiciona os listeners de clique aos botões de ação
            const attachActionListeners = () => {
                tableBody.querySelectorAll('.btn-edit').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const userId = e.target.getAttribute('data-user-id');
                        openModalForEdit(userId);
                    });
                });
                
                tableBody.querySelectorAll('.btn-delete').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const userId = e.target.getAttribute('data-user-id');
                        handleDelete(userId);
                    });
                });
                
                tableBody.querySelectorAll('.btn-secondary').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const userId = e.target.getAttribute('data-user-id');
                        const userEmail = e.target.getAttribute('data-user-email');
                        openResetPasswordModal(userId, userEmail);
                    });
                });
            };

            // --- LÓGICA DO MODAL (ADICIONAR/EDITAR) ---

            const handleFormSubmit = async (event) => {
                event.preventDefault();
                const userId = document.getElementById('userId').value;
                
                // 'gestao' só pode enviar estes campos
                let userData = {
                email: document.getElementById('userEmail').value,
                role: document.getElementById('userRoleSelect').value,
                is_active: document.getElementById('userIsActive').checked,
                };

                // 'master' pode enviar todos os campos
                if (currentUserRole === 'master') {
                    userData.setor = document.getElementById('userSetor').value;
                    userData.matricula = document.getElementById('userMatricula').value;
                    userData.cpf = document.getElementById('userCpf').value;
                }

                const password = document.getElementById('userPassword').value;
                // Adiciona a senha apenas se for um novo utilizador ou se uma nova senha for digitada
                if (!userId || password) {
                    if (password && password.length < 6) {
                         alert("A senha deve ter pelo menos 6 caracteres.");
                         return;
                    }
                    userData.password = password;
                }

                const method = userId ? 'PUT' : 'POST';
                const endpoint = userId ? `/api/admin/users/${userId}` : '/api/admin/users';

                try {
                    // O backend (controller) já tem a lógica para impedir 'gestao' de alterar campos que não deve
                    const result = await apiRequest(endpoint, method, userData);
                    alert(result.message);
                    closeModal(userModal);
                    loadUsers(); // Recarrega a lista
                } catch (error) {
                    alert(`Erro: ${error.message}`);
                }
            };

            const handleDelete = async (userId) => {
                if (confirm(`Tem a certeza de que deseja eliminar o utilizador com ID ${userId}?`)) {
                    try {
                        const result = await apiRequest(`/api/admin/users/${userId}`, 'DELETE');
                        alert(result.message);
                        loadUsers(); // Recarrega a lista
                    } catch (error) {
                        alert(`Erro: ${error.message}`);
                    }
                }
            };

            const openModalForCreate = () => {
                userForm.reset();
                document.getElementById('userId').value = '';
                modalTitle.textContent = 'Adicionar Novo Utilizador';
                
                document.getElementById('userPassword').required = true;
                passwordGroup.style.display = 'block';
                
                // Master vê todos os campos ao criar
                sensitiveDataGroup.style.display = 'block'; 
                
                // Restringe as opções de 'role' que 'gestao' pode criar (embora 'gestao' não deva ver este botão)
                const roleSelect = document.getElementById('userRoleSelect');
                roleSelect.querySelector('option[value="master"]').disabled = (currentUserRole !== 'master');
                
                userModal.classList.remove('hidden');
            };

            const openModalForEdit = async (userId) => {
                // Precisamos buscar os dados do utilizador da API para garantir que temos os dados sensíveis (se formos master)
                try {
                     // A API /api/admin/users já nos deu a lista. Vamos encontrá-lo localmente primeiro.
                     // NOTA: 'gestao' não terá os dados sensíveis, o que é o correto.
                     const users = await apiRequest('/api/admin/users'); // Re-busca para garantir dados atualizados
                     const user = users.find(u => u.id == userId);
                     
                     if (!user) {
                        alert("Erro: Utilizador não encontrado.");
                        return;
                     }

                    userForm.reset();
                    document.getElementById('userId').value = user.id;
                    document.getElementById('userEmail').value = user.email;
                    document.getElementById('userRoleSelect').value = user.role;
                    document.getElementById('userIsActive').checked = user.is_active;
                    
                    modalTitle.textContent = 'Editar Utilizador';
                    
                    // Esconde o campo de senha por defeito na edição
                    document.getElementById('userPassword').required = false;
                    passwordGroup.style.display = 'none'; 
                    
                    const roleSelect = document.getElementById('userRoleSelect');
                    // Apenas 'master' pode ver a opção 'master'
                    roleSelect.querySelector('option[value="master"]').style.display = (currentUserRole === 'master') ? 'block' : 'none';
                    // 'gestao' não pode editar um 'master'
                    roleSelect.disabled = (currentUserRole === 'gestao' && user.role === 'master');

                    // Apenas 'master' pode ver e editar os dados sensíveis
                    if (currentUserRole === 'master') {
                        document.getElementById('userSetor').value = user.setor || '';
                        document.getElementById('userMatricula').value = user.matricula || '';
                        document.getElementById('userCpf').value = user.cpf || '';
                        sensitiveDataGroup.style.display = 'block';
                    } else {
                        sensitiveDataGroup.style.display = 'none';
                    }

                    userModal.classList.remove('hidden');
                    
                } catch (error) {
                    alert(`Erro ao buscar dados do utilizador: ${error.message}`);
                }
            };

            const closeModal = (modalElement) => {
                modalElement.classList.add('hidden');
            };
            
            // --- LÓGICA DO MODAL (RESETAR SENHA) ---
            
            const openResetPasswordModal = (userId, userEmail) => {
                resetPasswordForm.reset();
                document.getElementById('resetUserId').value = userId;
                resetUserEmailSpan.textContent = userEmail;
                resetPasswordModal.classList.remove('hidden');
            };
            
            const handleResetPasswordSubmit = async (event) => {
                event.preventDefault();
                const userId = document.getElementById('resetUserId').value;
                const newPassword = document.getElementById('newPassword').value;
                
                if (newPassword.length < 6) {
                    alert("A nova senha deve ter pelo menos 6 caracteres.");
                    return;
                }
                
                try {
                    const result = await apiRequest(`/api/admin/users/${userId}/reset-password`, 'POST', { newPassword });
                    alert(result.message);
                    closeModal(resetPasswordModal);
                } catch (error) {
                    alert(`Erro: ${error.message}`);
                }
            };

            // --- EVENT LISTENERS ---
            addUserBtn.addEventListener('click', openModalForCreate);
            userModalCloseBtn.addEventListener('click', () => closeModal(userModal));
            userModalCancelBtn.addEventListener('click', () => closeModal(userModal));
            userForm.addEventListener('submit', handleFormSubmit);
            
            resetModalCloseBtn.addEventListener('click', () => closeModal(resetPasswordModal));
            resetModalCancelBtn.addEventListener('click', () => closeModal(resetPasswordModal));
            resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
            
            // --- INICIALIZAÇÃO DA PÁGINA ---
            setupPageByRole();
            loadUsers();
        };
    }
});