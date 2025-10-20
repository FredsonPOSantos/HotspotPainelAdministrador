// Ficheiro: middlewares/authMiddleware.js
// Descrição: Middleware para verificar a validade do token JWT em pedidos protegidos.

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // O token é enviado no cabeçalho 'Authorization' no formato "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extrai apenas o token

  // Se não houver token, bloqueia o acesso
  if (!token) {
    return res.status(403).json({ message: "Um token é necessário para autenticação." });
  }

  try {
    // Verifica se o token é válido usando o segredo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Adiciona os dados do utilizador (payload do token) ao objeto de pedido (req)
    // para que as próximas rotas possam usá-los
    req.user = decoded;
  } catch (err) {
    // Se o token for inválido (expirado, malformado, etc.), bloqueia o acesso
    return res.status(401).json({ message: "Token inválido." });
  }

  // Se o token for válido, permite que o pedido continue para a próxima função (a rota)
  return next();
};

module.exports = verifyToken;

