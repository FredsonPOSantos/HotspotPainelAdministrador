// Ficheiro: routes/admin.js
// Descrição: Define as rotas protegidas da área de administração.

const express = require('express');
const router = express.Router();

// Importa os nossos middlewares de segurança
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Importa o nosso controller de administração
const adminController = require('../controllers/adminController');

// --- ROTA DE PERFIL ---
// Obtém o perfil do utilizador logado
router.get('/profile', verifyToken, adminController.getUserProfile);

// --- ROTA DE DASHBOARD MASTER ---
// Acede a uma área restrita apenas para a função 'master'
router.get('/dashboard-master', verifyToken, checkRole(['master']), adminController.getMasterDashboard);

// --- ROTAS DE GESTÃO DE UTILIZADORES ---
// Lista todos os utilizadores (só para master e gestao)
router.get('/users', verifyToken, checkRole(['master', 'gestao']), adminController.getAllAdminUsers);

// Cria um novo utilizador (só para master e gestao)
router.post('/users', verifyToken, checkRole(['master', 'gestao']), adminController.createAdminUser);

// Atualiza um utilizador por ID (só para master e gestao)
router.put('/users/:id', verifyToken, checkRole(['master', 'gestao']), adminController.updateUser);

// Elimina um utilizador por ID (só para master)
router.delete('/users/:id', verifyToken, checkRole(['master']), adminController.deleteUser);


module.exports = router;

