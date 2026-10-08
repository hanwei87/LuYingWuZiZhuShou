const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 支持 BigInt 在 JSON.stringify 中安全序列化为普通数字，杜绝 SQLite BigInt 导致的序列化异常崩溃
if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
  };
}

// 静态前端资源托管
app.use(express.static(path.join(__dirname, '../public')));

// API 路由
app.use('/api', apiRoutes);

// 单页前端兜底路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 全局异常兜底：统一返回标准 JSON，彻底杜绝返回 HTML 错误页面
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    error: err.message || '服务器内部处理异常，请稍后重试'
  });
});

// 获取局域网 IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`\n==============================================`);
  console.log(`🏕️  【露营物资助手】露营协同应用 服务已启动！`);
  console.log(`📱 电脑端访问: http://localhost:${PORT}`);
  console.log(`📲 手机端同一WiFi访问: http://${localIP}:${PORT}`);
  console.log(`==============================================\n`);
});
