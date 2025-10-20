// Ficheiro: middlewares/roleMiddleware.js
// Descrição: Middleware que verifica if a função (role) do utilizador tem permissão para aceder a uma rota.

// Este middleware é um "gerador de middlewares".
// Ele recebe uma lista de funções permitidas e retorna um middleware configurado.
const checkRole = (rolesPermitidas) => {
  return (req, res, next) => {
    // Primeiro, garantimos que o middleware de verificação de token já foi executado
    // e que temos a informação do utilizador em req.user
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Acesso negado. Função do utilizador não encontrada." });
    }

    const { role } = req.user;

    // Verificamos if a função ('role') do utilizador está na lista de funções permitidas
    if (rolesPermitidas.includes(role)) {
      // Se estiver, permite o acesso
      next();
    } else {
      // Se não estiver, bloqueia o acesso
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para aceder a este recurso." });
    }
  };
};

module.exports = checkRole;

