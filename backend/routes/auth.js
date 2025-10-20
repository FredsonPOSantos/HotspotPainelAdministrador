// Ficheiro: routes/auth.js
// Descrição: Define a rota de login (autenticação) para a API.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../connection'); // Importa a nossa conexão com a base de dados

// --- ROTA DE LOGIN ---
// URL: POST /api/auth/login
router.post('/login', async (req, res) => {
  // Extrai o email e a senha do corpo do pedido
  const { email, password } = req.body;

  // Validação básica de entrada
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  try {
    // 1. Encontrar o utilizador na base de dados pelo email
    const userQuery = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );

    // Verifica se o utilizador existe
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." }); // Mensagem genérica por segurança
    }

    const user = userQuery.rows[0];

    // 2. Comparar a senha fornecida com o hash guardado na base de dados
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciais inválidas." }); // Mensagem genérica por segurança
    }

    // 3. Se as credenciais estiverem corretas, criar o payload do token JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // 4. Assinar o token com o segredo e definir um tempo de expiração (ex: 8 horas)
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 5. Enviar a resposta de sucesso com o token
    res.status(200).json({
      message: "Login bem-sucedido!",
      token: token,
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

module.exports = router;

