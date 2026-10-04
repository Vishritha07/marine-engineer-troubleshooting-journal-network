const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'marine-journal.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbFile);

function normalizeText(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function allSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows || []);
    });
  });
}

async function createTables() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      profilePhoto TEXT,
      role TEXT,
      bio TEXT,
      experience TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS troubleshooting_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      problem TEXT NOT NULL,
      observation TEXT NOT NULL,
      equipmentAffected TEXT NOT NULL,
      rootCause TEXT NOT NULL,
      correctiveActivity TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      troubleshootingId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(userId, troubleshootingId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(troubleshootingId) REFERENCES troubleshooting_records(id)
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      troubleshootingId INTEGER NOT NULL,
      text TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(troubleshootingId) REFERENCES troubleshooting_records(id)
    );
  `);
}

async function ensureUserColumns() {
  const columns = await allSql('PRAGMA table_info(users)');
  const existingColumns = new Set(columns.map((column) => column.name));
  const migrations = [
    ['profilePhoto', 'ALTER TABLE users ADD COLUMN profilePhoto TEXT'],
    ['role', 'ALTER TABLE users ADD COLUMN role TEXT'],
    ['bio', 'ALTER TABLE users ADD COLUMN bio TEXT'],
    ['experience', 'ALTER TABLE users ADD COLUMN experience TEXT'],
  ];

  for (const [columnName, sql] of migrations) {
    if (!existingColumns.has(columnName)) {
      await runSql(sql);
    }
  }
}

async function seedUsers() {
  const existingUsers = await getSql('SELECT COUNT(*) AS count FROM users');

  if (existingUsers.count > 0) {
    return;
  }

  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const now = new Date().toISOString();

  await runSql(
    'INSERT INTO users (name, email, passwordHash, profilePhoto, role, bio, experience, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      'Marine Engineer',
      'engineer@marinejournal.com',
      passwordHash,
      '',
      'Marine Engineer',
      'Marine engineer interested in engine maintenance and troubleshooting.',
      '8 Years',
      now,
      now,
    ]
  );
}

async function seedRecords() {
  const existingRecords = await getSql('SELECT COUNT(*) AS count FROM troubleshooting_records');

  if (existingRecords.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const user = await getSql('SELECT id FROM users WHERE email = ?', ['engineer@marinejournal.com']);

  if (!user) {
    return;
  }

  const records = [
    {
      userId: user.id,
      date: '2026-09-12',
      title: 'Fresh Water Pump — Low Water Flow',
      description: 'Fresh water pump operating below expected flow during normal engine room checks.',
      problem: 'Low Water Flow',
      observation: 'Pump discharge pressure was lower than baseline while the system was running at standard load.',
      equipmentAffected: 'Fresh Water Pump',
      rootCause: 'Strainer blockage reduced inlet flow to the pump.',
      correctiveActivity: 'Cleaned the suction strainer and verified pump performance returned to normal.',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId: user.id,
      date: '2026-09-08',
      title: 'Generator High Temperature',
      description: 'Generator running hot above normal temperature threshold.',
      problem: 'High Temperature',
      observation: 'Cooling air path was partially obstructed and exhaust side temperature increased steadily.',
      equipmentAffected: 'Generator',
      rootCause: 'Cooling fins were restricted by dust build-up.',
      correctiveActivity: 'Removed debris from cooling surfaces and retested at operating load.',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId: user.id,
      date: '2026-09-02',
      title: 'Compressor Pressure Drop',
      description: 'Air compressor output pressure dropped during a routine inspection.',
      problem: 'Pressure Drop',
      observation: 'Intermittent pressure loss was observed after the compressor had been running for twenty minutes.',
      equipmentAffected: 'Compressor',
      rootCause: 'Air filter was partially restricted and a quick-release fitting had become loose.',
      correctiveActivity: 'Replaced the filter and tightened the fitting before rechecking pressure stability.',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId: user.id,
      date: '2026-09-01',
      title: 'Fresh Water Pump — Low Water Flow',
      description: 'Repeat low flow issue seen during a second operational check.',
      problem: 'Low Water Flow',
      observation: 'Flow remained reduced after the first maintenance action and the strainer was again found obstructed.',
      equipmentAffected: 'Fresh Water Pump',
      rootCause: 'Recurring debris accumulation in the intake strainer.',
      correctiveActivity: 'Completed a deeper clean of the intake compartment and scheduled regular inspection intervals.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const insertSql = `
    INSERT INTO troubleshooting_records (
      userId, date, title, description, problem, observation, equipmentAffected, rootCause, correctiveActivity, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const item of records) {
    await runSql(insertSql, [
      item.userId,
      item.date,
      item.title,
      item.description,
      item.problem,
      item.observation,
      item.equipmentAffected,
      item.rootCause,
      item.correctiveActivity,
      item.createdAt,
      item.updatedAt,
    ]);
  }
}

