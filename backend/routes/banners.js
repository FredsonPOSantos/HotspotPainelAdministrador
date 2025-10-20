// Ficheiro: routes/banners.js
const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware'); // Middleware para o upload

// --- Rotas para Banners ---

// --- NOVA ROTA DE UPLOAD ---
// Esta rota deve vir antes de '/:id' para evitar conflitos.
router.post(
  '/upload',
  [authMiddleware, roleMiddleware(['master', 'gestao']), uploadMiddleware.single('bannerImage')],
  bannerController.uploadBannerImage
);

// Rota para criar um novo banner
router.post(
  '/',
  [authMiddleware, roleMiddleware(['master', 'gestao'])],
  bannerController.createBanner
);

// Rota para listar todos os banners
router.get(
  '/',
  authMiddleware,
  bannerController.getAllBanners
);

// Rota para atualizar um banner
router.put(
  '/:id',
  [authMiddleware, roleMiddleware(['master', 'gestao'])],
  bannerController.updateBanner
);

// Rota para eliminar um banner
router.delete(
  '/:id',
  [authMiddleware, roleMiddleware(['master'])],
  bannerController.deleteBanner
);

module.exports = router;
