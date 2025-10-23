// Ficheiro: frontend/js/admin_settings.js
// Script para a Fase 2.1 - Página de Configurações

if (window.initSettingsPage) {
    console.warn("Tentativa de carregar admin_settings.js múltiplas vezes.");
} else {
    window.initSettingsPage = () => {
        console.log("A inicializar a página de Configurações...");

        const tabLinks = document.querySelectorAll('.tab-nav .tab-link');
        const tabContents = document.querySelectorAll('.tab-content-container .tab-content');

        // Função para mudar de aba
        const switchTab = (targetTabId) => {
            // Esconde todos os conteúdos
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            // Remove a classe 'active' de todos os links
            tabLinks.forEach(link => {
                link.classList.remove('active');
            });

            // Mostra o conteúdo da aba alvo
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Ativa o link da aba alvo
            const targetLink = document.querySelector(`.tab-link[data-tab="${targetTabId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        };

        // Adiciona os listeners de clique aos links das abas
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const targetTabId = link.getAttribute('data-tab');
                switchTab(targetTabId);
            });
        });

        // (Fase 2.2 e adiante)
        // A lógica para carregar o formulário de "Meu Perfil"
        // e as outras configurações de admin (Geral, Hotspot, etc.)
        // será adicionada aqui nas próximas fases.
        
        // Aplica a lógica de permissão (admin-only)
        // Esta lógica é duplicada do admin_dashboard.js para garantir
        // que as abas corretas sejam mostradas mesmo se o perfil carregar lentamente.
        if (window.currentUserProfile) {
            const role = window.currentUserProfile.role;
            if (role === 'master' || role === 'gestao' || role === 'DPO') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'block'; // 'block' ou 'flex' dependendo do seu CSS
                });
            }
        } else {
            console.warn("Perfil do utilizador não disponível em initSettingsPage.");
        }
    };
}
