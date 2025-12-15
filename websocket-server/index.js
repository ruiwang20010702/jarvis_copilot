/**
 * Jarvis WebSocket 同步服务器 - Zeabur 部署版
 * 
 * 功能：
 * - 跨设备实时状态同步
 * - 房间状态管理
 * - 自动心跳检测
 * - HTTP 健康检查端点
 */

const http = require('http');
const WebSocket = require('ws');

// Zeabur 会自动分配 PORT 环境变量
const PORT = process.env.PORT || 8080;

// 创建 HTTP 服务器 (用于健康检查和 WebSocket 升级)
const server = http.createServer((req, res) => {
    // 健康检查端点
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'jarvis-websocket-server',
            clients: clients.size,
            uptime: process.uptime()
        }));
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 存储所有连接的客户端
const clients = new Map();

// 房间状态 (用于新客户端加入时同步完整状态)
let roomState = {};

console.log(`🚀 Jarvis WebSocket 服务器启动中...`);

wss.on('connection', (ws, req) => {
    // 为每个客户端生成唯一ID
    const clientId = Math.random().toString(36).substring(7);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    clients.set(clientId, {
        ws,
        ip: clientIp,
        role: null,
        connectedAt: new Date()
    });

    console.log(`✅ 客户端已连接: ${clientId} (${clientIp})`);
    console.log(`📊 当前连接数: ${clients.size}`);

    // 发送欢迎消息和客户端ID
    ws.send(JSON.stringify({
        type: 'WELCOME',
        clientId,
        connectedClients: clients.size,
        timestamp: Date.now()
    }));

    // 如果有房间状态，同步给新客户端
    if (Object.keys(roomState).length > 0) {
        ws.send(JSON.stringify({
            type: 'FULL_STATE',
            payload: roomState,
            timestamp: Date.now()
        }));
        console.log(`📦 向 ${clientId} 同步完整状态`);
    }

    // 处理接收到的消息
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            // 记录角色
            if (message.role && !clients.get(clientId).role) {
                clients.get(clientId).role = message.role;
                console.log(`🎭 ${clientId} 角色设定: ${message.role}`);
            }

            // 处理状态更新
            if (message.type === 'STATE_UPDATE') {
                // 更新房间状态
                roomState = { ...roomState, ...message.payload };

                console.log(`📤 ${clientId} (${message.role || 'unknown'}) 广播:`, Object.keys(message.payload).join(', '));

                // 广播给其他所有客户端
                clients.forEach((client, id) => {
                    if (id !== clientId && client.ws.readyState === WebSocket.OPEN) {
                        client.ws.send(JSON.stringify({
                            type: 'STATE_UPDATE',
                            payload: message.payload,
                            senderId: clientId,
                            senderRole: message.role,
                            timestamp: Date.now()
                        }));
                    }
                });
            }

            // 处理完整状态同步请求
            if (message.type === 'REQUEST_FULL_STATE') {
                ws.send(JSON.stringify({
                    type: 'FULL_STATE',
                    payload: roomState,
                    timestamp: Date.now()
                }));
            }

            // 处理重置房间请求
            if (message.type === 'RESET_ROOM') {
                console.log(`🔄 ${clientId} (${message.role || 'unknown'}) 请求重置房间`);

                // 清空房间状态
                roomState = {};

                // 通知所有客户端重置
                clients.forEach((client, id) => {
                    if (client.ws.readyState === WebSocket.OPEN) {
                        client.ws.send(JSON.stringify({
                            type: 'ROOM_RESET',
                            senderId: clientId,
                            senderRole: message.role,
                            timestamp: Date.now()
                        }));
                    }
                });

                console.log(`✅ 房间已重置，已通知 ${clients.size} 个客户端`);
            }

        } catch (error) {
            console.error(`❌ 消息解析错误:`, error.message);
        }
    });

    // 处理连接关闭
    ws.on('close', () => {
        const client = clients.get(clientId);
        console.log(`❌ 客户端已断开: ${clientId} (${client?.role || 'unknown'})`);
        clients.delete(clientId);
        console.log(`📊 当前连接数: ${clients.size}`);
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error(`⚠️ 客户端 ${clientId} 错误:`, error.message);
    });
});

// 定期心跳检测
setInterval(() => {
    clients.forEach((client, id) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.ping();
        }
    });
}, 30000);

// 启动服务器
server.listen(PORT, () => {
    console.log(`🚀 Jarvis WebSocket 服务器已启动`);
    console.log(`📡 监听端口: ${PORT}`);
    console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
    console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    wss.close(() => {
        server.close(() => {
            console.log('✅ 服务器已关闭');
            process.exit(0);
        });
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 收到 SIGTERM，正在关闭...');
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});
