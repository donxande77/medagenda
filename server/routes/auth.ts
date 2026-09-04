import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const authRouter = Router();

// Register Patient
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, cpf, birthDate, phone, email, password, confirmPassword } = req.body;

    if (!name || !cpf || !birthDate || !phone || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'A confirmação de senha não confere.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // Check CPF unique
    if (db.findUserByCpf(cpf)) {
      return res.status(400).json({ error: 'Já existe um cadastro com este CPF.' });
    }

    // Check email unique
    if (db.findUserByEmail(email)) {
      return res.status(400).json({ error: 'Já existe um cadastro com este e-mail.' });
    }

    // Create user
    const newUser = db.createUser(
      {
        name,
        email: email.trim().toLowerCase(),
        role: 'patient',
        phone,
        cpf,
        birthDate,
        status: 'active',
      },
      password
    );

    // Create linked patient entity
    const newPatient = db.createPatient({
      userId: newUser.id,
      name: newUser.name,
      cpf: newUser.cpf,
      birthDate: newUser.birthDate,
      phone: newUser.phone,
      email: newUser.email,
      status: 'active',
    });

    db.logAudit(newUser.id, newUser.email, 'patient', 'Cadastro de paciente', `Novo paciente ${newUser.name} registrado.`);

    return res.status(201).json({
      user: newUser,
      patient: newPatient,
      token: `token_${newUser.id}_${Date.now()}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao registrar paciente.' });
  }
});

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = db.findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Usuário bloqueado pelo administrador.' });
    }

    const isValid = db.verifyPassword(user.id, password);
    if (!isValid) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const patient = user.role === 'patient' ? db.findPatientByUserId(user.id) : undefined;

    db.logAudit(user.id, user.email, user.role, 'Login', `Usuário ${user.name} efetuou login no sistema.`);

    return res.json({
      user,
      patient,
      token: `token_${user.id}_${Date.now()}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao realizar login.' });
  }
});

// Current User Session
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Token format: Bearer token_usrId_timestamp
  const token = authHeader.replace('Bearer ', '');
  const parts = token.split('_');
  const userId = parts[1];

  const user = db.findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }

  const patient = user.role === 'patient' ? db.findPatientByUserId(user.id) : undefined;
  return res.json({ user, patient });
});

// Forgot Password
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'Nenhum usuário encontrado com este e-mail.' });
  }

  // Generate temporary 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  db.logAudit(
    user.id,
    user.email,
    user.role,
    'Recuperação de Senha',
    `Código de redefinição solicitado para ${user.email}: ${resetCode}`
  );

  return res.json({
    message: 'Instruções e código de recuperação enviados para o e-mail informado.',
    demoResetCode: resetCode, // Shown for easy testing in demo environment
  });
});

// Reset Password
authRouter.post('/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'E-mail e nova senha são obrigatórios.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  db.setPassword(user.id, newPassword);
  db.logAudit(user.id, user.email, user.role, 'Alteração de Senha', 'Senha redefinida com sucesso.');

  return res.json({ message: 'Senha alterada com sucesso! Faça login com a nova senha.' });
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) {
    const user = db.findUserById(userId);
    if (user) {
      db.logAudit(user.id, user.email, user.role, 'Logout', `Usuário ${user.name} desconectou-se.`);
    }
  }
  return res.json({ message: 'Logout realizado com sucesso.' });
});
