// Ficheiro: routes/templates.js
// Descrição: Define as rotas da API para a gestão de templates.

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// --- Rotas para Templates ---

// Rota para criar um novo template
// Apenas 'master' e 'gestao' podem criar templates
router.post(
  '/',
  [authMiddleware, roleMiddleware(['master', 'gestao'])],
  templateController.createTemplate
);

// Rota para listar todos os templates
// Todos os utilizadores autenticados podem ver os templates
router.get(
  '/',
  authMiddleware,
  templateController.getAllTemplates
);

// Rota para atualizar um template
// Apenas 'master' e 'gestao' podem atualizar templates
router.put(
  '/:id',
  [authMiddleware, roleMiddleware(['master', 'gestao'])],
  templateController.updateTemplate
);

// Rota para eliminar um template
// Apenas 'master' pode eliminar templates
router.delete(
  '/:id',
  [authMiddleware, roleMiddleware(['master'])],
  templateController.deleteTemplate
);

module.exports = router;
