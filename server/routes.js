const express = require('express');
const router = express.Router();
const db = require('./db');
const { extractStem, getSemanticInfo, compareSemantic, clusterSummaryList } = require('./semantic');

// 支持 BigInt 在 JSON.stringify 中安全序列化为普通数字，杜绝 SQLite BigInt 导致的序列化异常崩溃
if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
  };
}

// 高对比度、互不冲突、高辨识度的协同配色库（色相环大跨度分离，一眼清晰可辨）
const PALETTES = [
  // 0. 翡翠林绿 (Emerald Green - 大自然深翠绿)
  { name: '翡翠绿', bg: '#ECFDF5', cardBg: '#D1FAE5', border: '#6EE7B7', badge: '#059669', text: '#065F46' },
  // 1. 暖阳金橙 (Amber Orange - 亮丽温暖暖橙/黄)
  { name: '暖阳橙', bg: '#FFFBEB', cardBg: '#FEF3C7', border: '#FCD34D', badge: '#D97706', text: '#92400E' },
  // 2. 宝石海蓝 (Royal Blue - 纯正深海蔚蓝)
  { name: '蔚海蓝', bg: '#EFF6FF', cardBg: '#DBEAFE', border: '#93C5FD', badge: '#2563EB', text: '#1E40AF' },
  // 3. 霓虹魅紫 (Electric Violet - 醒目高雅紫罗兰)
  { name: '魅罗紫', bg: '#FAF5FF', cardBg: '#F3E8FF', border: '#D8B4FE', badge: '#9333EA', text: '#6B21A8' },
  // 4. 蔷薇玫红 (Rose Pink - 鲜明娇艳玫粉)
  { name: '蔷薇红', bg: '#FFF1F2', cardBg: '#FFE4E6', border: '#FDA4AF', badge: '#E11D48', text: '#9F1239' },
  // 5. 松石深青 (Deep Teal - 浓郁沉稳墨青)
  { name: '深黛青', bg: '#F0FDFA', cardBg: '#CCFBF1', border: '#5EEAD4', badge: '#0D9488', text: '#115E59' },
  // 6. 暖栗红棕 (Chestnut Brown - 温暖大地赤褐红)
  { name: '赤陶褐', bg: '#FDF4EC', cardBg: '#FCE7D6', border: '#F8B688', badge: '#C2410C', text: '#7C2D12' },
  // 7. 星空暗夜 (Slate Navy - 极简灰蓝黑)
  { name: '岩板灰', bg: '#F1F5F9', cardBg: '#E2E8F0', border: '#94A3B8', badge: '#475569', text: '#0F172A' }
];

function getColorForUser(index) {
  return PALETTES[Math.abs(index) % PALETTES.length];
}

// 新创建活动与新用户加入，清单默认保持完全空白，让用户自行输入
function assignPresetItemsForUser(roomId, userId) {
  // 保持完全空白，不自动填充任何默认商品
}

// 模拟简易会话/Token，便于手机端无刷新使用 (支持 Bearer header, query.token, query.userId)
function getAuthUserId(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const uid = parseInt(authHeader.replace('Bearer ', ''), 10);
    return isNaN(uid) ? null : uid;
  }
  const queryUid = parseInt(req.query.token || req.query.userId || req.body?.userId, 10);
  return isNaN(queryUid) ? null : queryUid;
}

// ==========================================
// SSE (Server-Sent Events) 实时推送通道管理器
// ==========================================
const roomClients = new Map(); // Map<roomId, Set<{ id, userId, res }>>

function addClientToRoom(roomId, client) {
  const rId = parseInt(roomId, 10);
  if (!roomClients.has(rId)) {
    roomClients.set(rId, new Set());
  }
  roomClients.get(rId).add(client);
}

function removeClientFromRoom(roomId, client) {
  const rId = parseInt(roomId, 10);
  if (roomClients.has(rId)) {
    const set = roomClients.get(rId);
    set.delete(client);
    if (set.size === 0) {
      roomClients.delete(rId);
    }
  }
}

function broadcastToRoom(roomId, eventName, data) {
  const rId = parseInt(roomId, 10);
  if (!roomClients.has(rId)) return;
  const set = roomClients.get(rId);
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of set) {
    try {
      client.res.write(payload);
    } catch (e) {
      // 写入失败说明连接已中断
    }
  }
}

