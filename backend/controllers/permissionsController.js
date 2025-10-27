// Ficheiro: backend/controllers/permissionsController.js
// [ATUALIZADO - Fase 3.1 GESTÃO]
// Descrição: Lida com a lógica para buscar e GERIR permissões reais.

const pool = require('../connection');

/**
 * [ATUALIZADO] Busca e formata os dados para a Matriz de Permissões (Modo Edição).
 * Retorna um JSON no formato:
 * {
 * roles: ['master', 'gestao', ...],
 * permissions: [
 * {
 * permission_key: 'feature.action',
 * feature_name: 'Nome da Funcionalidade',
 * action_name: 'Ação',
 * assigned_roles: ['master', 'gestao'] // Lista de roles que POSSUEM esta permissão
 * },
 * ...
 * ]
 * }
 */
const getPermissionsMatrix = async (req, res) => {
    console.log("getPermissionsMatrix (Modo Gestão): Buscando dados...");
    try {
        // 1. Buscar todas as roles ordenadas (as colunas)
        const rolesResult = await pool.query('SELECT role_name FROM roles ORDER BY role_name');
        const roles = rolesResult.rows.map(r => r.role_name);
        console.log("Roles encontradas:", roles);

        // 2. Buscar todas as permissões possíveis (as linhas)
        const permissionsResult = await pool.query(`
            SELECT permission_key, feature_name, action_name
            FROM permissions
            ORDER BY feature_name, action_name
        `);
        const allPermissions = permissionsResult.rows;
        console.log(`Total de ${allPermissions.length} permissões (linhas) encontradas.`);

        // 3. Buscar todas as associações (os "checks")
        const assignmentsResult = await pool.query('SELECT role_name, permission_key FROM role_permissions');
        // Cria um Set para consulta rápida: 'rolename|permissionkey'
        const assignmentsSet = new Set(
            assignmentsResult.rows.map(rp => `${rp.role_name}|${rp.permission_key}`)
        );
        console.log(`Total de ${assignmentsSet.size} associações (checks) encontradas.`);

        // 4. Montar a estrutura final
        // Para cada permissão, verifica quais roles a possuem
        const permissions = allPermissions.map(perm => {
            const assigned_roles = roles.filter(roleName =>
                assignmentsSet.has(`${roleName}|${perm.permission_key}`)
            );
            return {
                permission_key: perm.permission_key,
                feature_name: perm.feature_name,
                action_name: perm.action_name,
                assigned_roles: assigned_roles
            };
        });

        // 5. Montar a resposta final
        const matrix = {
            roles: roles,
            permissions: permissions
        };

        console.log("Matriz de permissões (Modo Gestão) montada.");
        res.json(matrix);

    } catch (error) {
        console.error('Erro ao buscar matriz de permissões (Modo Gestão):', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar permissões.' });
    }
};

/**
 * [NOVA FUNÇÃO] Adiciona ou remove uma permissão de uma role.
 * Espera body: { role_name: 'estetica', permission_key: 'routers.read', has_permission: true }
 */
const updatePermission = async (req, res) => {
    const { role_name, permission_key, has_permission } = req.body;

    // Validação
    if (!role_name || !permission_key || has_permission === undefined) {
        return res.status(400).json({ message: "Dados inválidos (role_name, permission_key, has_permission são obrigatórios)." });
    }
    
    // Segurança: Master não pode ter suas permissões removidas
    if (role_name === 'master') {
         return res.status(403).json({ message: "Não é permitido alterar as permissões da função 'master'." });
    }

    console.log(`updatePermission: Role '${role_name}', Key '${permission_key}', HasPerm: ${has_permission}`);

    try {
        if (has_permission) {
            // Adiciona a permissão (ignora se já existir)
            const query = `
                INSERT INTO role_permissions (role_name, permission_key)
                VALUES ($1, $2)
                ON CONFLICT (role_name, permission_key) DO NOTHING
            `;
            await pool.query(query, [role_name, permission_key]);
        } else {
            // Remove a permissão
            const query = `
                DELETE FROM role_permissions
                WHERE role_name = $1 AND permission_key = $2
            `;
            await pool.query(query, [role_name, permission_key]);
        }
        
        // [TODO Opcional] Adicionar log de auditoria aqui (Fase 3.2)
        
        res.status(200).json({ message: "Permissão atualizada com sucesso!" });

    } catch (error) {
        // Trata erros (ex: foreign key, etc.)
        console.error('Erro ao atualizar permissão:', error);
        if (error.code === '23503') { // Foreign key violation
             return res.status(404).json({ message: "Role ou Permissão não encontrada." });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar permissão.' });
    }
};


module.exports = {
    getPermissionsMatrix,
    updatePermission // [NOVO] Exporta a nova função
};

