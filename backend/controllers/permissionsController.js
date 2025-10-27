// Ficheiro: backend/controllers/permissionsController.js
// [CORRIGIDO - Fase 3.1]
// Descrição: Lida com a lógica para buscar permissões reais do banco de dados.

const pool = require('../connection');

/**
 * Busca e formata os dados para a Matriz de Permissões.
 * Retorna um JSON no formato:
 * {
 * roles: ['master', 'gestao', ...],
 * features: {
 * 'Nome da Funcionalidade': {
 * 'master': ['Ação 1', 'Ação 2'],
 * 'gestao': ['Ação 1']
 * },
 * ...
 * }
 * }
 */
const getPermissionsMatrix = async (req, res) => {
    console.log("getPermissionsMatrix (Corrigido): Buscando dados reais...");
    try {
        // 1. Buscar todas as roles ordenadas
        const rolesResult = await pool.query('SELECT role_name FROM roles ORDER BY role_name');
        const roles = rolesResult.rows.map(r => r.role_name);
        console.log("Roles encontradas:", roles);

        // 2. Buscar todas as associações de permissão (permission -> role)
        // Usamos a tabela 'permissions' para obter os nomes amigáveis (feature_name, action_name)
        // e 'role_permissions' para ligar à role.
        const permissionsQuery = `
            SELECT
                p.feature_name,
                p.action_name,
                rp.role_name
            FROM
                permissions p
            JOIN
                role_permissions rp ON p.permission_key = rp.permission_key
            ORDER BY
                p.feature_name, rp.role_name, p.action_name;
        `;
        const permissionsResult = await pool.query(permissionsQuery);
        const allRolePerms = permissionsResult.rows;
        console.log(`Total de ${allRolePerms.length} associações encontradas.`);

        // 3. Montar a estrutura de 'features' (agrupada)
        const features = {};

        allRolePerms.forEach(perm => {
            const { feature_name, action_name, role_name } = perm;

            // Garante que a funcionalidade (feature) existe no objeto
            if (!features[feature_name]) {
                features[feature_name] = {};
            }
            // Garante que a role existe dentro da funcionalidade
            if (!features[feature_name][role_name]) {
                features[feature_name][role_name] = [];
            }

            // Adiciona a ação (ex: 'Criar', 'Ler') à lista dessa role para essa funcionalidade
            features[feature_name][role_name].push(action_name);
        });

        // 4. Montar a resposta final
        const matrix = {
            roles: roles,
            features: features
            // 'features' agora contém os dados agrupados que o frontend precisa
        };

        console.log("Matriz de permissões (real) montada.");
        res.json(matrix);

    } catch (error) {
        console.error('Erro ao buscar matriz de permissões (Corrigido):', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar permissões.' });
    }
};

// Não precisamos mais de dados mock aqui

module.exports = {
    getPermissionsMatrix,
};