// 0. 系统健康检查与诊断接口
router.get('/health', (req, res) => {
  let dbWriteOk = false;
  let dbError = null;
  try {
    db.prepare('CREATE TABLE IF NOT EXISTS _health_check (id INTEGER PRIMARY KEY, ts INTEGER)').run();
    db.prepare('INSERT INTO _health_check (ts) VALUES (?)').run(Date.now());
    db.prepare('DELETE FROM _health_check').run();
    dbWriteOk = true;
  } catch (err) {
    dbError = err.message;
  }
  res.json({
    status: 'ok',
    version: '3.4',
    time: new Date().toISOString(),
    dbWriteOk,
    dbError
  });
});

// 1. 用户注册
router.post('/register', (req, res) => {
  try {
    const { password, nickname } = req.body;
    const userAccount = (req.body.username || req.body.phone || '').trim();
    if (!userAccount || userAccount.length < 6 || userAccount.length > 12) {
      return res.status(400).json({ error: '用户名必须为6~12位字符' });
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{6,12}$/.test(userAccount)) {
      return res.status(400).json({ error: '用户名仅支持汉字、英文字母、数字和下划线' });
    }
    if (!password || !/^\d{6,8}$/.test(password)) {
      return res.status(400).json({ error: '密码必须为6~8位纯数字' });
    }

    const cleanNickname = (nickname || '').replace(/\s*[\(（]我[\)）]+/g, '').trim();
    if (!cleanNickname) {
      return res.status(400).json({ error: '请填写用户昵称（必填，将作为列表中显示的用户名）' });
    }
    if (cleanNickname.length > 8) {
      return res.status(400).json({ error: '用户昵称长度不能超过8个字' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(userAccount);
    if (existing) {
      return res.status(400).json({ error: '该用户名已被注册，请直接登录' });
    }

    // 昵称唯一性校验
    const existNick = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(nickname)) = LOWER(TRIM(?))').get(cleanNickname);
    if (existNick) {
      return res.status(400).json({ error: `该昵称「${cleanNickname}」已被其他用户使用，请换一个昵称` });
    }

    // 计算当前颜色索引
    const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const userCount = Number(countRow ? countRow.count : 0);
    const name = cleanNickname;
    
    const result = db.prepare('INSERT INTO users (phone, password, nickname, color_index) VALUES (?, ?, ?, ?)').run(userAccount, password, name, userCount);
    const newUserId = Number(result.lastInsertRowid);
    const user = db.prepare('SELECT id, phone, nickname, color_index, created_at FROM users WHERE id = ?').get(newUserId);
    if (!user) {
      return res.status(500).json({ error: '注册成功但读取用户信息异常，请尝试直接登录' });
    }

    user.id = Number(user.id);
    user.color_index = Number(user.color_index || 0);
    user.colorTheme = getColorForUser(user.color_index);
    user.username = user.phone;
    
    // 自动加入默认房间，方便新手直接看效果
    try {
      const defaultRoom = db.prepare('SELECT id FROM rooms ORDER BY id ASC LIMIT 1').get();
      if (defaultRoom) {
        const defaultRoomId = Number(defaultRoom.id);
        const regRes = db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)').run(defaultRoomId, user.id);
        if (regRes.changes > 0) {
          try {
            broadcastToRoom(defaultRoomId, 'board_updated', {
              action: 'member_joined',
              roomId: defaultRoomId,
              operator: { id: user.id, nickname: user.nickname },
              message: `${user.nickname} 加入了活动！`
            });
          } catch (bcastErr) {
            console.error('Broadcast error:', bcastErr);
          }
        }
      }
    } catch (e) {
      console.error('Auto join room error:', e);
    }

    res.json({ success: true, user, token: String(user.id) });
  } catch (err) {
    console.error('Register API Error:', err);
    return res.status(500).json({ error: '注册失败: ' + (err.message || '服务器处理异常，请重试') });
  }
});

// 2. 用户登录
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;
    const userAccount = (req.body.username || req.body.phone || '').trim();
    if (!userAccount || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT id, phone, nickname, color_index, created_at FROM users WHERE phone = ? AND password = ?').get(userAccount, password);
    if (!user) {
      return res.status(400).json({ error: '用户名或密码不正确' });
    }

    user.id = Number(user.id);
    user.color_index = Number(user.color_index || 0);
    user.colorTheme = getColorForUser(user.color_index);
    user.username = user.phone;
    res.json({ success: true, user, token: String(user.id) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败: ' + (err.message || '服务器处理异常') });
  }
});

// 3. 获取当前用户信息
router.get('/me', (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: '未登录' });

    const user = db.prepare('SELECT id, phone, nickname, color_index, created_at FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    user.id = Number(user.id);
    user.color_index = Number(user.color_index || 0);
    user.colorTheme = getColorForUser(user.color_index);
    user.username = user.phone;
    res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: '获取用户信息失败: ' + (err.message || '服务器异常') });
  }
});

