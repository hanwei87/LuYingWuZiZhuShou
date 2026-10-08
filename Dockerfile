# 默认使用稳定的国内镜像代理（彻底解决飞牛OS默认加速源 docker.fnnas.com 报 401 Unauthorized 的问题）
# 若未来源有变动，也可以直接替换前缀（例如 hub.rat.dev 或 dockerpull.org）
ARG BASE_IMAGE=docker.m.daocloud.io/library/node:22-alpine
FROM ${BASE_IMAGE}

# 换用国内中科大 Alpine 源加速 tzdata 安装，并配置上海时区
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories 2>/dev/null || true && \
    apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

WORKDIR /app

# 优先安装依赖，配置 npm 淘宝/腾讯国内镜像源加速
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --omit=dev

# 拷贝项目源码
COPY . .

# 暴露端口
EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production \
    TZ=Asia/Shanghai

# 启动服务：启用 --watch-path=server 原生热重载，检测到 server 目录覆盖改动即秒级重启
CMD ["node", "--watch-path=server", "server/index.js"]

