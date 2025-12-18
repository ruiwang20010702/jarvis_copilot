/**
 * 打字机效果组件和流式消息 Hook
 * 
 * 用于实现类似 ChatGPT 的逐字显示效果
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    chatStream,
    initChatSession,
    initChatStream,
    ChatMessage,
    ChatContext,
    ChatStreamEvent
} from '../../services/apiService';

// ============ 打字机效果组件 ============

interface TypewriterTextProps {
    text: string;
    speed?: number; // 每个字符的延迟 (ms)
    onComplete?: () => void;
    className?: string;
}

/**
 * 打字机效果文本组件
 * 逐字显示文本，模拟打字效果
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 30,
    onComplete,
    className = ''
}) => {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        if (!text) return;

        // 重置状态
        indexRef.current = 0;
        setDisplayText('');
        setIsComplete(false);

        const timer = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayText(text.slice(0, indexRef.current + 1));
                indexRef.current++;
            } else {
                clearInterval(timer);
                setIsComplete(true);
                onComplete?.();
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, onComplete]);

    return (
        <span className={className}>
            {displayText}
            {!isComplete && (
                <motion.span
                    className="inline-block w-0.5 h-4 bg-current ml-0.5"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                />
            )}
        </span>
    );
};

// ============ 流式消息 Hook ============

interface StreamingMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isStreaming: boolean;
    toolCalls?: Array<{
        name: string;
        arguments: Record<string, any>;
    }>;
}

interface UseStreamingChatOptions {
    context: ChatContext;
    onToolCall?: (toolName: string, args: Record<string, any>) => void;
    onError?: (error: string) => void;
}

interface UseStreamingChatReturn {
    messages: StreamingMessage[];
    isLoading: boolean;
    isThinking: boolean;  // 是否正在思考
    sessionId: string | null;
    sendMessage: (content: string) => Promise<void>;
    initSession: () => Promise<void>;
    resetSession: () => void;
    currentStreamingText: string;
}

/**
 * 流式聊天 Hook
 * 
 * 管理流式对话状态，处理 SSE 事件
 */
