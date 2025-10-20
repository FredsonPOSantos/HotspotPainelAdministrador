// Ficheiro: js/admin_hotspot.js
if (window.initHotspotPage) {
    console.warn("Tentativa de carregar admin_hotspot.js múltiplas vezes.");
} else {
    window.initHotspotPage = () => {
        console.log("A inicializar a página de Relatórios do Hotspot...");

        // --- ELEMENTOS DO DOM ---
        const filterForm = document.getElementById('hotspotFilterForm');
        const resultsTable = document.getElementById('hotspotResultsTable');
        const resultsBody = resultsTable.querySelector('tbody');
        const totalCountSpan = document.getElementById('totalUsersCount');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportXlsxBtn = document.getElementById('exportXlsxBtn');

        let currentResults = []; // Armazena os resultados da última pesquisa

        // --- FUNÇÕES DE INICIALIZAÇÃO ---

        const populateFilters = async () => {
            try {
                const [routers, groups, campaigns] = await Promise.all([
                    apiRequest('/api/routers'),
                    apiRequest('/api/routers/groups'),
                    apiRequest('/api/campaigns')
                ]);

                const routerSelect = document.getElementById('routerFilter');
                routers.forEach(r => {
                    routerSelect.innerHTML += `<option value="${r.id}">${r.name}</option>`;
                });

                const groupSelect = document.getElementById('groupFilter');
                groups.forEach(g => {
                    groupSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`;
                });

                const campaignSelect = document.getElementById('campaignFilter');
                campaigns.forEach(c => {
                    campaignSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
                });

            } catch (error) {
                console.error("Erro ao popular filtros:", error);
                alert("Não foi possível carregar os filtros. Tente recarregar a página.");
            }
        };

        // --- FUNÇÕES DE LÓGICA ---

        const handleSearch = async (event) => {
            event.preventDefault();
            const formData = new FormData(filterForm);
            const params = new URLSearchParams();

            // Mapeia os IDs do formulário para os nomes dos parâmetros da API
            const fieldMapping = {
                'startDate': 'startDate', 'endDate': 'endDate',
                'lastLoginStart': 'lastLoginStart', 'lastLoginEnd': 'lastLoginEnd',
                'routerFilter': 'routerId', 'groupFilter': 'groupId',
                'campaignFilter': 'campaignId'
            };

            for (const fieldId in fieldMapping) {
                const value = document.getElementById(fieldId).value;
                if (value) {
                    params.append(fieldMapping[fieldId], value);
                }
            }

            resultsBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">A pesquisar...</td></tr>`;

            try {
                const results = await apiRequest(`/api/hotspot/users?${params.toString()}`);
                currentResults = results; // Guarda os resultados para exportação
                displayResults(results);
            } catch (error) {
                console.error("Erro na pesquisa:", error);
                resultsBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Erro ao realizar a pesquisa.</td></tr>`;
            }
        };

        const displayResults = (results) => {
            resultsBody.innerHTML = '';
            totalCountSpan.textContent = results.length;

            if (results.length === 0) {
                resultsBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Nenhum resultado encontrado.</td></tr>`;
                resultsTable.querySelector('thead').innerHTML = ''; // Limpa cabeçalhos
                return;
            }

            // Cria os cabeçalhos da tabela dinamicamente a partir do primeiro resultado
            const headers = Object.keys(results[0]);
            const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
            resultsTable.querySelector('thead').innerHTML = headerRow;
            
            // Preenche as linhas da tabela
            results.forEach(user => {
                const row = document.createElement('tr');
                headers.forEach(header => {
                    const cell = document.createElement('td');
                    cell.textContent = user[header] === null ? 'N/A' : user[header];
                    row.appendChild(cell);
                });
                resultsBody.appendChild(row);
            });
        };

        // --- FUNÇÕES DE EXPORTAÇÃO ---

        const exportToCSV = () => {
            if (currentResults.length === 0) {
                alert("Não há dados para exportar.");
                return;
            }
            const headers = Object.keys(currentResults[0]);
            const csvRows = [
                headers.join(','),
                ...currentResults.map(row => 
                    headers.map(header => JSON.stringify(row[header], (key, value) => value === null ? '' : value)).join(',')
                )
            ];
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', 'relatorio_hotspot.csv');
            a.click();
        };
        
        const exportToXLSX = () => {
             if (currentResults.length === 0) {
                alert("Não há dados para exportar.");
                return;
            }
            // A biblioteca SheetJS (xlsx) deve estar carregada no HTML principal
            if(typeof XLSX === 'undefined') {
                alert("Erro: A biblioteca de exportação para Excel não foi carregada.");
                return;
            }
            const worksheet = XLSX.utils.json_to_sheet(currentResults);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Utilizadores");
            XLSX.writeFile(workbook, "relatorio_hotspot.xlsx");
        };


        // --- EVENT LISTENERS ---
        filterForm.addEventListener('submit', handleSearch);
        clearFiltersBtn.addEventListener('click', () => {
            filterForm.reset();
            currentResults = [];
            displayResults([]);
        });
        exportCsvBtn.addEventListener('click', exportToCSV);
        exportXlsxBtn.addEventListener('click', exportToXLSX);

        // --- INICIALIZAÇÃO ---
        populateFilters();
    };
}