// 3.1 修改用户昵称
router.put('/users/profile', (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: '未登录' });

    const { nickname } = req.body;
    const cleanNickname = (nickname || '').replace(/\s*[\(（]我[\)）]+/g, '').trim();
    if (!cleanNickname) {
      return res.status(400).json({ error: '请填写新昵称' });
    }
    if (cleanNickname.length > 8) {
      return res.status(400).json({ error: '用户昵称长度不能超过8个字' });
    }

    // 检查是否与当前用户原有昵称相同（若是则直接成功返回）
    const currentUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
    if (currentUser && currentUser.nickname === cleanNickname) {
      const user = db.prepare('SELECT id, phone, nickname, color_index, created_at FROM users WHERE id = ?').get(userId);
      user.id = Number(user.id);
      user.color_index = Number(user.color_index || 0);
      user.colorTheme = getColorForUser(user.color_index);
      return res.json({ success: true, user });
    }

    // 昵称全局唯一性校验：不能与其他已存在用户重名
    const existNick = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(nickname)) = LOWER(TRIM(?)) AND id != ?').get(cleanNickname, userId);
    if (existNick) {
      return res.status(400).json({ error: `该昵称「${cleanNickname}」已被其他用户使用，请换一个昵称` });
    }

    db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(cleanNickname, userId);
    const user = db.prepare('SELECT id, phone, nickname, color_index, created_at FROM users WHERE id = ?').get(userId);
    user.id = Number(user.id);
    user.color_index = Number(user.color_index || 0);
    user.colorTheme = getColorForUser(user.color_index);

    // 向用户参与的所有活动广播改名事件，实时协同同步
    const userRooms = db.prepare('SELECT room_id FROM room_members WHERE user_id = ?').all(userId);
    for (const r of userRooms) {
      broadcastToRoom(r.room_id, 'board_updated', {
        action: 'member_renamed',
        roomId: r.room_id,
        operator: { id: user.id, nickname: cleanNickname },
        message: `成员修改了昵称为【${cleanNickname}】`
      });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: '修改昵称失败: ' + (err.message || '服务器异常') });
  }
});

