/// <reference types="vite/client" />

/**
 * WebSocket 跨设备状态同步模块
 * 用于在不同设备之间通过 WebSocket 服务器同步 Zustand store 状态
 */

import { useGameStore } from '../store';

// WebSocket 服务器地址 (优先使用环境变量)
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

// 需要同步的状态字段（排除函数和临时状态）
const SYNC_KEYS = [
    'currentStage',
    'messages',
    'quickReplies',
    'lookups',
    'highlights',
    'quizAnswers',
    'scrollProgress',
    'focusParagraphIndex',
    'isRecording',
    'currentCorrectionQuestionId',
    'coachingStep',
    'activeTask',
    'stuckCount',
    // Coaching Phase 3 State
    'coachingPhase',
    'coachingTaskType',
    'coachingTaskReceived',
    'coachingTaskCompleted',
    'teacherHighlights',
    'studentHighlights',
    'gpsCardReceived',
    'studentVoiceAnswer',
    // Vocab Phase 4 State
    'vocabList',
    'vocabStatus',
    'currentVocabIndex',
    'phase4Step',
    'exitPassStep',
    'remedialQueue',
    'remedialIndex',
    'vocabCardFlipped',
    'reviewingVocabWord',
    'isSyllableMode',
    'isPlayingAudio',
    'vocabSpeakEnabled',
    // Surgery Phase 5 State
    'surgeryMode',
    'surgeryChunks',
    // Review Stage
    'reviewReportGenerated',
    // Skill Stage (Phase 2)
    'skillNode',
    'studentHasEquipped',
    'studentConfirmedFormula',
    'studentDemoStep',
    'demoTeacherStep',
    // Skill Quiz State
    'skillQuizHighlightedWords',
    'skillQuizSelectedAnswer',
    'skillQuizAnswerCorrect',
    'skillQuizStartTime',
    'currentQuizIndex',
    'quizResults',
    'quizCompleted',
    'skillQuizWrongAttempt'
] as const;

type SyncKey = typeof SYNC_KEYS[number];
type SyncPayload = Partial<Record<SyncKey, unknown>>;

// 模块状态
let socket: WebSocket | null = null;
let isReceiving = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;
let clientId: string = '';
let currentRole: string = '';

// 重连配置
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
let reconnectAttempts = 0;

/**
 * 初始化 WebSocket 同步
 */
export function initSync(role: 'student' | 'coach') {
    currentRole = role;
    console.log(`[Sync] 初始化 WebSocket 同步 (${role})`);
    console.log(`[Sync] 服务器地址: ${WS_URL}`);

    connect();
}

/**
 * 连接 WebSocket 服务器
 */
function connect() {
    if (socket?.readyState === WebSocket.OPEN) {
        console.log('[Sync] 已连接，跳过重连');
        return;
    }

    try {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            console.log('[Sync] ✅ WebSocket 已连接');
            reconnectAttempts = 0;

            // 发送角色信息
            socket?.send(JSON.stringify({
                type: 'JOIN',
                role: currentRole,
                timestamp: Date.now()
            }));

            // 订阅 Zustand store 变化
            setupSubscription();
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleMessage(message);
            } catch (error) {
                console.error('[Sync] 消息解析错误:', error);
            }
        };

        socket.onclose = (event) => {
            console.log(`[Sync] ❌ WebSocket 已断开 (code: ${event.code})`);
            cleanup();
            scheduleReconnect();
        };

        socket.onerror = (error) => {
            console.error('[Sync] WebSocket 错误:', error);
        };

    } catch (error) {
        console.error('[Sync] 连接失败:', error);
        scheduleReconnect();
    }
}

/**
 * 处理接收到的消息
 */
function handleMessage(message: { type: string; payload?: SyncPayload; clientId?: string; senderId?: string }) {
    switch (message.type) {
        case 'WELCOME':
            clientId = message.clientId || '';
            console.log(`[Sync] 分配客户端ID: ${clientId}`);
            break;

        case 'FULL_STATE':
            console.log('[Sync] 📦 收到完整状态同步');
            if (message.payload) {
                isReceiving = true;
                useGameStore.setState(message.payload as Parameters<typeof useGameStore.setState>[0]);
                isReceiving = false;
            }
            break;

        case 'STATE_UPDATE':
            if (message.senderId === clientId) return; // 忽略自己的消息

            console.log(`[Sync] 📥 收到状态更新:`, message.payload ? Object.keys(message.payload) : []);
            if (message.payload) {
                isReceiving = true;
                useGameStore.setState(message.payload as Parameters<typeof useGameStore.setState>[0]);
                isReceiving = false;
            }
            break;

        case 'ROOM_RESET':
            console.log(`[Sync] 🔄 房间已被重置，重置本地状态`);
            isReceiving = true;
            useGameStore.getState().reset();
            isReceiving = false;
            break;
    }
}

/**
 * 设置 Zustand 订阅
 */
function setupSubscription() {
    // 取消之前的订阅
    if (unsubscribe) {
        unsubscribe();
    }

    unsubscribe = useGameStore.subscribe((state, prevState) => {
        if (isReceiving || !socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }

        // 检测变化的字段
        const changes: SyncPayload = {};
        for (const key of SYNC_KEYS) {
            const keyTyped = key as keyof typeof state;
            if (state[keyTyped] !== prevState[keyTyped]) {
                changes[key] = state[keyTyped] as unknown;
            }
        }

        if (Object.keys(changes).length > 0) {
            socket.send(JSON.stringify({
                type: 'STATE_UPDATE',
                payload: changes,
                role: currentRole,
                timestamp: Date.now()
            }));
            console.log(`[Sync] 📤 广播状态变化:`, Object.keys(changes));
        }
    });
}

/**
 * 安排重连
 */
function scheduleReconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[Sync] 达到最大重连次数，停止重连');
        return;
    }

    reconnectAttempts++;
    console.log(`[Sync] ${RECONNECT_DELAY / 1000}秒后尝试重连 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimer = setTimeout(() => {
        connect();
    }, RECONNECT_DELAY);
}

/**
 * 清理资源
 */
function cleanup() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

/**
 * 关闭同步
 */
export function closeSync() {
    console.log('[Sync] 关闭同步');

    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    cleanup();

    if (socket) {
        socket.close();
        socket = null;
    }
}

/**
 * 获取连接状态
 */
export function isConnected(): boolean {
    return socket?.readyState === WebSocket.OPEN;
}

/**
 * 获取客户端ID
 */
export function getClientId(): string {
    return clientId;
}

/**
 * 重置房间状态（清空服务器端和所有客户端的状态）
 */
export function resetRoom() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('[Sync] 无法重置：WebSocket 未连接');
        return false;
    }

    socket.send(JSON.stringify({
        type: 'RESET_ROOM',
        role: currentRole,
        timestamp: Date.now()
    }));

    // 本地也重置
    useGameStore.getState().reset();

    console.log('[Sync] 🔄 已发送重置房间请求');
    return true;
}

export { clientId as TAB_ID };
