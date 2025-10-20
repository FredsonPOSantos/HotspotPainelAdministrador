// Adiciona uma "guarda" para prevenir que o script seja executado mais de uma vez.
if (window.initUsersPage) {
    console.warn("Tentativa de carregar admin_users.js múltiplas vezes. A segunda execução foi ignorada.");
} else {

    /**
     * Define a função no objeto global 'window' para que a guarda funcione
     * e a função seja acessível por outros scripts.
     */
    window.initUsersPage = () => {
        console.log("A inicializar a página de gestão de utilizadores...");

        // --- ELEMENTOS DO DOM ---
        const addUserBtn = document.getElementById('addUserBtn');
        const modal = document.getElementById('userModal');
        const closeBtn = modal.querySelector('.modal-close-btn');
        const cancelBtn = document.getElementById('cancelBtn');
        const userForm = document.getElementById('userForm');
        const modalTitle = document.getElementById('modalTitle');
        const passwordGroup = document.getElementById('passwordGroup');
        const tableBody = document.querySelector('#usersTable tbody');

        // --- FUNÇÕES INTERNAS DA PÁGINA (ENCAPSULADAS) ---

        const loadUsers = async () => {
            tableBody.innerHTML = '<tr><td colspan="5">A carregar...</td></tr>';
            try {
                const users = await apiRequest('/api/admin/users');
                tableBody.innerHTML = '';
                if (users.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5">Nenhum utilizador encontrado.</td></tr>';
                    return;
                }
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.email}</td>
                        <td><span class="badge role-${user.role}">${user.role}</span></td>
                        <td><span class="badge status-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Ativo' : 'Inativo'}</span></td>
                        <td class="action-buttons">
                            <button class="btn-edit" data-user-id="${user.id}">Editar</button>
                            ${user.id !== 1 ? `<button class="btn-delete" data-user-id="${user.id}">Eliminar</button>` : ''}
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
                // Adiciona os event listeners após a criação dos botões
                document.querySelectorAll('.btn-edit').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const userId = e.target.getAttribute('data-user-id');
                        const userToEdit = users.find(u => u.id == userId);
                        openModalForEdit(userToEdit);
                    });
                });
                document.querySelectorAll('.btn-delete').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const userId = e.target.getAttribute('data-user-id');
                        if (confirm(`Tem a certeza de que deseja eliminar o utilizador com ID ${userId}?`)) {
                            handleDelete(userId);
                        }
                    });
                });
            } catch (error) {
                tableBody.innerHTML = `<tr><td colspan="5">Erro ao carregar utilizadores.</td></tr>`;
                console.error("Erro ao carregar utilizadores:", error);
            }
        };

        const handleFormSubmit = async (event) => {
            event.preventDefault();
            const userId = document.getElementById('userId').value;
            const userData = {
                email: document.getElementById('userEmail').value,
                role: document.getElementById('userRole').value,
                is_active: document.getElementById('userIsActive').checked,
            };
            const password = document.getElementById('userPassword').value;
            // Adiciona a senha apenas se for um novo utilizador ou se uma nova senha for digitada
            if (!userId || password) {
                userData.password = password;
            }
            const method = userId ? 'PUT' : 'POST';
            const endpoint = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
            try {
                const result = await apiRequest(endpoint, method, userData);
                alert(result.message);
                closeModal();
                loadUsers(); // Recarrega a lista
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        };

        const handleDelete = async (userId) => {
            try {
                const result = await apiRequest(`/api/admin/users/${userId}`, 'DELETE');
                alert(result.message);
                loadUsers(); // Recarrega a lista
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        };

        const openModalForCreate = () => {
            userForm.reset();
            document.getElementById('userId').value = '';
            modalTitle.textContent = 'Adicionar Novo Utilizador';
            passwordGroup.style.display = 'block';
            document.getElementById('userPassword').required = true;
            modal.classList.remove('hidden');
        };

        const openModalForEdit = (user) => {
            userForm.reset();
            document.getElementById('userId').value = user.id;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userIsActive').checked = user.is_active;
            modalTitle.textContent = 'Editar Utilizador';
            passwordGroup.style.display = 'none'; // Esconde o campo de senha por defeito na edição
            document.getElementById('userPassword').required = false;
            modal.classList.remove('hidden');
        };

        const closeModal = () => modal.classList.add('hidden');

        // --- EVENT LISTENERS ---
        addUserBtn.addEventListener('click', openModalForCreate);
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        userForm.addEventListener('submit', handleFormSubmit);
        
        // --- INICIALIZAÇÃO DA PÁGINA ---
        loadUsers();
    };
}