// 4. 获取用户参与的所有活动列表 (支持进行中与已归档分类)
router.get('/rooms', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const rooms = db.prepare(`
    SELECT r.id, r.code, r.title, r.creator_id, r.created_at, COALESCE(r.is_archived, 0) as is_archived,
           (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) as member_count,
           (SELECT COUNT(*) FROM items i WHERE i.room_id = r.id) as item_count
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    WHERE rm.user_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);

  rooms.forEach(r => {
    r.is_archived = Boolean(r.is_archived);
    r.display_code = r.is_archived ? '已释放' : r.code;
  });

  res.json({ rooms });
});

// 5. 创建新活动/房间
router.post('/rooms/create', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: '请输入活动名称' });
  }

  // 生成6位不重复纯数字邀请码 (100000 ~ 999999)
  let code = '';
  for (let attempt = 0; attempt < 20; attempt++) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    const exist = db.prepare('SELECT id FROM rooms WHERE code = ?').get(code);
    if (!exist) break;
  }

  const roomRes = db.prepare('INSERT INTO rooms (code, title, creator_id) VALUES (?, ?, ?)').run(code, title.trim(), userId);
  const roomId = roomRes.lastInsertRowid;

  // 创建者自动加入，清单默认保持空白，由用户自行输入添加
  db.prepare('INSERT INTO room_members (room_id, user_id) VALUES (?, ?)').run(roomId, userId);

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  res.json({ success: true, room });
});

// 5.1 获取活动公开预览信息（供微信/网页分享点开时免登录预览活动名和邀请人）
router.get('/rooms/preview', (req, res) => {
  const { code, id } = req.query;
  let room = null;
  if (code) {
    room = db.prepare(`
      SELECT r.id, r.code, r.title, r.created_at, u.nickname as creator_name
      FROM rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.code = ?
    `).get(String(code).trim());
  } else if (id) {
    room = db.prepare(`
      SELECT r.id, r.code, r.title, r.created_at, u.nickname as creator_name
      FROM rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?
    `).get(parseInt(id, 10));
  }

  if (!room) {
    return res.status(404).json({ error: '未找到该活动或邀请码已失效' });
  }

  const memberCount = db.prepare('SELECT COUNT(*) as count FROM room_members WHERE room_id = ?').get(room.id).count;
  room.member_count = memberCount;
  res.json({ success: true, room });
});

// 6. 输入6位数字邀请码加入活动
router.post('/rooms/join', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const { code } = req.body;
  const cleanCode = (code || '').trim();
  if (!cleanCode || !/^\d{6}$/.test(cleanCode)) {
    return res.status(400).json({ error: '请输入6位纯数字邀请码' });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE code = ? AND (is_archived = 0 OR is_archived IS NULL)').get(cleanCode);
  if (!room) return res.status(404).json({ error: '未找到该邀请码对应的活动或活动已归档失效' });

  db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)').run(room.id, userId);
  // 新用户加入活动，清单默认保持空白，由用户自行输入添加

  const joinUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
  if (joinUser) {
    broadcastToRoom(room.id, 'board_updated', {
      action: 'member_joined',
      roomId: room.id,
      operator: { id: joinUser.id, nickname: joinUser.nickname },
      message: `${joinUser.nickname} 加入了活动！`
    });
  }

  res.json({ success: true, room });
});

// 6.2 归档活动并释放房间号（仅创建者有权操作）
router.post('/rooms/:roomId/archive', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const roomId = parseInt(req.params.roomId, 10);
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: '活动不存在' });

  // 仅活动创建者有权归档
  if (room.creator_id !== userId) {
    return res.status(403).json({ error: '只有活动创建者有权归档该活动' });
  }

  // 释放6位房间邀请码（通过给 code 加 ARCHIVED_ 前缀，释放原本占用的6位纯数字码），并置 is_archived = 1
  const oldCode = room.code;
  db.prepare("UPDATE rooms SET is_archived = 1, code = ('ARCHIVED_' || id) WHERE id = ?").run(roomId);

  const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
  broadcastToRoom(roomId, 'board_updated', {
    action: 'room_archived',
    roomId,
    operator: operatorUser ? { id: operatorUser.id, nickname: operatorUser.nickname } : null,
    message: `活动【${room.title}】已归档，邀请码已释放，已转为只读模式`
  });

  res.json({ success: true, message: '活动已归档并释放房间号', releasedCode: oldCode });
});

// 6.3 恢复已归档活动（仅创建者有权操作，重新分配可用房间号）
router.post('/rooms/:roomId/unarchive', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const roomId = parseInt(req.params.roomId, 10);
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: '活动不存在' });

  // 仅活动创建者有权恢复
  if (room.creator_id !== userId) {
    return res.status(403).json({ error: '只有活动创建者有权恢复该活动' });
  }

  let newCode = '';
  for (let attempt = 0; attempt < 20; attempt++) {
    newCode = String(Math.floor(100000 + Math.random() * 900000));
    const exist = db.prepare('SELECT id FROM rooms WHERE code = ?').get(newCode);
    if (!exist) break;
  }

  db.prepare('UPDATE rooms SET is_archived = 0, code = ? WHERE id = ?').run(newCode, roomId);

  const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
  broadcastToRoom(roomId, 'board_updated', {
    action: 'room_unarchived',
    roomId,
    operator: operatorUser ? { id: operatorUser.id, nickname: operatorUser.nickname } : null,
    message: `活动【${room.title}】已恢复进行中，新邀请码：${newCode}`
  });

  res.json({ success: true, code: newCode });
});

// 6.4 修改活动专属昵称 (首页左上栏修改活动专属群昵称，留空则恢复全局默认昵称)
router.put('/rooms/:roomId/members/nickname', (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: '未登录' });

    const roomId = parseInt(req.params.roomId, 10);
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: '活动不存在' });

    const isMember = db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
    if (!isMember) return res.status(403).json({ error: '您不是该活动成员' });

    const { nickname } = req.body;
    let cleanNick = (nickname || '').replace(/\s*[\(（]我[\)）]+/g, '').trim();

    const currentUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
    if (!currentUser) return res.status(404).json({ error: '用户不存在' });

    let effectiveNickname = '';

    if (cleanNick) {
      if (cleanNick.length > 8) {
        return res.status(400).json({ error: '活动昵称长度不能超过8个字' });
      }

      // 活动内唯一性校验：不能与当前活动其他成员重名
      const otherMembers = db.prepare(`
        SELECT rm.user_id, COALESCE(rm.room_nickname, u.nickname) as display_name
        FROM room_members rm
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = ? AND rm.user_id != ?
      `).all(roomId, userId);

      const conflict = otherMembers.find(m => m.display_name && m.display_name.trim().toLowerCase() === cleanNick.toLowerCase());
      if (conflict) {
        return res.status(400).json({ error: `本活动中已有成员使用「${cleanNick}」，请换一个专属昵称` });
      }

      db.prepare('UPDATE room_members SET room_nickname = ? WHERE room_id = ? AND user_id = ?').run(cleanNick, roomId, userId);
      effectiveNickname = cleanNick;
    } else {
      // 留空则清空专属昵称，恢复使用全局昵称
      effectiveNickname = currentUser.nickname;

      const otherMembers = db.prepare(`
        SELECT rm.user_id, COALESCE(rm.room_nickname, u.nickname) as display_name
        FROM room_members rm
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = ? AND rm.user_id != ?
      `).all(roomId, userId);

      const conflict = otherMembers.find(m => m.display_name && m.display_name.trim().toLowerCase() === effectiveNickname.toLowerCase());
      if (conflict) {
        return res.status(400).json({ error: `您的全局昵称「${effectiveNickname}」与本活动中已有成员重名，请设置专属昵称` });
      }

      db.prepare('UPDATE room_members SET room_nickname = NULL WHERE room_id = ? AND user_id = ?').run(roomId, userId);
    }

    broadcastToRoom(roomId, 'board_updated', {
      action: 'member_renamed',
      roomId,
      operator: { id: userId, nickname: effectiveNickname },
      message: `成员修改活动昵称为【${effectiveNickname}】`
    });

    res.json({ success: true, room_nickname: cleanNick || null, effectiveNickname });
  } catch (err) {
    console.error('Update room nickname error:', err);
    res.status(500).json({ error: '修改活动昵称失败: ' + (err.message || '服务器异常') });
  }
});

// 6.5 修改活动名称（仅活动创建者有权修改）
router.put('/rooms/:roomId/title', (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: '未登录' });

    const roomId = parseInt(req.params.roomId, 10);
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: '活动不存在' });

    if (room.creator_id !== userId) {
      return res.status(403).json({ error: '只有活动创建者可以修改活动名称' });
    }

    const { title } = req.body;
    const cleanTitle = (title || '').trim();
    if (!cleanTitle) {
      return res.status(400).json({ error: '活动名称不能为空' });
    }
    if (cleanTitle.length > 25) {
      return res.status(400).json({ error: '活动名称长度不能超过25个字' });
    }

    db.prepare('UPDATE rooms SET title = ? WHERE id = ?').run(cleanTitle, roomId);

    const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
    broadcastToRoom(roomId, 'board_updated', {
      action: 'room_renamed',
      roomId,
      newTitle: cleanTitle,
      operator: operatorUser ? { id: operatorUser.id, nickname: operatorUser.nickname } : null,
      message: `活动创建者将活动名称修改为【${cleanTitle}】`
    });

    res.json({ success: true, title: cleanTitle });
  } catch (err) {
    console.error('Update room title error:', err);
    res.status(500).json({ error: '修改活动名称失败: ' + (err.message || '服务器异常') });
  }
});

// 6.6 清除活动成员及其物资清单（仅创建者有权操作，用于归档恢复后的活动二次复用）
router.delete('/rooms/:roomId/members/:targetUserId', (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: '未登录' });

    const roomId = parseInt(req.params.roomId, 10);
    const targetUserId = parseInt(req.params.targetUserId, 10);

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: '活动不存在' });

    if (room.creator_id !== userId) {
      return res.status(403).json({ error: '只有活动创建者有权清除成员清单' });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: '创建者不能删除自己的清单' });
    }

    const targetUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(targetUserId);

    // 删除该用户在该活动下的所有物资
    db.prepare('DELETE FROM items WHERE room_id = ? AND user_id = ?').run(roomId, targetUserId);
    // 从活动成员表中移除
    db.prepare('DELETE FROM room_members WHERE room_id = ? AND user_id = ?').run(roomId, targetUserId);

    const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
    const targetName = targetUser ? targetUser.nickname : '成员';

    broadcastToRoom(roomId, 'board_updated', {
      action: 'member_purged',
      roomId,
      targetUserId,
      operator: operatorUser ? { id: operatorUser.id, nickname: operatorUser.nickname } : null,
      message: `活动创建者清除了【${targetName}】的物资清单`
    });

    res.json({ success: true, message: `已清除成员【${targetName}】及其清单` });
  } catch (err) {
    console.error('Purge member error:', err);
    res.status(500).json({ error: '清除成员清单失败: ' + (err.message || '服务器异常') });
  }
});

// 6.1 SSE (Server-Sent Events) 实时推送长链接通道
router.get('/rooms/:roomId/stream', (req, res) => {
  const userId = getAuthUserId(req);
  const roomId = parseInt(req.params.roomId, 10);
  if (!roomId || isNaN(roomId)) {
    return res.status(400).send('Invalid room id');
  }

  // 设置标准 SSE 协议响应头，全面防止反向代理缓存
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 避免反向代理如 Nginx 缓存导致延迟
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders();

  // 关键：立即发送 2KB 空白注释，冲刷 Cloudflare / Nginx 反向代理缓冲区，避免 SSE 数据包滞留
  res.write(': ' + ' '.repeat(2048) + '\n\n');

  const user = userId ? db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId) : null;
  const client = {
    id: `${Date.now()}_${Math.random()}`,
    userId: userId || null,
    res
  };

  addClientToRoom(roomId, client);

  // 立即发送握手联通事件
  const initMsg = {
    type: 'connected',
    roomId,
    user: user ? { id: user.id, nickname: user.nickname } : null,
    time: Date.now()
  };
  res.write(`event: connected\ndata: ${JSON.stringify(initMsg)}\n\n`);

  // 心跳维持，每10秒发送一次 ping，避免手机休眠或反向代理超时断连
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 10000);

  // 客户端断开连接处理
  req.on('close', () => {
    clearInterval(heartbeat);
    removeClientFromRoom(roomId, client);
  });
});

// 7. 获取协同看板数据（核心：我的清单、其他人清单、最终汇总清单）
router.get('/rooms/:roomId/board', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const roomId = parseInt(req.params.roomId, 10);
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: '活动不存在' });
  room.is_archived = Boolean(room.is_archived);
  room.display_code = room.is_archived ? '已释放' : room.code;

  room.is_creator = (Number(room.creator_id) === Number(userId));

  // 验证当前用户是否在此房间，不是则自动加入并全员广播新成员进房
  const memRes = db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)').run(roomId, userId);
  // 新用户加入活动，清单默认保持空白，由用户自行输入添加
  if (memRes.changes > 0) {
    const joinUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
    if (joinUser) {
      broadcastToRoom(roomId, 'board_updated', {
        action: 'member_joined',
        roomId,
        operator: { id: joinUser.id, nickname: joinUser.nickname },
        message: `${joinUser.nickname} 加入了活动！`
      });
    }
  }

  // 获取房间所有成员（按加入房间顺序固定排序，确保房间内每个人分配到的颜色全局唯一且绝对固定，无论是谁查看都完全一致）
  const allRoomMembers = db.prepare(`
    SELECT u.id, u.phone, u.nickname, rm.room_nickname
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = ?
    ORDER BY u.id ASC
  `).all(roomId);

  const membersMap = {};
  allRoomMembers.forEach((m, idx) => {
    // 每个人按在房间内的顺序分配固定的高对比度专属主题配色（全局一致，所有人视角下该成员颜色完全相同）
    m.theme = getColorForUser(idx);
    m.colorTheme = m.theme;
    m.global_nickname = m.nickname;
    m.display_name = m.room_nickname || m.nickname;
    m.nickname = m.display_name;
    membersMap[m.id] = m;
  });

  // 获取房间内所有的物资条目
  const allItems = db.prepare(`
    SELECT i.id, i.room_id, i.user_id, i.name, i.quantity, i.is_checked, i.created_at, i.updated_at,
           COALESCE(rm.room_nickname, u.nickname) as nickname, u.phone, u.color_index
    FROM items i
    JOIN users u ON i.user_id = u.id
    LEFT JOIN room_members rm ON rm.room_id = i.room_id AND rm.user_id = i.user_id
    WHERE i.room_id = ?
    ORDER BY i.created_at DESC
  `).all(roomId);

  // 1. 我的清单
  const myItems = allItems.filter(item => item.user_id === userId);

  // 2. 其他人清单（按用户分组，不包括当前登录的自己）
  const otherMembers = allRoomMembers.filter(m => m.id !== userId);
  const othersItems = otherMembers.map(member => {
    return {
      user: member,
      items: allItems.filter(item => item.user_id === member.id)
    };
  });

  // 3. 最终汇总清单（基于中文模糊语义引擎，将可乐、可乐可乐、百事可乐、冰镇可乐等智能聚类归一化）
  const summaryList = clusterSummaryList(allItems, membersMap, PALETTES[0]);

  res.json({
    room,
    currentUser: membersMap[userId],
    myItems,
    othersItems,
    summaryList
  });
});

// 8. 添加物资（支持单件或批量，个人清单严格禁止重名）
router.post('/items', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const { roomId, name, quantity, items } = req.body;
  const rId = parseInt(roomId, 10);
  if (!rId) return res.status(400).json({ error: '活动ID不能为空' });

  const targetRoom = db.prepare('SELECT is_archived FROM rooms WHERE id = ?').get(rId);
  if (targetRoom && targetRoom.is_archived) {
    return res.status(400).json({ error: '该活动已归档，处于只读状态，禁止添加物资' });
  }

  const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);

  if (Array.isArray(items) && items.length > 0) {
    // 批量添加（如从推荐库多选导入）
    // 获取当前用户在该房间已有物资名称，过滤掉已有的同名物资
    const existingRows = db.prepare('SELECT TRIM(name) as name FROM items WHERE room_id = ? AND user_id = ?').all(rId, userId);
    const existingNames = new Set(existingRows.map(r => r.name.toLowerCase()));

    const uniqueBatch = [];
    const seenInBatch = new Set();
    for (const it of items) {
      if (it && it.name && it.name.trim()) {
        const n = it.name.trim();
        const lower = n.toLowerCase();
        const isDup = existingRows.some(r => {
          const comp = compareSemantic(n, r.name);
          return comp.isMatch && (comp.level === 'EXACT' || comp.level === 'STUTTER');
        });
        if (!isDup && !seenInBatch.has(lower)) {
          seenInBatch.add(lower);
          uniqueBatch.push({ name: n, quantity: it.quantity || 1 });
        }
      }
    }

    if (uniqueBatch.length === 0) {
      return res.status(400).json({ error: '所选物资已全部存在于您的个人清单中，不可重复添加' });
    }

    const insertStmt = db.prepare('INSERT INTO items (room_id, user_id, name, quantity) VALUES (?, ?, ?, ?)');
    for (const it of uniqueBatch) {
      insertStmt.run(rId, userId, it.name, it.quantity || 1);
    }

    if (operatorUser) {
      broadcastToRoom(rId, 'board_updated', {
        action: 'batch_imported',
        roomId: rId,
        operator: { id: operatorUser.id, nickname: operatorUser.nickname },
        count: uniqueBatch.length,
        message: `${operatorUser.nickname} 批量导入了 ${uniqueBatch.length} 件推荐物资`
      });
    }

    return res.json({ success: true, count: uniqueBatch.length });
  }

  // 单个添加
  const cleanItemName = name ? name.trim() : '';
  if (!cleanItemName) {
    return res.status(400).json({ error: '请输入物资名称' });
  }

  // 严格查重：个人清单内不允许出现名称完全重复或叠词重复
  const userItems = db.prepare('SELECT id, name FROM items WHERE room_id = ? AND user_id = ?').all(rId, userId);
  for (const it of userItems) {
    const comp = compareSemantic(cleanItemName, it.name);
    if (comp.isMatch && comp.level === 'EXACT') {
      return res.status(400).json({ error: `您的清单中已存在【${cleanItemName}】，不可重复添加` });
    }
    if (comp.isMatch && comp.level === 'STUTTER') {
      return res.status(400).json({ error: `检测到叠词重复输入，您的清单中已存在【${it.name}】` });
    }
  }

  const insert = db.prepare('INSERT INTO items (room_id, user_id, name, quantity) VALUES (?, ?, ?, ?)').run(
    rId,
    userId,
    cleanItemName,
    parseInt(quantity, 10) || 1
  );

  const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(insert.lastInsertRowid);

  if (operatorUser) {
    broadcastToRoom(rId, 'board_updated', {
      action: 'item_added',
      roomId: rId,
      operator: { id: operatorUser.id, nickname: operatorUser.nickname },
      item: newItem,
      message: `${operatorUser.nickname} 添加了【${newItem.name} ×${newItem.quantity}】`
    });
  }

  res.json({ success: true, item: newItem });
});

// 9. 修改物资名称和数量
router.put('/items/:id', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const itemId = parseInt(req.params.id, 10);
  const { name, quantity } = req.body;

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  if (!item) return res.status(404).json({ error: '物资不存在' });

  const targetRoom = db.prepare('SELECT is_archived FROM rooms WHERE id = ?').get(item.room_id);
  if (targetRoom && targetRoom.is_archived) {
    return res.status(400).json({ error: '该活动已归档，处于只读状态，禁止修改物资' });
  }

  if (item.user_id !== userId) {
    return res.status(403).json({ error: '只能修改自己准备的物资' });
  }

  const cleanItemName = name ? name.trim() : '';
  if (!cleanItemName) {
    return res.status(400).json({ error: '物资名称不能为空' });
  }

  // 严格查重：修改时不能与个人清单中的其他已有物资同名或叠词重复
  const otherUserItems = db.prepare('SELECT id, name FROM items WHERE room_id = ? AND user_id = ? AND id != ?').all(item.room_id, userId, itemId);
  for (const it of otherUserItems) {
    const comp = compareSemantic(cleanItemName, it.name);
    if (comp.isMatch && comp.level === 'EXACT') {
      return res.status(400).json({ error: `您的清单中已存在同名物资【${cleanItemName}】，不可重复命名` });
    }
    if (comp.isMatch && comp.level === 'STUTTER') {
      return res.status(400).json({ error: `修改名称与已有物资【${it.name}】构成叠词重复` });
    }
  }

  db.prepare(`
    UPDATE items 
    SET name = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(cleanItemName, parseInt(quantity, 10) || 1, itemId);

  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);

  if (operatorUser) {
    broadcastToRoom(item.room_id, 'board_updated', {
      action: 'item_edited',
      roomId: item.room_id,
      operator: { id: operatorUser.id, nickname: operatorUser.nickname },
      item: updated,
      message: `${operatorUser.nickname} 修改了【${updated.name}】`
    });
  }

  res.json({ success: true, item: updated });
});