export function useStreamingChat(options: UseStreamingChatOptions): UseStreamingChatReturn {
    const { context, onToolCall, onError } = options;

    const [messages, setMessages] = useState<StreamingMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);  // 是否正在思考
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentStreamingText, setCurrentStreamingText] = useState('');

    const messageIdRef = useRef(0);
    const initializingRef = useRef(false);  // 防止重复初始化

    // 生成消息 ID
    const generateId = useCallback(() => {
        messageIdRef.current++;
        return `msg-${Date.now()}-${messageIdRef.current}`;
    }, []);

    // 初始化会话（流式）
    const initSession = useCallback(async () => {
        // 防止重复调用
        if (initializingRef.current || sessionId) {
            console.log('[StreamingChat] Already initialized or initializing, skipping...');
            return;
        }
        initializingRef.current = true;

        setIsLoading(true);
        const msgId = generateId();
        let fullText = '';
        let newSessionId = '';
        let suggestedTask: { type: string; instruction: string } | null = null;

        try {
            // 先添加一个空的流式消息
            setMessages([{
                id: msgId,
                role: 'assistant',
                content: '',
                isStreaming: true,
            }]);

            for await (const event of initChatStream(context)) {
                if (event.type === 'session') {
                    newSessionId = event.session_id || '';
                    setSessionId(newSessionId);
                } else if (event.type === 'text' && event.content) {
                    fullText += event.content;
                    setCurrentStreamingText(fullText);
                    // 更新消息内容
                    setMessages(prev => prev.map(msg =>
                        msg.id === msgId ? { ...msg, content: fullText } : msg
                    ));
                } else if (event.type === 'tool_call' && event.content) {
                    const tc = event.content as unknown as { name: string; arguments: Record<string, any> };
                    onToolCall?.(tc.name, tc.arguments);
                } else if (event.type === 'done') {
                    suggestedTask = event.suggested_task || null;
                    // 标记流式完成
                    setMessages(prev => prev.map(msg =>
                        msg.id === msgId ? { ...msg, isStreaming: false, content: event.greeting || fullText } : msg
                    ));
                    setCurrentStreamingText('');
                } else if (event.type === 'error') {
                    onError?.(event.content || '初始化失败');
                }
            }
        } catch (e) {
            onError?.(`初始化失败: ${e}`);
            // Fallback 到同步方式
            try {
                const result = await initChatSession(context);
                setSessionId(result.session_id);
                setMessages([{
                    id: msgId,
                    role: 'assistant',
                    content: result.greeting,
                    isStreaming: false,
                }]);
                if (result.suggested_task && onToolCall) {
                    onToolCall(`publish_${result.suggested_task.type}_task`, {
                        instruction: result.suggested_task.instruction
                    });
                }
            } catch (e2) {
                onError?.(`Fallback 初始化也失败: ${e2}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [context, generateId, onToolCall, onError, sessionId]);

    // 发送消息
    const sendMessage = useCallback(async (content: string) => {
        if (!sessionId || isLoading) return;

        // 添加用户消息
        const userMsgId = generateId();
        setMessages(prev => [...prev, {
            id: userMsgId,
            role: 'user',
            content,
            isStreaming: false,
        }]);

        // 添加空的助手消息（用于流式填充）
        const assistantMsgId = generateId();
        setMessages(prev => [...prev, {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            isStreaming: true,
        }]);

        setIsLoading(true);
        setCurrentStreamingText('');

        try {
            const chatMessages: ChatMessage[] = [{ role: 'user', content }];
            let fullText = '';
            const toolCalls: Array<{ name: string; arguments: Record<string, any> }> = [];

            for await (const event of chatStream(sessionId, chatMessages, context)) {
                if (event.type === 'thinking_start') {
                    setIsThinking(true);
                } else if (event.type === 'thinking_end') {
                    setIsThinking(false);
                } else if (event.type === 'text') {
                    const newText = event.content as string;
                    fullText += newText;
                    setCurrentStreamingText(fullText);

                    // 更新消息内容
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: fullText }
                            : msg
                    ));
                } else if (event.type === 'tool_call') {
                    // 先缓存工具调用，等文本输出完成后再触发
                    const toolCall = event.content as { name: string; arguments: Record<string, any> };
                    toolCalls.push(toolCall);
                    // 不再立即调用: onToolCall?.(toolCall.name, toolCall.arguments);
                } else if (event.type === 'done') {
                    setIsThinking(false); // 确保思考状态结束

                    // 流式完成：先更新消息状态
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMsgId
                            ? { ...msg, isStreaming: false, toolCalls }
                            : msg
                    ));

                    // 文本输出完成后，再触发工具调用
                    if (toolCalls.length > 0) {
                        // 稍微延迟一下，让用户看到完整的文本
                        setTimeout(() => {
                            toolCalls.forEach(tc => {
                                onToolCall?.(tc.name, tc.arguments);
                            });
                        }, 300);
                    }
                } else if (event.type === 'error') {
                    onError?.(event.content as string);
                    setIsThinking(false);
                }
            }
        } catch (e) {
            onError?.(`发送失败: ${e}`);
            // 移除失败的助手消息
            setMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
            setIsThinking(false);
        } finally {
            setIsLoading(false);
            setCurrentStreamingText('');
            // setIsThinking(false); // 不要在 finally 里重置，因为可能还在流式输出
        }
    }, [sessionId, isLoading, context, generateId, onToolCall, onError]);

    // 重置会话
    const resetSession = useCallback(() => {
        setMessages([]);
        setSessionId(null);
        setCurrentStreamingText('');
    }, []);

    return {
        messages,
        isLoading,
        isThinking,
        sessionId,
        sendMessage,
        initSession,
        resetSession,
        currentStreamingText,
    };
}

// ============ 流式消息气泡组件 ============

interface StreamingMessageBubbleProps {
    message: StreamingMessage;
}

/**
 * 流式消息气泡
 * 显示用户或助手的消息，支持流式输出
 */
export const StreamingMessageBubble: React.FC<StreamingMessageBubbleProps> = ({ message }) => {
    const isAssistant = message.role === 'assistant';
    const [displayedText, setDisplayedText] = useState('');

    // 平滑打字效果
    useEffect(() => {
        if (!isAssistant || !message.isStreaming) {
            setDisplayedText(message.content);
            return;
        }

        // 如果当前显示的文本比目标文本短，则开始打字
        if (displayedText.length < message.content.length) {
            const timeoutId = setTimeout(() => {
                // 每次增加 1-3 个字符，模拟打字速度变化
                const step = Math.floor(Math.random() * 2) + 1;
                setDisplayedText(message.content.slice(0, displayedText.length + step));
            }, 20); // 20ms 延迟，约 50字/秒

            return () => clearTimeout(timeoutId);
        }
    }, [message.content, message.isStreaming, isAssistant, displayedText]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}
        >
            <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAssistant
                    ? 'bg-gradient-to-br from-cyan-50 to-blue-50 text-slate-700 border border-cyan-100'
                    : 'bg-slate-800 text-white'
                    }`}
            >
                {isAssistant && (
                    <div className="text-xs font-bold text-cyan-600 mb-1">Jarvis</div>
                )}
                {!isAssistant && (
                    <div className="text-xs font-bold text-slate-300 mb-1">Alex</div>
                )}
                <div className="whitespace-pre-wrap">
                    {displayedText}
                    {/* 流式输出时显示光标动画 */}
                    {message.isStreaming && (
                        <motion.span
                            className="inline-block w-0.5 h-4 bg-cyan-500 ml-0.5 align-middle"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
};
