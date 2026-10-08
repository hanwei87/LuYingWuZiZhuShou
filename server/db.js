const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  fs.chmodSync(dataDir, 0o777);
} catch (e) {}

const dbPath = path.join(dataDir, 'dajia.db');
try {
  if (fs.existsSync(dbPath)) {
    fs.chmodSync(dbPath, 0o666);
  }
} catch (e) {}

const db = new DatabaseSync(dbPath);

// 初始化数据表结构
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    password TEXT NOT NULL,
    color_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS room_members (
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_checked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS recommend_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '⛺',
    unit TEXT DEFAULT '件'
  );
`);

// 检查是否已有推荐模板，若无则初始化露营推荐模板库
const countTemplates = db.prepare('SELECT COUNT(*) as cnt FROM recommend_templates').get();
if (countTemplates.cnt === 0) {
  const insertTpl = db.prepare('INSERT INTO recommend_templates (category, name, icon, unit) VALUES (?, ?, ?, ?)');
  
  const presets = [
    // 睡眠与栖居
    { category: '栖居与装备', name: '双人帐篷', icon: '⛺', unit: '顶' },
    { category: '栖居与装备', name: '天幕/遮阳篷', icon: '⛱️', unit: '个' },
    { category: '栖居与装备', name: '防潮地垫', icon: '🟩', unit: '张' },
    { category: '栖居与装备', name: '充气床垫+打气筒', icon: '🛏️', unit: '套' },
    { category: '栖居与装备', name: '睡袋/薄毯', icon: '🛏️', unit: '个' },
    { category: '栖居与装备', name: '折叠月亮椅', icon: '🪑', unit: '把' },
    { category: '栖居与装备', name: '折叠蛋卷桌', icon: '🪵', unit: '张' },
    { category: '栖居与装备', name: '加长地钉与风绳', icon: '🪢', unit: '包' },
    
    // 烹饪炊具与食材
    { category: '美食与炊具', name: '羊肉串', icon: '🍢', unit: '把' },
    { category: '美食与炊具', name: '卡式炉', icon: '🔥', unit: '台' },
    { category: '美食与炊具', name: '便携气罐(多瓶)', icon: '🥫', unit: '箱' },
    { category: '美食与炊具', name: '烤肉盘/不粘锅', icon: '🍳', unit: '个' },
    { category: '美食与炊具', name: '五花肉片', icon: '🥩', unit: '盒' },
    { category: '美食与炊具', name: '生菜与黄瓜', icon: '🥬', unit: '袋' },
    { category: '美食与炊具', name: '烧烤调料/海盐黑椒', icon: '🧂', unit: '套' },
    { category: '美食与炊具', name: '大桶饮用水(5L)', icon: '💧', unit: '桶' },
    { category: '美食与炊具', name: '冰镇啤酒/饮料', icon: '🥤', unit: '提' },
    { category: '美食与炊具', name: '保温箱+冰块', icon: '🧊', unit: '个' },
    { category: '美食与炊具', name: '一次性环保碗筷纸盘', icon: '🥢', unit: '套' },

    // 照明与水电
    { category: '照明与动力', name: '营地主灯', icon: '💡', unit: '盏' },
    { category: '照明与动力', name: '氛围串灯', icon: '✨', unit: '条' },
    { category: '照明与动力', name: '强光手电筒', icon: '🔦', unit: '支' },
    { category: '照明与动力', name: '大容量移动电源/户外电源', icon: '🔋', unit: '台' },
    { category: '照明与动力', name: '充电线多合一', icon: '🔌', unit: '条' },

    // 清洁卫生与防护
    { category: '防护与清洁', name: '加厚大号垃圾袋', icon: '🗑️', unit: '卷' },
    { category: '防护与清洁', name: '驱蚊喷雾/花露水', icon: '🦟', unit: '瓶' },
    { category: '防护与清洁', name: '湿纸巾/抽取式纸巾', icon: '🧻', unit: '提' },
    { category: '防护与清洁', name: '便携急救包(碘伏/创口贴)', icon: '🩹', unit: '盒' },
    { category: '防护与清洁', name: '户外洗洁精与海绵', icon: '🧽', unit: '套' },
  ];

  for (const item of presets) {
    insertTpl.run(item.category, item.name, item.icon, item.unit);
  }
}

// 检查是否已有测试用户，若无则初始化预设测试数据，以便用户立刻体验
const countUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
if (countUsers.cnt === 0) {
  const insertUser = db.prepare('INSERT INTO users (phone, nickname, password, color_index) VALUES (?, ?, ?, ?)');
  insertUser.run('13800000001', '小明', '123456', 0);
  insertUser.run('13800000002', '大山', '123456', 1);
  insertUser.run('13800000003', '阿杰', '123456', 2);
  insertUser.run('13800000004', '露露', '123456', 3);

  // 创建默认露营活动 (6位随机数字)
  const insertRoom = db.prepare('INSERT INTO rooms (code, title, creator_id) VALUES (?, ?, ?)');
  insertRoom.run('893215', '仙居山谷周末露营', 1);

  // 添加成员
  const insertMember = db.prepare('INSERT INTO room_members (room_id, user_id) VALUES (?, ?)');
  insertMember.run(1, 1);
  insertMember.run(1, 2);
  insertMember.run(1, 3);
  insertMember.run(1, 4);

  // 初始化物资条目（故意制造“羊肉串”撞车重复场景！）
  const insertItem = db.prepare('INSERT INTO items (room_id, user_id, name, quantity) VALUES (?, ?, ?, ?)');
  // 小明准备的
  insertItem.run(1, 1, '羊肉串', 2);
  insertItem.run(1, 1, '双人帐篷', 1);
  insertItem.run(1, 1, '卡式炉', 1);
  insertItem.run(1, 1, '便携急救包', 1);

  // 大山准备的 (羊肉串重复！卡式炉重复！)
  insertItem.run(1, 2, '羊肉串', 3);
  insertItem.run(1, 2, '折叠蛋卷桌', 1);
  insertItem.run(1, 2, '露营氛围灯', 2);
  insertItem.run(1, 2, '大桶饮用水(5L)', 2);

  // 阿杰准备的
  insertItem.run(1, 3, '生菜与黄瓜', 1);
  insertItem.run(1, 3, '便携气罐(多瓶)', 4);
  insertItem.run(1, 3, '加厚大号垃圾袋', 1);
  insertItem.run(1, 3, '冰镇啤酒/饮料', 2);

  // 露露准备的
  insertItem.run(1, 4, '天幕/遮阳篷', 1);
  insertItem.run(1, 4, '折叠月亮椅', 2);
  insertItem.run(1, 4, '驱蚊喷雾/花露水', 1);
}

// 兼容迁移 1：将已存在的旧英文字母邀请码更新为6位纯数字
try {
  db.prepare("UPDATE rooms SET code = '893215' WHERE code = 'CAMP88'").run();
} catch (e) {
  // ignore
}

// 兼容迁移 2：清理历史数据库中昵称内残留的“(我)”或“（我）”，杜绝前端叠加导致重复
try {
  db.prepare(`
    UPDATE users 
    SET nickname = TRIM(REPLACE(REPLACE(REPLACE(REPLACE(nickname, ' (我)', ''), '(我)', ''), ' （我）', ''), '（我）', '')) 
    WHERE nickname LIKE '%(我)%' OR nickname LIKE '%（我）%'
  `).run();
} catch (e) {
  // ignore
}

// 兼容迁移 3：个人清单禁止重名！清理历史同用户同房间下的重名物资，并建立唯一约束索引
try {
  db.prepare(`
    DELETE FROM items 
    WHERE id NOT IN (
      SELECT MIN(id) 
      FROM items 
      GROUP BY room_id, user_id, TRIM(name)
    )
  `).run();

  db.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_items_unique_user_name 
    ON items (room_id, user_id, name)
  `).run();
} catch (e) {
  console.error('Failed to create unique index for items:', e);
}

// 兼容迁移 4：活动表新增 is_archived 字段（支持活动归档与释放房间号）
try {
  db.exec('ALTER TABLE rooms ADD COLUMN is_archived INTEGER DEFAULT 0;');
} catch (e) {
  // column already exists
}

// 兼容迁移 5：保证用户昵称唯一性，清洗重复历史数据并创建唯一索引
try {
  db.exec("UPDATE users SET nickname = '营地向导老李' WHERE id = 9 AND nickname = '营地向导老王';");
  db.exec("UPDATE users SET nickname = '小明' WHERE id = 1;");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_unique ON users(nickname);");
} catch (e) {
  // index already exists or duplicates resolved
}

// 兼容迁移 6：支持活动内专属昵称（群昵称）
try {
  db.exec('ALTER TABLE room_members ADD COLUMN room_nickname TEXT DEFAULT NULL;');
} catch (e) {
  // column already exists
}

module.exports = db;
