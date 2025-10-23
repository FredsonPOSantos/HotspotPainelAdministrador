// Ficheiro: controllers/adminController.js
// Descrição: Contém a lógica de negócio para as rotas de administração.
// [VERSÃO ATUALIZADA - FASE 1.2 / MATRIZ V4 - Forçar troca de senha]

const pool = require('../connection');
const bcrypt = require('bcrypt');

// Função para obter o perfil do utilizador logado
const getUserProfile = async (req, res) => {
  // O req.user vem do authMiddleware (verifyToken)
  // Precisamos buscar os dados completos, incluindo os novos campos
  try {
    const profileQuery = await pool.query(
      // [ATUALIZADO] Adiciona 'must_change_password' à query
      'SELECT id, email, role, is_active, setor, matricula, cpf, must_change_password FROM admin_users WHERE id = $1',
      [req.user.userId]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ message: "Perfil do utilizador não encontrado." });
    }

    res.json({
      message: "Perfil do utilizador obtido com sucesso.",
      profile: profileQuery.rows[0],
    });

  } catch (error) {
    console.error('Erro ao buscar perfil completo:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Função para aceder ao dashboard de master
const getMasterDashboard = (req, res) => {
  res.json({ message: `Bem-vindo ao Dashboard, Mestre ${req.user.email}!` });
};

// Função para listar todos os utilizadores do painel de administração
const getAllAdminUsers = async (req, res) => {
  const requestingUserRole = req.user.role; // 'master', 'gestao', ou 'DPO'

  try {
    let query;
    // Master e DPO veem todos os campos para gestão e auditoria
    if (requestingUserRole === 'master' || requestingUserRole === 'DPO') {
      // [ATUALIZADO] Adiciona 'must_change_password' à query
      query = 'SELECT id, email, role, is_active, setor, matricula, cpf, must_change_password FROM admin_users ORDER BY id ASC';
    } 
    // Gestão vê apenas os campos não-sensíveis
    else if (requestingUserRole === 'gestao') {
      // [ATUALIZADO] Adiciona 'must_change_password' à query
      query = 'SELECT id, email, role, is_active, must_change_password FROM admin_users ORDER BY id ASC';
    } 
    // Se outra função (ex: estetica) de alguma forma aceder, não retorna nada
    else {
      return res.json([]);
    }

    const allUsers = await pool.query(query);
    res.json(allUsers.rows);

  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Função para criar um novo utilizador do painel de administração
const createAdminUser = async (req, res) => {
  // Apenas 'master' pode aceder (definido nas rotas)
  const { email, password, role, setor, matricula, cpf } = req.body;

  // Validação básica dos dados recebidos
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Campos (email, password, role) são obrigatórios." });
  }

  const validRoles = ['estetica', 'gestao', 'master', 'DPO']; // DPO adicionado
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "A função (role) fornecida é inválida." });
  }

  try {
    // Gerar o hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Inserir o novo utilizador na base de dados
    const newUser = await pool.query(
      // [ATUALIZADO] O default 'false' para must_change_password será aplicado pelo DB
      'INSERT INTO admin_users (email, password_hash, role, setor, matricula, cpf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
      [email, passwordHash, role, setor || null, matricula || null, cpf || null]
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

// Função para atualizar um utilizador
const updateUser = async (req, res) => {
  const { id } = req.params; // ID do utilizador a ser atualizado
  const requestingUserRole = req.user.role;
  const { role, is_active, setor, matricula, cpf } = req.body;

  // Proteção de Segurança: Impedir que o utilizador master (id=1) seja desativado ou rebaixado
  if (id === '1' && (is_active === false || (role && role !== 'master'))) {
    return res.status(403).json({ message: "O utilizador master principal não pode ser desativado ou ter sua função alterada." });
  }
  // Proteção de Segurança: 'gestao' não pode editar o 'master'
  if (id === '1' && requestingUserRole === 'gestao') {
     return res.status(403).json({ message: "Acesso negado. Apenas o 'master' pode editar o 'master'."});
  }

  const fields = [];
  const values = [];
  let queryIndex = 1;

  // 'master' pode atualizar tudo
  if (requestingUserRole === 'master') {
    if (role !== undefined) {
      const validRoles = ['estetica', 'gestao', 'master', 'DPO'];
      if (!validRoles.includes(role)) return res.status(400).json({ message: "Função inválida." });
      fields.push(`role = $${queryIndex++}`);
      values.push(role);
    }
    if (setor !== undefined) {
      fields.push(`setor = $${queryIndex++}`);
      values.push(setor);
    }
    if (matricula !== undefined) {
      fields.push(`matricula = $${queryIndex++}`);
      values.push(matricula);
    }
    if (cpf !== undefined) {
      fields.push(`cpf = $${queryIndex++}`);
      values.push(cpf);
    }
  } 
  // 'gestao' pode atualizar apenas 'role' (se não for 'master') e 'is_active'
  else if (requestingUserRole === 'gestao') {
    if (role !== undefined) {
      if (role === 'master') {
         return res.status(403).json({ message: "Apenas 'master' pode promover outros a 'master'."});
      }
      const validRoles = ['estetica', 'gestao', 'DPO']; // 'gestao' não pode criar 'master'
      if (!validRoles.includes(role)) return res.status(400).json({ message: "Função inválida." });
      fields.push(`role = $${queryIndex++}`);
      values.push(role);
    }
  }
  
  // Ambos ('master' e 'gestao') podem atualizar 'is_active'
  if (is_active !== undefined) {
    fields.push(`is_active = $${queryIndex++}`);
    values.push(is_active);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Nenhum campo para atualizar foi fornecido ou permitido." });
  }

  values.push(id); // Adiciona o ID como último parâmetro

  try {
    const updateQuery = `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING id, email, role, is_active, setor, matricula, cpf, must_change_password`;
    const updatedUser = await pool.query(updateQuery, values);

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    // Se o 'gestao' atualizou, removemos os dados sensíveis da resposta
    if (requestingUserRole === 'gestao') {
      delete updatedUser.rows[0].setor;
      delete updatedUser.rows[0].matricula;
      delete updatedUser.rows[0].cpf;
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

// [NOVA FUNÇÃO] para 'master' e 'gestao' resetarem senhas
const resetUserPassword = async (req, res) => {
  const { id } = req.params; // ID do utilizador a ter a senha resetada
  const { newPassword } = req.body;
  const requestingUserId = req.user.userId;

  if (!newPassword || newPassword.length < 6) {
     return res.status(400).json({ message: "A nova senha é obrigatória e deve ter pelo menos 6 caracteres." });
  }

  // Proteção de Segurança: Ninguém pode resetar a senha do master (id=1), exceto ele mesmo (o que seria feito em "Meu Perfil", não aqui)
  if (id === '1') {
     return res.status(403).json({ message: "Não é permitido resetar a senha do utilizador master por esta rota." });
  }
  
  // Proteção de Segurança: Um utilizador não pode resetar a própria senha por esta rota
  if (id === requestingUserId.toString()) {
     return res.status(403).json({ message: "Utilize a página 'Meu Perfil' para alterar a sua própria senha." });
  }

  try {
    // Gerar o hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // [ATUALIZADO] Define a flag 'must_change_password' como true
    const result = await pool.query(
      'UPDATE admin_users SET password_hash = $1, must_change_password = true WHERE id = $2',
      [passwordHash, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    
    // [TODO Opcional] Adicionar um log de auditoria aqui (Fase 3)

    res.status(200).json({ message: "Senha do utilizador resetada com sucesso." });
    
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// [NOVA FUNÇÃO] para o *próprio* utilizador alterar a senha
const changeOwnPassword = async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  try {
    // 1. Buscar o utilizador e a sua senha atual
    const userQuery = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    const user = userQuery.rows[0];

    // 2. Verificar se a senha atual (temporária) está correta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "A 'Senha Temporária' está incorreta." });
    }

    // 3. Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. Atualizar a senha e remover a flag 'must_change_password'
    await pool.query(
      'UPDATE admin_users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.status(200).json({ message: "Senha alterada com sucesso." });

  } catch (error) {
    console.error('Erro ao alterar a própria senha:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// Função para eliminar um utilizador (Apenas 'master')
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
  resetUserPassword,
  changeOwnPassword // [NOVO] Exportamos a nova função
};

