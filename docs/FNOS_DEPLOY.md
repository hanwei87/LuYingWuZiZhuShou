# 飞牛 OS (fnOS) Docker 部署与代码热更新指南

本文档专门针对在 **飞牛 OS (fnOS)** NAS 环境中运行测试「大家一起选」应用，并实现**代码与静态资源实时热挂载、随时覆盖即生效**。

---

## 一、部署前准备

将整个项目目录（`大家一起选`）通过飞牛 OS 网页文件管理、SMB 共享文件夹或 SFTP 传输到飞牛 NAS 的 Docker 存储路径中。

**推荐存放路径示例**：
```text
/vol1/1000/docker/dajia-yiqi-xuan/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── package.json
├── public/          <-- 静态资源目录 (HTML/CSS/JS)
├── server/          <-- 服务端源码 (Node.js)
└── data/            <-- 数据库目录 (自动保存 dajia.db)
```

---

## 二、部署方式 (二选一)

### 方式 1：通过飞牛 OS 桌面端【Docker 图形化界面】部署（推荐）

1. **打开 Docker 应用**：进入飞牛 OS 桌面，点击打开 **Docker** 应用；
2. **进入 Compose 页面**：在左侧导航栏点击 **Compose**（项目）；
3. **新增项目**：
   * 点击右上角 **「新增项目」** / **「添加」**；
   * **项目名称**：输入 `dajia-yiqi-xuan`；
   * **项目路径**：选择刚刚上传代码的文件夹路径（如 `/vol1/1000/docker/dajia-yiqi-xuan`）；
   * **YAML 内容**：飞牛 OS 会自动识别读取该目录下的 `docker-compose.yml`，若未自动读取可直接粘贴文件内容；
4. **构建并启动**：点击 **「立即创建并启动」**，飞牛 OS 将自动根据 `Dockerfile` 构建轻量容器并启动运行。

---

### 方式 2：通过 SSH 终端命令行一键部署

如果您习惯使用 SSH 连接飞牛 NAS：

```bash
# 1. 进入项目所在目录
cd /vol1/1000/docker/dajia-yiqi-xuan

# 2. 一键构建并后台启动容器
docker compose up -d --build

# 3. 查看容器运行状态与日志
docker compose logs -f
```

---

## 三、实时热挂载与“随时覆盖即使用”机制

本项目配置了容器热挂载（Volume Mounts），无需反复重建容器：

```yaml
volumes:
  - ./public:/app/public   # 前端热挂载
  - ./server:/app/server   # 后端热挂载
  - ./data:/app/data       # 数据持久化
  - /app/node_modules      # 容器依赖隔离
```

### 1. 更新前端静态页面 / 样式 / 交互（HTML、CSS、JS）
* **操作**：通过电脑 SMB、WebDav 或飞牛文件管理，直接将修改后的 `public/index.html`、`public/css/style.css`、`public/js/app.js` 等覆盖到 NAS 对应文件夹；
* **生效方式**：**立即生效**，无需重启容器！手机或电脑浏览器直接刷新页面即可看到最新界面与交互。

### 2. 更新后端业务接口 / 逻辑（Node.js / Express）
* **操作**：直接将新的 `server/routes.js`、`server/db.js` 等覆盖到 NAS 的 `server/` 目录；
* **生效方式**：容器启动命令配置了 Node.js 22 原生监听 `--watch-path=server`，一旦检测到文件写入覆盖，**后端进程在 0.5 秒内自动热重启加载最新代码**，终端完全无需手动干预。

### 3. 数据持久化保护（SQLite 数据库）
* 数据库文件将持久保存在宿主机的 `data/dajia.db`；
* 无论何时更新代码、重启容器或重建项目，**历史好友清单数据、房间数据均完整保留不会丢失**。

---

## 四、访问与多手机协同测试

1. **电脑浏览器访问**：
   ```text
   http://<你的飞牛NAS局域网IP>:3000
   # 例如：http://192.168.1.100:3000
   ```
2. **多台手机局域网测试**：
   * 确保手机连入同一个家庭或办公 Wi-Fi；
   * 打开手机浏览器输入 `http://<你的飞牛NAS局域网IP>:3000`；
   * 手机 A 输入邀请码加入活动，手机 B 在另一端添加物资，由于已集成 SSE (Server-Sent Events) 长连接，手机 A 屏幕将零刷新即刻跳出更新！

---

## 五、常见问题与注意事项

* **为什么拉取/构建时提示 `https://docker.fnnas.com/...: 401 Unauthorized`？**
  * **原因**：飞牛 OS 系统预设的内置官方加速源 `docker.fnnas.com` 近期失效或限制访问，导致尝试 HEAD 请求时被拒绝并返回 401 错误；
  * **解决方案 A（最推荐，已内置修复）**：
    当前项目的 `Dockerfile` 已经默认切换至稳定国内加速源：
    ```dockerfile
    ARG BASE_IMAGE=docker.m.daocloud.io/library/node:22-alpine
    FROM ${BASE_IMAGE}
    ```
    您只需**直接将本次更新后的 `Dockerfile` 覆盖到飞牛 NAS 对应项目目录**，重新点击构建或启动即可立即拉取成功！
  * **解决方案 B（飞牛 OS 全局修复，一劳永逸）**：
    1. 打开飞牛 OS 网页端 -> 进入 **Docker** 应用；
    2. 点击左侧 **「镜像仓库」** -> 点击右上角 **「设置 / 齿轮图标」**；
    3. 在「加速源」列表中，找到失效的 `https://docker.fnnas.com`，点击右侧将其**删除**或**禁用**；
    4. 点击「添加」，填入目前稳定可用的国内加速源（例如 `https://docker.m.daocloud.io` 或 `https://hub.rat.dev`）；
    5. 保存后 Docker 守护进程将自动重启生效。

* **端口被占用怎么办？**
  如果飞牛 NAS 上的 `3000` 端口已被其他容器占用，只需编辑 `docker-compose.yml` 中的端口映射：
  ```yaml
  ports:
    - "8088:3000"   # 将外部访问端口改成 8088 或其他未占用的端口
  ```
  保存后重新点击飞牛 OS 里的“更新/启动”即可。

* **为什么不需要在宿主机安装 Node.js？**
  Docker 容器内部已内置完整的 Node.js 22 运行时和原生 SQLite 驱动，飞牛 OS 宿主机无需安装任何编程环境。

