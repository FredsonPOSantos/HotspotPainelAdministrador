// Ficheiro: controllers/adminController.js
// Descrição: Contém a lógica de negócio para as rotas de administração.
// [VERSÃO ATUALIZADA - Fase 3.1 GESTÃO: Adiciona permissões ao perfil]

const pool = require('../connection');
const bcrypt = require('bcrypt');

// Função para obter o perfil do utilizador logado
const getUserProfile = async (req, res) => {
  // O req.user vem do authMiddleware (verifyToken)
  try {
    // 1. Buscar os dados do perfil principal
    const profileQuery = await pool.query(
      'SELECT id, email, role, is_active, setor, matricula, cpf, must_change_password FROM admin_users WHERE id = $1',
      [req.user.userId]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ message: "Perfil do utilizador não encontrado." });
    }
    
    const profile = profileQuery.rows[0];

    // 2. [NOVO] Buscar todas as permissões (keys) associadas à role deste utilizador
    const permissionsQuery = await pool.query(
        'SELECT permission_key FROM role_permissions WHERE role_name = $1',
        [profile.role]
    );
    
    // Mapeia o resultado para um array simples de strings (ex: ['dashboard.cards.read', 'routers.read', ...])
    const permissions = permissionsQuery.rows.map(r => r.permission_key);
    
    // 3. Anexa as permissões ao objeto de perfil
    profile.permissions = permissions;
    console.log(`getUserProfile: Perfil ${profile.email} (Role: ${profile.role}) carregado com ${permissions.length} permissões.`);


    // 4. Retorna o perfil completo com as permissões
    res.json({
      message: "Perfil do utilizador obtido com sucesso.",
      profile: profile, // Envia o objeto de perfil modificado
    });

  } catch (error) {
    console.error('Erro ao buscar perfil completo com permissões:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Função para aceder ao dashboard de master
const getMasterDashboard = (req, res) => {
// ... (código inalterado) ...
  res.json({ message: `Bem-vindo ao Dashboard, Mestre ${req.user.email}!` });
};

// Função para listar todos os utilizadores do painel de administração
const getAllAdminUsers = async (req, res) => {
// ... (código inalterado) ...
  const requestingUserRole = req.user.role; // 'master', 'gestao', ou 'DPO'

  try {
    let query;
    if (requestingUserRole === 'master' || requestingUserRole === 'DPO') {
      query = 'SELECT id, email, role, is_active, setor, matricula, cpf, must_change_password FROM admin_users ORDER BY id ASC';
    } 
    else if (requestingUserRole === 'gestao') {
      query = 'SELECT id, email, role, is_active, must_change_password FROM admin_users ORDER BY id ASC';
    } 
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
// ... (código inalterado) ...
  const { email, password, role, setor, matricula, cpf } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Campos (email, password, role) são obrigatórios." });
  }

  const validRoles = ['estetica', 'gestao', 'master', 'DPO']; 
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "A função (role) fornecida é inválida." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO admin_users (email, password_hash, role, setor, matricula, cpf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
      [email, passwordHash, role, setor || null, matricula || null, cpf || null]
    );

    res.status(201).json({
      message: "Utilizador criado com sucesso!",
      user: newUser.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: "O e-mail fornecido já está em uso." });
    }
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Função para atualizar um utilizador
const updateUser = async (req, res) => {
// ... (código inalterado) ...
  const { id } = req.params; // ID do utilizador a ser atualizado
  const requestingUserRole = req.user.role;
  const { role, is_active, setor, matricula, cpf } = req.body;

  if (id === '1' && (is_active === false || (role && role !== 'master'))) {
    return res.status(403).json({ message: "O utilizador master principal não pode ser desativado ou ter sua função alterada." });
  }
  if (id === '1' && requestingUserRole === 'gestao') {
     return res.status(403).json({ message: "Acesso negado. Apenas o 'master' pode editar o 'master'."});
  }

  const fields = [];
  const values = [];
  let queryIndex = 1;

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
  else if (requestingUserRole === 'gestao') {
    if (role !== undefined) {
      if (role === 'master') {
         return res.status(403).json({ message: "Apenas 'master' pode promover outros a 'master'."});
      }
      const validRoles = ['estetica', 'gestao', 'DPO']; 
      if (!validRoles.includes(role)) return res.status(400).json({ message: "Função inválida." });
      fields.push(`role = $${queryIndex++}`);
      values.push(role);
    }
  }
  
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
// ... (código inalterado) ...
  const { id } = req.params; // ID do utilizador a ter a senha resetada
  const { newPassword } = req.body;
  const requestingUserId = req.user.userId;

  if (!newPassword || newPassword.length < 6) {
     return res.status(400).json({ message: "A nova senha é obrigatória e deve ter pelo menos 6 caracteres." });
  }

  if (id === '1') {
     return res.status(403).json({ message: "Não é permitido resetar a senha do utilizador master por esta rota." });
  }
  
  if (id === requestingUserId.toString()) {
     return res.status(403).json({ message: "Utilize a página 'Meu Perfil' para alterar a sua própria senha." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await pool.query(
      'UPDATE admin_users SET password_hash = $1, must_change_password = true WHERE id = $2',
      [passwordHash, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    
    res.status(200).json({ message: "Senha do utilizador resetada com sucesso." });
    
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// [NOVA FUNÇÃO] para o *próprio* utilizador alterar a senha
const changeOwnPassword = async (req, res) => {
// ... (código inalterado) ...
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  try {
    const userQuery = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    const user = userQuery.rows[0];

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "A 'Senha Temporária' está incorreta." });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

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
// ... (código inalterado) ...
  const { id } = req.params;

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
  changeOwnPassword 
};

