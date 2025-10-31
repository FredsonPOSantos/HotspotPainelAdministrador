if (window.initCampaignsPage) {
    console.warn("Tentativa de carregar admin_campaigns.js múltiplas vezes. A segunda execução foi ignorada.");
} else {
    window.initCampaignsPage = () => {
        console.log("A inicializar a página de gestão de Campanhas...");

        // --- ELEMENTOS DO DOM ---
        const addCampaignBtn = document.getElementById('addCampaignBtn');
        const modal = document.getElementById('campaignModal');
        const closeBtn = modal.querySelector('.modal-close-btn');
        const cancelBtn = document.getElementById('cancelBtn');
        const campaignForm = document.getElementById('campaignForm');
        const modalTitle = document.getElementById('modalTitle');
        const tableBody = document.querySelector('#campaignsTable tbody');
        const templateSelect = document.getElementById('campaignTemplateId'); // Novo select

        // --- FUNÇÕES DA PÁGINA ---

        const loadTemplatesIntoSelect = async () => {
            try {
                const templates = await apiRequest('/api/templates');
                templateSelect.innerHTML = '<option value="">Selecione um Template</option>';
                templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = `${template.name} (ID: ${template.id})`;
                    templateSelect.appendChild(option);
                });
            } catch (error) {
                console.error("Erro ao carregar templates para o select:", error);
            }
        };

        const loadCampaigns = async () => {
            tableBody.innerHTML = '<tr><td colspan="6">A carregar...</td></tr>';
            try {
                const campaigns = await apiRequest('/api/campaigns');
                tableBody.innerHTML = '';
                if (campaigns.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="6">Nenhuma campanha encontrada.</td></tr>';
                    return;
                }
                campaigns.forEach(campaign => {
                    const row = document.createElement('tr');
                    // Ajustado para mostrar as novas colunas
                    row.innerHTML = `
                        <td>${campaign.id}</td>
                        <td>${campaign.name}</td>
                        <td>${campaign.template_name || 'N/A'}</td>
                        <td>${campaign.target_type}</td>
                        <td><span class="badge status-${campaign.is_active ? 'active' : 'inactive'}">${campaign.is_active ? 'Ativa' : 'Inativa'}</span></td>
                        <td class="action-buttons">
                            <button class="btn-edit">Editar</button>
                            <button class="btn-delete">Eliminar</button>
                        </td>
                    `;
                    row.querySelector('.btn-edit').addEventListener('click', () => openModalForEdit(campaign));
                    row.querySelector('.btn-delete').addEventListener('click', () => handleDelete(campaign.id, campaign.name));
                    tableBody.appendChild(row);
                });
            } catch (error) {
                tableBody.innerHTML = `<tr><td colspan="6">Erro ao carregar campanhas.</td></tr>`;
                console.error("Erro ao carregar campanhas:", error);
            }
        };

        const handleFormSubmit = async (event) => {
            event.preventDefault();
            const campaignId = document.getElementById('campaignId').value;
            // Atualizado para corresponder aos campos do backend
            const campaignData = {
                name: document.getElementById('campaignName').value,
                template_id: document.getElementById('campaignTemplateId').value,
                target_type: document.getElementById('campaignTargetType').value,
                target_id: document.getElementById('campaignTargetId').value || null,
                start_date: document.getElementById('campaignStartDate').value,
                end_date: document.getElementById('campaignEndDate').value,
                is_active: document.getElementById('campaignIsActive').checked,
            };
            
            const method = campaignId ? 'PUT' : 'POST';
            const endpoint = campaignId ? `/api/campaigns/${campaignId}` : '/api/campaigns';

            try {
                showNotification(result.message, 'success');
                closeModal();
                loadCampaigns();
            } catch (error) {
                showNotification(`Erro: ${error.message}`, 'error');
            }
        };

        const handleDelete = async (campaignId, campaignName) => {
            const confirmed = await showConfirmationModal(`Tem a certeza de que deseja eliminar a campanha "${campaignName}" (ID: ${campaignId})?`);
            if (confirmed) {
                try {
                    const result = await apiRequest(`/api/campaigns/${campaignId}`, 'DELETE');
                    showNotification(result.message, 'success');
                    loadCampaigns();
                } catch (error) {
                    showNotification(`Erro: ${error.message}`, 'error');
                }
            }
        };

        const openModalForCreate = () => {
            campaignForm.reset();
            document.getElementById('campaignId').value = '';
            modalTitle.textContent = 'Adicionar Nova Campanha';
            loadTemplatesIntoSelect();
            modal.classList.remove('hidden');
        };

        const openModalForEdit = (campaign) => {
            campaignForm.reset();
            document.getElementById('campaignId').value = campaign.id;
            document.getElementById('campaignName').value = campaign.name;
            document.getElementById('campaignTargetType').value = campaign.target_type;
            document.getElementById('campaignTargetId').value = campaign.target_id || '';
            // Formata as datas para o formato yyyy-mm-dd
            document.getElementById('campaignStartDate').value = new Date(campaign.start_date).toISOString().split('T')[0];
            document.getElementById('campaignEndDate').value = new Date(campaign.end_date).toISOString().split('T')[0];
            document.getElementById('campaignIsActive').checked = campaign.is_active;
            modalTitle.textContent = 'Editar Campanha';
            
            loadTemplatesIntoSelect().then(() => {
                document.getElementById('campaignTemplateId').value = campaign.template_id;
            });
            modal.classList.remove('hidden');
        };

        const closeModal = () => modal.classList.add('hidden');

        // --- EVENT LISTENERS ---
        addCampaignBtn.addEventListener('click', openModalForCreate);
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        campaignForm.addEventListener('submit', handleFormSubmit);

        // --- INICIALIZAÇÃO ---
        loadCampaigns();
    };
}

