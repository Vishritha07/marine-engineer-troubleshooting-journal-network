const express = require('express');
const session = require('express-session');
const path = require('path');
const {
  ensureSeedData,
  registerUser,
  authenticateUser,
  getDiscoverUsers,
  getPublicProfile,
  getMyProfile,
  getRecordDetail,
  createRecord,
  updateRecord,
  deleteRecord,
  toggleLike,
  createComment,
  deleteComment,
  updateProfile,
  getUserById,
} = require('./src/database');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGINS = ['http://127.0.0.1:5500', 'http://localhost:5500'];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (FRONTEND_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'marine-engineer-journal-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  next();
}

app.get('/api/session', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false, user: null });
  }

  const user = await getUserById(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.json({ authenticated: false, user: null });
  }

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      experience: user.experience,
      profilePhoto: user.profilePhoto,
    },
  });
});

app.post('/api/register', async (req, res) => {
  const result = await registerUser(req.body || {});

  if (!result.success) {
    return res.status(result.code || 400).json({ message: result.message });
  }

  req.session.userId = result.user.id;

  return res.status(201).json({
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      bio: result.user.bio,
      experience: result.user.experience,
      profilePhoto: result.user.profilePhoto,
    },
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  req.session.userId = user.id;

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      experience: user.experience,
      profilePhoto: user.profilePhoto,
    },
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/discover', requireAuth, async (req, res) => {
  const search = String(req.query.search || '').trim();
  const users = await getDiscoverUsers(req.session.userId, search);
  return res.json({ users });
});

app.get('/api/my-profile', requireAuth, async (req, res) => {
  const profile = await getMyProfile(req.session.userId);

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found.' });
  }

  return res.json(profile);
});

app.get('/api/users/:id', requireAuth, async (req, res) => {
  const profile = await getPublicProfile(req.params.id, req.session.userId);

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found.' });
  }

  return res.json(profile);
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const result = await updateProfile(req.session.userId, req.body || {});

  if (!result.success) {
    return res.status(result.code || 400).json({ message: result.message });
  }

  return res.json({ user: result.user });
});

app.get('/api/troubleshooting/:id', requireAuth, async (req, res) => {
  const record = await getRecordDetail(req.params.id, req.session.userId);

  if (!record) {
    return res.status(404).json({ message: 'Troubleshooting record not found.' });
  }

  return res.json({ record });
});

app.post('/api/troubleshooting', requireAuth, async (req, res) => {
  const result = await createRecord(req.body || {}, req.session.userId);

  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  return res.status(201).json({ record: result.record });
});

app.put('/api/troubleshooting/:id', requireAuth, async (req, res) => {
  const result = await updateRecord(req.params.id, req.body || {}, req.session.userId);

  if (!result.success) {
    return res.status(result.code || 400).json({ message: result.message });
  }

  return res.json({ record: result.record });
});

app.delete('/api/troubleshooting/:id', requireAuth, async (req, res) => {
  const result = await deleteRecord(req.params.id, req.session.userId);

  if (!result.success) {
    return res.status(result.code || 400).json({ message: result.message });
  }

  return res.json({ success: true });
});

app.post('/api/troubleshooting/:id/like', requireAuth, async (req, res) => {
  const result = await toggleLike(req.params.id, req.session.userId);

  if (!result.success) {
    return res.status(result.code || 400).json({ message: result.message });
  }

  return res.json({
    liked: result.liked,
    likeCount: result.likeCount,
  });
});

app.post('/api/troubleshooting/:id/comments', requireAuth, async (req, res) => {
  const result = await createComment(req.params.id, req.session.userId, req.body || {});

  if (!result.success) {
    return res.status(result.code || 400).json({ message: result.message });
  }

  return res.status(201).json({ comment: result.comment });
});

app.delete('/api/troubleshooting/:id/comments/:commentId', requireAuth, async (req, res) => {
  const result = await deleteComment(req.params.commentId, req.session.userId);

  if (!result.success) {
    return res.status(result.code || 400).json({ message: result.message });
  }

  return res.json({ success: true });
});

app.get(['/', '/login', '/register', '/dashboard', '/my-profile', '/profile/:id', '/details/:id', '/new', '/edit/:id', '/edit-profile'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  await ensureSeedData();

  app.listen(PORT, () => {
    console.log(`Marine Engineer Troubleshooting Journal running on http://localhost:${PORT}`);
  });
}

startServer();
