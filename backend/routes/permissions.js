// Ficheiro: backend/routes/permissions.js
// Descrição: Define as rotas para a gestão de funções e permissões.

const express = require('express');
const router = express.Router();

// --- Middlewares ---
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// --- Controller ---
const permissionsController = require('../controllers/permissionsController');

// --- ROTA PARA OBTER A MATRIZ DE PERMISSÕES ---
// GET /api/permissions/matrix
// Acessível por 'master' (para ver e futuramente editar) e 'DPO' (apenas para ver/auditar)
router.get(
    '/matrix',
    verifyToken, // Garante que o utilizador está logado
    checkRole(['master', 'DPO']), // Permite apenas master e DPO acederem
    permissionsController.getPermissionsMatrix // Chama a função do controller
);

// --- ROTAS FUTURAS PARA EDIÇÃO (Apenas Master) ---
// Exemplo: POST /api/permissions/role/:roleName
/*
router.post(
    '/role/:roleName',
    verifyToken,
    checkRole(['master']), // Apenas master pode editar
    permissionsController.updateRolePermissions // Função a ser criada no controller
);
*/

module.exports = router;
