/**
 * 流式聊天面板 - 用于代练阶段的智能对话
 * 
 * 替代原有的固定6步流程，实现完全 LLM 驱动的对话
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Mic, Highlighter, MousePointer2, Navigation, Trophy, Loader2 } from 'lucide-react';
import { useStreamingChat, TypewriterText, StreamingMessageBubble } from '../../shared/StreamingChat';
import { ChatContext } from '../../../services/apiService';
import { useGameStore } from '../../../../store';

interface StreamingChatPanelProps {
    context: ChatContext;
    onToolCall?: (toolName: string, args: Record<string, any>) => void;
    onCoachingComplete?: () => void;
}

/**
 * 流式聊天面板
 * 
 * 展示 Jarvis 与学生的对话，支持打字机效果
 */
export const StreamingChatPanel: React.FC<StreamingChatPanelProps> = ({
    context,
    onToolCall,
    onCoachingComplete
}) => {
    const {
        publishCoachingTask,
        coachingTaskType,
        coachingTaskCompleted,
        coachingTaskTarget,
        messages: storeMessages,
        studentHighlights,
        coachingReselectedAnswer
    } = useGameStore();

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [inputText, setInputText] = useState('');
    const [pendingToolCall, setPendingToolCall] = useState<{ name: string; args: any; instruction: string } | null>(null);
    const [currentTask, setCurrentTask] = useState<{ type: string; instruction: string } | null>(null);
    const [showGpsCard, setShowGpsCard] = useState(false);
    const [isReview, setIsReview] = useState(false);

    // 执行工具调用
    const executeToolCall = useCallback((toolName: string, args: Record<string, any>) => {
        console.log('[StreamingChat] Executing tool:', toolName, args);

        switch (toolName) {
            case 'publish_voice_task':
                setCurrentTask({ type: 'voice', instruction: args.instruction || '请用语音回答' });
                publishCoachingTask('voice');
                break;
            case 'publish_highlight_task':
                setCurrentTask({ type: 'highlight', instruction: args.instruction || '请在文章中画线' });
                publishCoachingTask('highlight', args.target);
                break;
            case 'publish_select_task':
                setCurrentTask({ type: 'select', instruction: args.instruction || '请选择正确答案' });
                publishCoachingTask('select');
                break;
            case 'show_gps_card':
                setShowGpsCard(true);
                setCurrentTask({ type: 'gps', instruction: 'GPS 解题卡已发送' });
                publishCoachingTask('gps');  // 同步到学生端
                break;
            case 'start_review':
                setIsReview(true);
                break;
        }

        onToolCall?.(toolName, args);
        setPendingToolCall(null);
    }, [publishCoachingTask, onToolCall]);

    // 处理工具调用请求（拦截需要确认的任务）
    const handleToolCall = useCallback((toolName: string, args: Record<string, any>) => {
        console.log('[StreamingChat] Tool call requested:', toolName, args);

        // 需要确认的任务类型（教师需要点击"确认发布"才会发送给学生）
        const confirmableTools = ['publish_voice_task', 'publish_highlight_task', 'publish_select_task', 'show_gps_card'];

        if (confirmableTools.includes(toolName)) {
            let instruction = args.instruction;
            if (!instruction) {
                if (toolName === 'publish_voice_task') instruction = '请用语音回答';
                if (toolName === 'publish_highlight_task') instruction = '请在文章中画线';
                if (toolName === 'publish_select_task') instruction = '请选择正确答案';
                if (toolName === 'show_gps_card') instruction = '展示 GPS 解题卡';
            }
            setPendingToolCall({ name: toolName, args, instruction });
        } else {
            // 其他工具直接执行
            executeToolCall(toolName, args);
        }
    }, [executeToolCall]);

    // 使用流式聊天 Hook
    const {
        messages,
        isLoading,
        isThinking,
        sessionId,
        sendMessage,
        initSession,
        currentStreamingText
    } = useStreamingChat({
        context,
        onToolCall: handleToolCall,
        onError: (error) => console.error('[StreamingChat] Error:', error)
    });

    // 初始化会话
    useEffect(() => {
        if (!sessionId && context.question_stem) {
            initSession();
        }
    }, [sessionId, context.question_stem, initSession]);

    // 滚动到底部
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, currentStreamingText, pendingToolCall]);

    // 监听学生完成任务
    useEffect(() => {
        if (coachingTaskCompleted && currentTask) {
            let userMessage = '';

            if (currentTask.type === 'voice') {
                // 从 store 消息中获取学生回复
                const lastStudentMsg = storeMessages.filter(m => m.role === 'student').slice(-1)[0];
                userMessage = lastStudentMsg?.text || '（学生已完成语音回答）';
            } else if (currentTask.type === 'highlight') {
                if (studentHighlights.length > 0) {
                    const highlightTexts = studentHighlights.map(h => `「${h.text}」`).join('、');
                    userMessage = `我画出了这些内容：${highlightTexts}`;
                } else {
                    userMessage = '（学生已完成画线）';
                }
            } else if (currentTask.type === 'select') {
                userMessage = coachingReselectedAnswer
                    ? `我选择了 ${coachingReselectedAnswer}`
                    : '（学生已重新选择）';
            } else if (currentTask.type === 'gps') {
                userMessage = '（学生已装备 GPS 解题卡，准备开始）';
                setShowGpsCard(false);  // 关闭教师端的 GPS 卡片展示
            }

            if (userMessage) {
                sendMessage(userMessage);
                setCurrentTask(null);
            }
        }
    }, [coachingTaskCompleted, currentTask, storeMessages, studentHighlights, coachingReselectedAnswer, sendMessage]);

    // 发送消息
    const handleSend = () => {
        if (!inputText.trim() || isLoading) return;
        sendMessage(inputText.trim());
        setInputText('');
    };

    // 任务图标
    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'voice': return <Mic size={16} className="text-rose-500" />;
            case 'highlight': return <Highlighter size={16} className="text-amber-500" />;
            case 'select': return <MousePointer2 size={16} className="text-blue-500" />;
            default: return <Send size={16} />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* 头部 */}
            <div className="px-4 py-3 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 flex items-center gap-2">
                <Sparkles size={16} className="text-[#00B4EE]" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Jarvis 智能助教
                </span>
                {isLoading && (
                    <Loader2 size={14} className="ml-auto text-cyan-500 animate-spin" />
                )}
            </div>

            {/* 聊天区域 */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
            >
                {messages.length === 0 && !isLoading && (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        正在初始化对话...
                    </div>
                )}

                {messages.map((msg) => (
                    <StreamingMessageBubble key={msg.id} message={msg} />
                ))}

                {/* 思考中状态 */}
                {isThinking && (
                    <div className="flex justify-start mb-3">
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 text-slate-700 border border-cyan-100 px-4 py-3 rounded-2xl">
                            <div className="flex items-center gap-2 text-sm text-cyan-600 font-bold mb-1">
                                <Sparkles size={14} className="animate-pulse" />
                                Jarvis 正在思考...
                            </div>
                            <div className="flex gap-1 h-4 items-center">
                                <motion.div
                                    className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                                />
                                <motion.div
                                    className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                />
                                <motion.div
                                    className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* GPS 卡片 */}
                <AnimatePresence>
                    {showGpsCard && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Navigation size={20} />
                                <span className="font-bold">GPS 解题卡</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
                                    <span>圈路标 - 找题干关键词</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
                                    <span>搜原句 - 在文章中定位</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</span>
                                    <span>锁答案 - 对比选项确认</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 待确认的任务建议 */}
                {pendingToolCall && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-white rounded-xl border-2 border-[#00B4EE] shadow-md"
                    >
                        <div className="flex items-center gap-2 mb-2 text-[#00B4EE] font-bold">
                            <Sparkles size={18} />
                            <span>Jarvis 建议发布任务</span>
                        </div>
                        <div className="text-slate-700 text-sm mb-4 font-medium">
                            {pendingToolCall.instruction}
                        </div>
                        <button
                            onClick={() => executeToolCall(pendingToolCall.name, pendingToolCall.args)}
                            className="w-full py-2 bg-[#00B4EE] hover:bg-[#0099CC] text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={16} />
                            确认发布
                        </button>
                    </motion.div>
                )}

                {/* 当前任务提示 - 只有在没有待确认任务时才显示 */}
                {currentTask && !coachingTaskCompleted && !pendingToolCall && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-amber-50 rounded-xl border border-amber-200"
                    >
                        <div className="flex items-center gap-2 text-sm text-amber-800">
                            {getTaskIcon(currentTask.type)}
                            <span className="font-medium">{currentTask.instruction}</span>
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                            {coachingTaskType ? '等待学生完成...' : '任务已发布'}
                        </div>
                    </motion.div>
                )}

                {/* 复盘完成 - 只有在不处于加载中且不处于思考中时才显示，确保 Jarvis 说完最后一句话 */}
                {isReview && !isLoading && !isThinking && !currentStreamingText && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center my-4"
                    >
                        <Trophy size={32} className="text-emerald-500 mx-auto mb-2" />
                        <div className="font-bold text-emerald-700">教学完成！</div>
                        <div className="text-sm text-emerald-600 mb-3">学生已掌握正确解题方法</div>
                        <button
                            onClick={onCoachingComplete}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold transition-colors shadow-lg shadow-emerald-200"
                        >
                            {(() => {
                                // 检查是否还有其他错题
                                const { articleData, quizAnswers, currentCorrectionQuestionId } = useGameStore.getState();
                                const { generateQuizAnalysis } = require('./config');
                                const analysis = generateQuizAnalysis({
                                    quiz: articleData.quiz,
                                    quizAnswers
                                });
                                const wrongQuestions = analysis.filter((q: any) => q.status === 'wrong' || q.status === 'guessed');
                                const currentIndex = wrongQuestions.findIndex((q: any) => q.questionId === currentCorrectionQuestionId);
                                return (currentIndex !== -1 && currentIndex < wrongQuestions.length - 1) ? '下一题' : '完成带练';
                            })()}
                        </button>
                    </motion.div>
                )}
            </div>

            {/* 输入区域 */}
            <div className="p-3 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入教师反馈..."
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !inputText.trim()}
                        className="px-4 py-2 rounded-xl bg-[#00B4EE] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0099CC] transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StreamingChatPanel;
