// Ficheiro: backend/routes/permissions.js
// Descrição: Define as rotas para a gestão de funções e permissões.
// [ATUALIZADO - Fase 3.1 GESTÃO BATCH]

const express = require('express');
const router = express.Router();

// --- Middlewares ---
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// --- Controller ---
const permissionsController = require('../controllers/permissionsController');

// --- ROTA PARA OBTER A MATRIZ DE PERMISSÕES ---
// GET /api/permissions/matrix
// (Inalterado)
router.get(
    '/matrix',
    verifyToken, // Garante que o utilizador está logado
    checkRole(['master', 'DPO']), // Permite apenas master e DPO acederem
    permissionsController.getPermissionsMatrix // Chama a função do controller
);

// --- [ROTA ATUALIZADA] ROTA PARA ATUALIZAR PERMISSÕES EM LOTE ---
// POST /api/permissions/update-batch
// Acessível APENAS por 'master'
router.post(
    '/update-batch', // Rota alterada para refletir a ação em lote
    verifyToken,
    checkRole(['master']), // Apenas master pode editar
    permissionsController.updatePermissionsBatch // Nova função no controller
);

module.exports = router;