// 10. 删除物资
router.delete('/items/:id', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const itemId = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  if (!item) return res.status(404).json({ error: '物资不存在' });

  const targetRoom = db.prepare('SELECT is_archived FROM rooms WHERE id = ?').get(item.room_id);
  if (targetRoom && targetRoom.is_archived) {
    return res.status(400).json({ error: '该活动已归档，处于只读状态，禁止删除物资' });
  }

  if (item.user_id !== userId) {
    return res.status(403).json({ error: '只能删除自己准备的物资' });
  }

  const roomId = item.room_id;
  const deletedName = item.name;
  db.prepare('DELETE FROM items WHERE id = ?').run(itemId);

  const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
  if (operatorUser) {
    broadcastToRoom(roomId, 'board_updated', {
      action: 'item_deleted',
      roomId: roomId,
      operator: { id: operatorUser.id, nickname: operatorUser.nickname },
      itemName: deletedName,
      message: `${operatorUser.nickname} 删除了【${deletedName}】`
    });
  }

  res.json({ success: true });
});

// 11. 切换核对打钩状态（清单核对页：仅允许勾选确认自己准备的物资）
router.patch('/items/:id/check', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: '未登录' });

  const itemId = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  if (!item) return res.status(404).json({ error: '物资不存在' });

  const targetRoom = db.prepare('SELECT is_archived FROM rooms WHERE id = ?').get(item.room_id);
  if (targetRoom && targetRoom.is_archived) {
    return res.status(400).json({ error: '该活动已归档，处于只读状态，禁止修改装车状态' });
  }

  if (item.user_id !== userId) {
    return res.status(403).json({ error: '只能勾选确认自己准备的物资' });
  }

  const { isChecked } = req.body;
  db.prepare('UPDATE items SET is_checked = ? WHERE id = ?').run(isChecked ? 1 : 0, itemId);

  const operatorUser = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
  if (operatorUser) {
    broadcastToRoom(item.room_id, 'board_updated', {
      action: 'item_checked',
      roomId: item.room_id,
      operator: { id: operatorUser.id, nickname: operatorUser.nickname },
      item: { id: item.id, name: item.name, is_checked: isChecked ? 1 : 0 },
      message: `${operatorUser.nickname} ${isChecked ? '装车完成了' : '取消了'}【${item.name}】`
    });
  }

  res.json({ success: true });
});

// 12. 获取露营推荐模板库
router.get('/templates', (req, res) => {
  const list = db.prepare('SELECT * FROM recommend_templates ORDER BY id ASC').all();
  // 按分类组合
  const categories = {};
  list.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  res.json({
    templates: list,
    categories: Object.keys(categories).map(catName => ({
      category: catName,
      items: categories[catName]
    }))
  });
});

// 13. 系统与网络信息（方便真机调试）
router.get('/system/info', (req, res) => {
  const os = require('os');
  let localIP = 'localhost';
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }
  const inviteBaseUrl = process.env.PUBLIC_URL || process.env.INVITE_DOMAIN || 'http://luying.22182214.xyz';
  res.json({
    localIP,
    port: 3000,
    mobileUrl: `http://${localIP}:3000`,
    inviteBaseUrl
  });
});

module.exports = router;

