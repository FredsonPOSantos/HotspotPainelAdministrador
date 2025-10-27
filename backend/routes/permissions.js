// Ficheiro: backend/routes/permissions.js
// Descrição: Define as rotas para a gestão de funções e permissões.
// [ATUALIZADO - Fase 3.1 GESTÃO]

const express = require('express');
const router = express.Router();

// --- Middlewares ---
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// --- Controller ---
const permissionsController = require('../controllers/permissionsController');

// --- ROTA PARA OBTER A MATRIZ DE PERMISSÕES ---
// GET /api/permissions/matrix
// Acessível por 'master' (para ver e editar) e 'DPO' (apenas para ver/auditar)
router.get(
    '/matrix',
    verifyToken, // Garante que o utilizador está logado
    checkRole(['master', 'DPO']), // Permite apenas master e DPO acederem
    permissionsController.getPermissionsMatrix // Chama a função do controller
);

// --- [NOVA ROTA] ROTA PARA ATUALIZAR UMA PERMISSÃO ---
// POST /api/permissions/update
// Acessível APENAS por 'master'
router.post(
    '/update',
    verifyToken,
    checkRole(['master']), // Apenas master pode editar
    permissionsController.updatePermission // Nova função no controller
);

module.exports = router;
