// Ficheiro: js/admin_home.js
if (window.initHomePage) {
    console.warn("Tentativa de carregar admin_home.js múltiplas vezes. A segunda execução foi ignorada.");
} else {
    window.initHomePage = () => {
        console.log("A inicializar a página principal do Dashboard...");

        const fetchDashboardData = async () => {
            try {
                // Busca todos os dados em paralelo para maior eficiência
                const [routers, groups, campaigns, banners] = await Promise.all([
                    apiRequest('/api/routers'),
                    apiRequest('/api/routers/groups'),
                    apiRequest('/api/campaigns'),
                    apiRequest('/api/banners')
                ]);

                // Atualiza os cartões com os dados recebidos
                document.getElementById('totalRouters').textContent = routers.length;
                document.getElementById('totalGroups').textContent = groups.length;
                document.getElementById('totalBanners').textContent = banners.length;

                // Filtra para contar apenas as campanhas ativas
                const activeCampaignsCount = campaigns.filter(c => c.is_active).length;
                document.getElementById('activeCampaigns').textContent = activeCampaignsCount;

            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
                // Define um valor de erro nos cartões se a API falhar
                document.querySelectorAll('.stat-card-value').forEach(el => {
                    el.textContent = 'Erro';
                });
            }
        };
        
        // Adiciona funcionalidade aos botões de atalho rápido
        // Esta função procura por uma função global loadPage que está em admin_dashboard.js
        document.querySelectorAll('.quick-link-btn').forEach(button => {
            button.addEventListener('click', () => {
                const page = button.getAttribute('data-page');
                const correspondingNavLink = document.querySelector(`.nav-item[data-page="${page}"]`);
                if (window.loadPageExternal && correspondingNavLink) {
                    window.loadPageExternal(page, correspondingNavLink);
                }
            });
        });

        fetchDashboardData();
    };
}
