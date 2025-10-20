// Ficheiro: routes/campaigns.js
// Descrição: Define as rotas da API para a gestão de campanhas.

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// --- Rotas para Campanhas ---

// Rota para criar uma nova campanha
// Apenas 'master' e 'gestao' podem criar campanhas
router.post(
  '/',
  [authMiddleware, roleMiddleware(['master', 'gestao'])],
  campaignController.createCampaign
);

// Rota para listar todas as campanhas
// Todos os utilizadores autenticados podem ver as campanhas
router.get(
  '/',
  authMiddleware,
  campaignController.getAllCampaigns
);

// Rota para atualizar uma campanha
// Apenas 'master' e 'gestao' podem atualizar campanhas
router.put(
  '/:id',
  [authMiddleware, roleMiddleware(['master', 'gestao'])],
  campaignController.updateCampaign
);

// Rota para eliminar uma campanha
// Apenas 'master' pode eliminar campanhas
router.delete(
  '/:id',
  [authMiddleware, roleMiddleware(['master'])],
  campaignController.deleteCampaign
);

module.exports = router;
