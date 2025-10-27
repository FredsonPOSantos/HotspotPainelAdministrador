// Ficheiro: backend/controllers/permissionsController.js
// [ATUALIZADO - Fase 3.1 GESTÃO BATCH]
// Descrição: Lida com a lógica para buscar e GERIR permissões (em lote).

const pool = require('../connection');

/**
 * [Inalterado] Busca e formata os dados para a Matriz de Permissões (Modo Edição).
 * Retorna um JSON no formato:
 * {
 * roles: ['master', 'gestao', ...],
 * permissions: [ { ... } ]
 * }
 */
const getPermissionsMatrix = async (req, res) => {
    console.log("getPermissionsMatrix (Modo Gestão): Buscando dados...");
    try {
        // 1. Buscar todas as roles ordenadas (as colunas)
        // ... (código inalterado) ...
        const rolesResult = await pool.query('SELECT role_name FROM roles ORDER BY role_name');
        const roles = rolesResult.rows.map(r => r.role_name);
        console.log("Roles encontradas:", roles);

        // 2. Buscar todas as permissões possíveis (as linhas)
        // ... (código inalterado) ...
        const permissionsResult = await pool.query(`
            SELECT permission_key, feature_name, action_name
            FROM permissions
            ORDER BY feature_name, action_name
        `);
        const allPermissions = permissionsResult.rows;
        console.log(`Total de ${allPermissions.length} permissões (linhas) encontradas.`);

        // 3. Buscar todas as associações (os "checks")
        // ... (código inalterado) ...
        const assignmentsResult = await pool.query('SELECT role_name, permission_key FROM role_permissions');
        const assignmentsSet = new Set(
            assignmentsResult.rows.map(rp => `${rp.role_name}|${rp.permission_key}`)
        );
        console.log(`Total de ${assignmentsSet.size} associações (checks) encontradas.`);

        // 4. Montar a estrutura final
        // ... (código inalterado) ...
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
        // ... (código inalterado) ...
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
 * [FUNÇÃO ATUALIZADA] Adiciona ou remove permissões em LOTE (Batch).
 * Espera body: {
 * changes: [
 * { role_name: 'estetica', permission_key: 'routers.read', has_permission: true },
 * { role_name: 'gestao', permission_key: 'banners.delete', has_permission: false }
 * ]
 * }
 */
const updatePermissionsBatch = async (req, res) => {
    const { changes } = req.body;

    // Validação
    if (!changes || !Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ message: "Dados inválidos (um array 'changes' é obrigatório)." });
    }

    // Inicia uma transação com o cliente do pool
    const client = await pool.connect();
    console.log(`updatePermissionsBatch: Iniciando transação para ${changes.length} alterações.`);

    try {
        // Inicia a transação
        await client.query('BEGIN');

        // Itera por todas as alterações e executa as queries
        for (const change of changes) {
            const { role_name, permission_key, has_permission } = change;

            // Validação de segurança
            if (!role_name || !permission_key || has_permission === undefined) {
                // Se algum item do array for inválido, aborta a transação
                throw new Error(`Item inválido no lote: ${JSON.stringify(change)}`);
            }

            // Segurança: Master não pode ter suas permissões removidas/alteradas
            if (role_name === 'master') {
                console.warn(`Tentativa de alterar permissão do 'master' (ignorado): ${permission_key}`);
                // Apenas ignora esta alteração e continua o loop
                continue;
            }

            if (has_permission) {
                // Adiciona a permissão (ignora se já existir)
                const query = `
                    INSERT INTO role_permissions (role_name, permission_key)
                    VALUES ($1, $2)
                    ON CONFLICT (role_name, permission_key) DO NOTHING
                `;
                await client.query(query, [role_name, permission_key]);
            } else {
                // Remove a permissão
                const query = `
                    DELETE FROM role_permissions
                    WHERE role_name = $1 AND permission_key = $2
                `;
                await client.query(query, [role_name, permission_key]);
            }
        }

        // Se tudo correu bem, comita a transação
        await client.query('COMMIT');
        console.log("updatePermissionsBatch: Transação concluída com sucesso (COMMIT).");
        res.status(200).json({ message: `Alterações (${changes.length}) guardadas com sucesso!` });

    } catch (error) {
        // Se algo deu errado, faz rollback de TODAS as alterações
        await client.query('ROLLBACK');
        console.error('Erro na transação de permissões (ROLLBACK):', error);
        res.status(500).json({ message: `Erro ao processar alterações: ${error.message}` });
    } finally {
        // Libera o cliente de volta para o pool
        client.release();
    }
};


module.exports = {
    getPermissionsMatrix,
    updatePermissionsBatch // [ATUALIZADO] Exporta a nova função de lote
};

