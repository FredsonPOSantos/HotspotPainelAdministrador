// Ficheiro: controllers/adminController.js
// Descrição: Contém a lógica de negócio para as rotas de administração.

const pool = require('../connection'); // Caminho atualizado
const bcrypt = require('bcrypt');

// Função para obter o perfil do utilizador logado
const getUserProfile = (req, res) => {
  // A informação do utilizador foi adicionada ao objeto `req` pelo middleware verifyToken
  res.json({
    message: "Perfil do utilizador obtido com sucesso.",
    profile: req.user,
  });
};

// Função para aceder ao dashboard de master
const getMasterDashboard = (req, res) => {
  res.json({ message: `Bem-vindo ao Dashboard, Mestre ${req.user.email}!` });
};

// Função para listar todos os utilizadores do painel de administração
const getAllAdminUsers = async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT id, email, role, is_active FROM admin_users ORDER BY id ASC');
    res.json(allUsers.rows);
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Função para criar um novo utilizador do painel de administração
const createAdminUser = async (req, res) => {
  const { email, password, role } = req.body;

  // Validação básica dos dados recebidos
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Todos os campos (email, password, role) são obrigatórios." });
  }

  const validRoles = ['estetica', 'gestao', 'master'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "A função (role) fornecida é inválida." });
  }

  try {
    // Gerar o hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Inserir o novo utilizador na base de dados
    const newUser = await pool.query(
      'INSERT INTO admin_users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, passwordHash, role]
    );

    res.status(201).json({
      message: "Utilizador criado com sucesso!",
      user: newUser.rows[0],
    });
  } catch (error) {
    // Tratar erro de e-mail duplicado
    if (error.code === '23505') {
      return res.status(409).json({ message: "O e-mail fornecido já está em uso." });
    }
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Função para atualizar um utilizador (role, is_active)
const updateUser = async (req, res) => {
  const { id } = req.params; // ID do utilizador a ser atualizado
  const { role, is_active } = req.body;

  // Impede que o utilizador master (id=1) seja desativado
  if (id === '1' && is_active === false) {
    return res.status(403).json({ message: "O utilizador master principal não pode ser desativado." });
  }

  // Constrói a query dinamicamente para atualizar apenas os campos fornecidos
  const fields = [];
  const values = [];
  let queryIndex = 1;

  if (role !== undefined) {
    const validRoles = ['estetica', 'gestao', 'master'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Função inválida." });
    }
    fields.push(`role = $${queryIndex++}`);
    values.push(role);
  }

  if (is_active !== undefined) {
    fields.push(`is_active = $${queryIndex++}`);
    values.push(is_active);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Nenhum campo para atualizar foi fornecido." });
  }

  values.push(id); // Adiciona o ID como último parâmetro

  try {
    const updateQuery = `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING id, email, role, is_active`;
    const updatedUser = await pool.query(updateQuery, values);

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    res.status(200).json({
      message: "Utilizador atualizado com sucesso!",
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Função para eliminar um utilizador
const deleteUser = async (req, res) => {
  const { id } = req.params;

  // Proteção: Impede que o utilizador master (id=1) seja eliminado
  if (id === '1') {
    return res.status(403).json({ message: "O utilizador master principal não pode ser eliminado." });
  }

  try {
    const result = await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    res.status(200).json({ message: "Utilizador eliminado com sucesso." });
  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


module.exports = {
  getUserProfile,
  getMasterDashboard,
  getAllAdminUsers,
  createAdminUser,
  updateUser,
  deleteUser,
};