async function ensureSeedData() {
  await createTables();
  await ensureUserColumns();
  await seedUsers();
  await seedRecords();
}

async function registerUser(input) {
  const payload = {
    name: String(input.name || '').trim(),
    email: String(input.email || '').trim().toLowerCase(),
    password: String(input.password || ''),
    confirmPassword: String(input.confirmPassword || ''),
    profilePhoto: String(input.profilePhoto || '').trim(),
    role: String(input.role || '').trim(),
    bio: String(input.bio || '').trim(),
    experience: String(input.experience || '').trim(),
  };

  if (!payload.name || !payload.email || !payload.password || !payload.role || !payload.bio) {
    return { success: false, code: 400, message: 'Please fill in all required fields.' };
  }

  if (payload.password !== payload.confirmPassword) {
    return { success: false, code: 400, message: 'Passwords do not match.' };
  }

  if (payload.password.length < 6) {
    return { success: false, code: 400, message: 'Password must be at least 6 characters long.' };
  }

  const existingUser = await getUserByEmail(payload.email);

  if (existingUser) {
    return { success: false, code: 409, message: 'An account with that email already exists.' };
  }

  const passwordHash = bcrypt.hashSync(payload.password, 10);
  const now = new Date().toISOString();

  const result = await runSql(
    `INSERT INTO users (name, email, passwordHash, profilePhoto, role, bio, experience, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.email,
      passwordHash,
      payload.profilePhoto,
      payload.role,
      payload.bio,
      payload.experience,
      now,
      now,
    ]
  );

  const user = await getUserById(result.lastID);

  return { success: true, user };
}

async function getUserByEmail(email) {
  return await getSql('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
}

async function getUserById(id) {
  return await getSql('SELECT * FROM users WHERE id = ?', [id]);
}

async function authenticateUser(email, password) {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordMatches = bcrypt.compareSync(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return user;
}

async function buildUserRecords(userId) {
  const records = await allSql(
    'SELECT * FROM troubleshooting_records WHERE userId = ? ORDER BY date DESC, createdAt DESC',
    [userId]
  );

  return records.map((record) => ({
    ...record,
    issueOccurrenceCount: calculateIssueOccurrenceCount(records, record.equipmentAffected, record.problem),
  }));
}

async function getDiscoverUsers(currentUserId, search = '') {
  const query = String(search).trim();

  let sql = `
    SELECT u.id, u.name, u.email, u.profilePhoto, u.role, u.bio, u.experience, u.createdAt, u.updatedAt,
           COUNT(tr.id) AS totalTroubleshootingCases
    FROM users u
    LEFT JOIN troubleshooting_records tr ON tr.userId = u.id
    WHERE u.id != ?
  `;

  const params = [currentUserId];

  if (query) {
    sql += ` AND (u.name LIKE ? OR u.role LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`);
  }

  sql += ` GROUP BY u.id ORDER BY u.name ASC`;

  const users = await allSql(sql, params);

  return users;
}

async function getMyProfile(userId) {
  const user = await getUserById(userId);

  if (!user) {
    return null;
  }

  const records = await buildUserRecords(userId);
  const stats = await getProfileStats(userId);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    role: user.role,
    bio: user.bio,
    experience: user.experience,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    records,
    stats,
    isOwner: true,
  };
}

async function getPublicProfile(targetUserId, currentUserId) {
  const user = await getUserById(targetUserId);

  if (!user) {
    return null;
  }

  const records = await buildUserRecords(targetUserId);
  const stats = await getProfileStats(targetUserId);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    role: user.role,
    bio: user.bio,
    experience: user.experience,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    records,
    stats,
    isOwner: Number(currentUserId) === Number(targetUserId),
  };
}

async function getProfileStats(userId) {
  const totalCasesRow = await getSql(
    'SELECT COUNT(*) AS total FROM troubleshooting_records WHERE userId = ?',
    [userId]
  );

  const totalLikesRow = await getSql(
    `SELECT COUNT(*) AS total
     FROM likes l
     INNER JOIN troubleshooting_records tr ON tr.id = l.troubleshootingId
     WHERE tr.userId = ?`,
    [userId]
  );

  const totalCommentsRow = await getSql(
    `SELECT COUNT(*) AS total
     FROM comments c
     INNER JOIN troubleshooting_records tr ON tr.id = c.troubleshootingId
     WHERE tr.userId = ?`,
    [userId]
  );

  return {
    totalTroubleshootingCases: totalCasesRow?.total || 0,
    totalLikes: totalLikesRow?.total || 0,
    totalComments: totalCommentsRow?.total || 0,
  };
}

function calculateIssueOccurrenceCount(records, equipmentAffected, problem) {
  const normalizedEquipment = normalizeText(equipmentAffected);
  const normalizedProblem = normalizeText(problem);

  return records.filter((record) => {
    const equipmentMatch = normalizeText(record.equipmentAffected) === normalizedEquipment;
    const problemMatch = normalizeText(record.problem) === normalizedProblem;
    return equipmentMatch && problemMatch;
  }).length;
}

function buildOccurrenceHistory(records, equipmentAffected, problem) {
  const normalizedEquipment = normalizeText(equipmentAffected);
  const normalizedProblem = normalizeText(problem);

  return records
    .filter((record) => {
      const equipmentMatch = normalizeText(record.equipmentAffected) === normalizedEquipment;
      const problemMatch = normalizeText(record.problem) === normalizedProblem;
      return equipmentMatch && problemMatch;
    })
    .sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

async function getRecordById(id, userId) {
  const records = await buildUserRecords(userId);
  const record = records.find((item) => String(item.id) === String(id));

  return record || null;
}

async function getRecordDetail(id, currentUserId) {
  const recordRow = await getSql(
    `SELECT tr.*, u.name AS ownerName, u.role AS ownerRole, u.profilePhoto AS ownerProfilePhoto
     FROM troubleshooting_records tr
     INNER JOIN users u ON u.id = tr.userId
     WHERE tr.id = ?`,
    [id]
  );

  if (!recordRow) {
    return null;
  }

  const comments = await allSql(
    `SELECT c.*, u.name as userName
     FROM comments c
     INNER JOIN users u ON u.id = c.userId
     WHERE c.troubleshootingId = ?
     ORDER BY c.createdAt ASC`,
    [id]
  );

  const likeCount = await getSql(
    'SELECT COUNT(*) AS count FROM likes WHERE troubleshootingId = ?',
    [id]
  );

  const userLike = await getSql(
    'SELECT id FROM likes WHERE troubleshootingId = ? AND userId = ?',
    [id, currentUserId]
  );

  const recordsForOwner = await buildUserRecords(recordRow.userId);
  const occurrenceHistory = buildOccurrenceHistory(recordsForOwner, recordRow.equipmentAffected, recordRow.problem);

  return {
    ...recordRow,
    isOwner: Number(recordRow.userId) === Number(currentUserId),
    comments,
    likeCount: likeCount?.count || 0,
    liked: !!userLike,
    issueOccurrenceCount: occurrenceHistory.length,
    occurrenceHistory,
  };
}

async function createRecord(input, userId) {
  const payload = {
    date: String(input.date || '').trim(),
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    problem: String(input.problem || '').trim(),
    observation: String(input.observation || '').trim(),
    equipmentAffected: String(input.equipmentAffected || '').trim(),
    rootCause: String(input.rootCause || '').trim(),
    correctiveActivity: String(input.correctiveActivity || '').trim(),
  };

  if (!payload.title || !payload.date || !payload.description || !payload.problem || !payload.observation || !payload.equipmentAffected || !payload.rootCause || !payload.correctiveActivity) {
    return { success: false, message: 'Please fill in all fields.' };
  }

  const now = new Date().toISOString();

  const result = await runSql(
    `INSERT INTO troubleshooting_records (
      userId, date, title, description, problem, observation, equipmentAffected, rootCause, correctiveActivity, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      payload.date,
      payload.title,
      payload.description,
      payload.problem,
      payload.observation,
      payload.equipmentAffected,
      payload.rootCause,
      payload.correctiveActivity,
      now,
      now,
    ]
  );

  const record = await getRecordById(result.lastID, userId);

  return { success: true, record };
}

async function updateRecord(id, input, userId) {
  const existing = await getRecordById(id, userId);

  if (!existing) {
    return { success: false, code: 404, message: 'Troubleshooting record not found.' };
  }

  const payload = {
    date: String(input.date || existing.date).trim(),
    title: String(input.title || existing.title).trim(),
    description: String(input.description || existing.description).trim(),
    problem: String(input.problem || existing.problem).trim(),
    observation: String(input.observation || existing.observation).trim(),
    equipmentAffected: String(input.equipmentAffected || existing.equipmentAffected).trim(),
    rootCause: String(input.rootCause || existing.rootCause).trim(),
    correctiveActivity: String(input.correctiveActivity || existing.correctiveActivity).trim(),
  };

  if (!payload.title || !payload.date || !payload.description || !payload.problem || !payload.observation || !payload.equipmentAffected || !payload.rootCause || !payload.correctiveActivity) {
    return { success: false, code: 400, message: 'Please fill in all fields.' };
  }

  await runSql(
    `UPDATE troubleshooting_records
     SET date = ?, title = ?, description = ?, problem = ?, observation = ?, equipmentAffected = ?, rootCause = ?, correctiveActivity = ?, updatedAt = ?
     WHERE id = ? AND userId = ?`,
    [
      payload.date,
      payload.title,
      payload.description,
      payload.problem,
      payload.observation,
      payload.equipmentAffected,
      payload.rootCause,
      payload.correctiveActivity,
      new Date().toISOString(),
      id,
      userId,
    ]
  );

  const record = await getRecordById(id, userId);

  return { success: true, record };
}

async function deleteRecord(id, userId) {
  const existing = await getRecordById(id, userId);

  if (!existing) {
    return { success: false, code: 404, message: 'Troubleshooting record not found.' };
  }

  await runSql('DELETE FROM likes WHERE troubleshootingId = ?', [id]);
  await runSql('DELETE FROM comments WHERE troubleshootingId = ?', [id]);
  await runSql('DELETE FROM troubleshooting_records WHERE id = ? AND userId = ?', [id, userId]);

  return { success: true };
}

async function toggleLike(troubleshootingId, userId) {
  const record = await getSql('SELECT id FROM troubleshooting_records WHERE id = ?', [troubleshootingId]);

  if (!record) {
    return { success: false, code: 404, message: 'Troubleshooting record not found.' };
  }

  const existingLike = await getSql(
    'SELECT id FROM likes WHERE troubleshootingId = ? AND userId = ?',
    [troubleshootingId, userId]
  );

  if (existingLike) {
    await runSql('DELETE FROM likes WHERE id = ?', [existingLike.id]);
    const likeCount = await getSql('SELECT COUNT(*) AS count FROM likes WHERE troubleshootingId = ?', [troubleshootingId]);

    return { success: true, liked: false, likeCount: likeCount.count };
  }

  await runSql(
    'INSERT INTO likes (userId, troubleshootingId, createdAt) VALUES (?, ?, ?)',
    [userId, troubleshootingId, new Date().toISOString()]
  );

  const likeCount = await getSql('SELECT COUNT(*) AS count FROM likes WHERE troubleshootingId = ?', [troubleshootingId]);

  return { success: true, liked: true, likeCount: likeCount.count };
}

async function createComment(troubleshootingId, userId, input) {
  const text = String(input.text || '').trim();

  if (!text) {
    return { success: false, code: 400, message: 'Comment text is required.' };
  }

  const record = await getSql('SELECT id FROM troubleshooting_records WHERE id = ?', [troubleshootingId]);

  if (!record) {
    return { success: false, code: 404, message: 'Troubleshooting record not found.' };
  }

  const now = new Date().toISOString();

  const result = await runSql(
    `INSERT INTO comments (userId, troubleshootingId, text, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    [userId, troubleshootingId, text, now, now]
  );

  const comment = await getSql(
    `SELECT c.*, u.name AS userName
     FROM comments c
     INNER JOIN users u ON u.id = c.userId
     WHERE c.id = ?`,
    [result.lastID]
  );

  return { success: true, comment };
}

async function deleteComment(commentId, userId) {
  const comment = await getSql('SELECT * FROM comments WHERE id = ?', [commentId]);

  if (!comment) {
    return { success: false, code: 404, message: 'Comment not found.' };
  }

  const ownsComment = Number(comment.userId) === Number(userId);

  if (!ownsComment) {
    return { success: false, code: 403, message: 'You can only delete your own comments.' };
  }

  await runSql('DELETE FROM comments WHERE id = ?', [commentId]);

  return { success: true };
}

async function updateProfile(userId, input) {
  const existingUser = await getUserById(userId);

  if (!existingUser) {
    return { success: false, code: 404, message: 'Profile not found.' };
  }

  const payload = {
    name: String(input.name || existingUser.name).trim(),
    role: String(input.role || existingUser.role || '').trim(),
    bio: String(input.bio || existingUser.bio || '').trim(),
    experience: String(input.experience || existingUser.experience || '').trim(),
    profilePhoto: String(input.profilePhoto || existingUser.profilePhoto || '').trim(),
  };

  if (!payload.name || !payload.role || !payload.bio) {
    return { success: false, code: 400, message: 'Name, role, and bio are required.' };
  }

  await runSql(
    `UPDATE users
     SET name = ?, role = ?, bio = ?, experience = ?, profilePhoto = ?, updatedAt = ?
     WHERE id = ?`,
    [payload.name, payload.role, payload.bio, payload.experience, payload.profilePhoto, new Date().toISOString(), userId]
  );

  const user = await getUserById(userId);

  return { success: true, user };
}

module.exports = {
  ensureSeedData,
  registerUser,
  authenticateUser,
  getUserById,
  getDiscoverUsers,
  getPublicProfile,
  getMyProfile,
  buildUserRecords,
  getRecordById,
  getRecordDetail,
  createRecord,
  updateRecord,
  deleteRecord,
  toggleLike,
  createComment,
  deleteComment,
  updateProfile,
  getUserByEmail,
  normalizeText,
  calculateIssueOccurrenceCount,
  buildOccurrenceHistory,
};
