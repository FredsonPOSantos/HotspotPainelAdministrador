// Ficheiro: backend/server.js
const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./connection'); 

// Importação das rotas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const routerRoutes = require('./routes/routers');
const templateRoutes = require('./routes/templates');
const campaignRoutes = require('./routes/campaigns');
const bannerRoutes = require('./routes/banners');
const hotspotRoutes = require('./routes/hotspot');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
// Servir ficheiros estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));


// --- Definição das Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/routers', routerRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/hotspot', hotspotRoutes);

// --- Rota de Teste Principal ---
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Bem-vindo à API de Gerenciamento de Hotspot! O servidor está a funcionar.' });
});

// --- Rota de Teste de Conexão com a Base de Dados ---
app.get('/api/db-test', async (req, res) => {
  try {
    const timeResult = await pool.query('SELECT NOW()');
    res.status(200).json({
      message: "Conexão com a base de dados bem-sucedida!",
      databaseTime: timeResult.rows[0].now,
    });
  } catch (error) {
    console.error('Erro de conexão com a base de dados:', error);
    res.status(500).json({ message: "Erro ao conectar à base de dados.", error: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});

