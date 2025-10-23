// Ficheiro: routes/admin.js
// Descrição: Define as rotas protegidas da área de administração.
// [VERSÃO ATUALIZADA - FASE 1.2 / MATRIZ V4 - Forçar troca de senha]

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

// [NOVA ROTA] Para o próprio utilizador alterar a senha (quando must_change_password = true)
router.post('/profile/change-own-password', verifyToken, adminController.changeOwnPassword);


// --- ROTA DE DASHBOARD MASTER ---
// Acede a uma área restrita apenas para a função 'master'
router.get('/dashboard-master', verifyToken, checkRole(['master']), adminController.getMasterDashboard);

// --- ROTAS DE GESTÃO DE UTILIZADORES ---

// Lista todos os utilizadores
// [ATUALIZADO] 'DPO' agora pode listar (Matriz V3)
router.get('/users', verifyToken, checkRole(['master', 'gestao', 'DPO']), adminController.getAllAdminUsers);

// Cria um novo utilizador
// [ATUALIZADO] Apenas 'master' pode criar (Matriz V3)
router.post('/users', verifyToken, checkRole(['master']), adminController.createAdminUser);

// Atualiza um utilizador por ID
// [ATUALIZADO] 'master' e 'gestao' podem atualizar (a lógica de *O QUE* eles podem atualizar está no controller)
router.put('/users/:id', verifyToken, checkRole(['master', 'gestao']), adminController.updateUser);

// Elimina um utilizador por ID (Apenas 'master')
router.delete('/users/:id', verifyToken, checkRole(['master']), adminController.deleteUser);

// [NOVA ROTA] Resetar a senha de um utilizador (Matriz V3)
router.post('/users/:id/reset-password', verifyToken, checkRole(['master', 'gestao']), adminController.resetUserPassword);


module.exports = router;

