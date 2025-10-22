// Ficheiro: routes/hotspot.js
const express = require('express');
const router = express.Router(); // Cria uma instância do router do Express
const hotspotController = require('../controllers/hotspotController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rota para pesquisar utilizadores
// [MODIFICADO] Adicionado 'estetica' para permitir acesso total ao hotspot
router.get(
    '/users',
    [authMiddleware, roleMiddleware(['master', 'gestao', 'estetica'])],
    hotspotController.searchUsers
);

// [NOVO] Rota para o card do dashboard de contagem total de utilizadores
// Permite que todos os utilizadores logados vejam esta métrica
router.get(
    '/total-users',
    [authMiddleware, roleMiddleware(['master', 'gestao', 'estetica'])],
    hotspotController.getTotalHotspotUsers
);

// Exporta o router para ser utilizado no server.js
module.exports = router;
