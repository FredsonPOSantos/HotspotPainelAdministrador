// Ficheiro: routes/routers.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const routerController = require('../controllers/routerController');

// --- ROTAS DE ROTEADORES INDIVIDUAIS ---
router.get('/', verifyToken, checkRole(['master', 'gestao']), routerController.getAllRouters);
router.put('/:id', verifyToken, checkRole(['master', 'gestao']), routerController.updateRouter);
router.delete('/:id', verifyToken, checkRole(['master']), routerController.deleteRouter);

// --- ROTA DE VERIFICAÇÃO DE STATUS ---
router.post('/:id/ping', verifyToken, checkRole(['master', 'gestao']), routerController.checkRouterStatus);

// --- ROTAS DE DETEÇÃO AUTOMÁTICA ---
router.get('/discover', verifyToken, checkRole(['master', 'gestao']), routerController.discoverNewRouters);
router.post('/batch-add', verifyToken, checkRole(['master', 'gestao']), routerController.batchAddRouters);

// --- ROTAS DE GRUPOS DE ROTEADORES ---
router.get('/groups', verifyToken, checkRole(['master', 'gestao']), routerController.getAllRouterGroups);
router.post('/groups', verifyToken, checkRole(['master', 'gestao']), routerController.createRouterGroup);
router.put('/groups/:id', verifyToken, checkRole(['master', 'gestao']), routerController.updateRouterGroup);
router.delete('/groups/:id', verifyToken, checkRole(['master']), routerController.deleteRouterGroup);

module.exports = router;

