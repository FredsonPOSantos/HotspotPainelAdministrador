// Ficheiro: middlewares/authMiddleware.js
// Descrição: Middleware para verificar a validade do token JWT e a flag 'must_change_password'.
// [VERSÃO ATUALIZADA - FASE 1.2 / MATRIZ V4 - Forçar troca de senha]

const jwt = require('jsonwebtoken');
const pool = require('../connection'); // [NOVO] Precisa de aceder à BD

const verifyToken = async (req, res, next) => {
  // O token é enviado no cabeçalho 'Authorization' no formato "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extrai apenas o token

  // Se não houver token, bloqueia o acesso
  if (!token) {
    // [ALTERADO] Status 401 (Não autorizado) é mais correto aqui
    return res.status(401).json({ message: "Um token é necessário para autenticação." });
  }

  let decoded;
  try {
    // Verifica se o token é válido usando o segredo
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Adiciona os dados do utilizador (payload do token) ao objeto de pedido (req)
    req.user = decoded;
  } catch (err) {
    // Se o token for inválido (expirado, malformado, etc.), bloqueia o acesso
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }

  // --- [NOVA LÓGICA DE BLOQUEIO DE TROCA DE SENHA] ---
  try {
    // Após validar o token, verificamos a flag na base de dados
    const userQuery = await pool.query(
      'SELECT must_change_password FROM admin_users WHERE id = $1',
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: "Utilizador do token não encontrado." });
    }

    const mustChangePassword = userQuery.rows[0].must_change_password;

    // Se a flag for true, bloqueamos o acesso a *todas* as rotas, exceto a de troca de senha
    if (mustChangePassword) {
      // Esta é a única rota que permitimos
      const allowedPath = '/api/admin/profile/change-own-password';
      
      if (req.originalUrl !== allowedPath) {
        // Bloqueia qualquer outra rota da API
        return res.status(403).json({ 
          message: "Acesso negado. Troca de senha obrigatória pendente.",
          code: "PASSWORD_CHANGE_REQUIRED" // O frontend vai usar este código
        });
      }
    }

    // Se a flag for false, ou se for a rota permitida, continua
    return next();

  } catch (dbError) {
    console.error("Erro no authMiddleware ao verificar a base de dados:", dbError);
    return res.status(500).json({ message: "Erro interno ao verificar o estado do utilizador." });
  }
  
};

module.exports = verifyToken;

