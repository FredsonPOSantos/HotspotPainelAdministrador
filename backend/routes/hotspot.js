// Ficheiro: routes/hotspot.js
const express = require('express');
const router = express.Router(); // Cria uma instância do router do Express
const hotspotController = require('../controllers/hotspotController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rota para pesquisar utilizadores (protegida para master e gestao)
router.get(
    '/users',
    [authMiddleware, roleMiddleware(['master', 'gestao'])],
    hotspotController.searchUsers
);

// Exporta o router para ser utilizado no server.js
module.exports = router;

