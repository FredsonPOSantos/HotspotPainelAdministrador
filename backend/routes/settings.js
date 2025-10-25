// Ficheiro: backend/routes/settings.js
// Descrição: Define as rotas para a gestão de configurações do sistema.

const express = require('express');
const router = express.Router();

// --- Middlewares ---
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const logoUploadMiddleware = require('../middlewares/logoUploadMiddleware'); // O nosso middleware de upload para o logo

// --- Controller ---
const settingsController = require('../controllers/settingsController');

// --- Rota de Segurança (Todas as rotas de settings são apenas para 'master') ---
// Aplicamos a verificação de token e de 'master' a todas as rotas deste ficheiro
router.use(verifyToken, checkRole(['master']));

// --- ROTAS DA FASE 2.3: Configurações Gerais ---

// GET /api/settings/general
// Obtém as configurações de Nome, Logo e Cor
router.get('/general', settingsController.getGeneralSettings);

// POST /api/settings/general
// Atualiza as configurações de Nome, Logo e Cor
// Usa o 'logoUploadMiddleware' para processar o upload do ficheiro 'companyLogo'
router.post('/general', logoUploadMiddleware, settingsController.updateGeneralSettings);

// --- ROTAS DA FASE 2.4: Configurações do Portal Hotspot ---

// GET /api/settings/hotspot
// Obtém o Tempo de Sessão e a Whitelist
router.get('/hotspot', settingsController.getHotspotSettings);

// POST /api/settings/hotspot
// Atualiza o Tempo de Sessão e a Whitelist (espera JSON)
router.post('/hotspot', settingsController.updateHotspotSettings);


module.exports = router;

