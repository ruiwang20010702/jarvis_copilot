import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useGameStore, SentenceChunk, Stage } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Eye, GraduationCap, Scissors,
    Undo2, RotateCcw,
    ChevronLeft, ChevronRight,
    Sparkles, MessageCircle, Send, User,
    Monitor, Split, Volume2, LayoutDashboard
} from 'lucide-react';
import { useStreamingChat, StreamingMessageBubble } from '../../shared/StreamingChat';
import { useMemo } from 'react';

// Jarvis 教学剧本配置
const SURGERY_TEACHING_SCRIPT = {
    observation: [
        {
            title: '观察模式',
            content: '当前处于观察模式。学生正在观看系统自动演示如何拆解复杂句子。',
            action: '建议：保持观察，让学生自主学习。'
        }
    ],
    teacher: [
        {
            step: 'init',
            title: '教师演示 - 第一步',
            content: '请点击句子中的修饰语部分（如 "that" 或 "like these"），向学生演示如何识别和移除修饰语。',
            action: '操作：点击左侧句子中的修饰语'
        },
        {
            step: 'removed_1',
            title: '教师演示 - 继续移除',
            content: '很好！继续移除其他修饰语，让学生看到句子核心逐渐显现的过程。',
            action: '话术建议："看，去掉修饰语后，句子的核心就是 \'Wei and Zhang believe biodegradable robots have a bright future\'"'
        },
        {
            step: 'core_shown',
            title: '教师演示 - 总结',
            content: '现在句子核心已经清晰可见。可以向学生讲解：再长的句子，核心就是主语+谓语+宾语。',
            action: '下一步：点击【学生模式】让学生自己练习'
        }
    ],
    student: [
        {
            title: '学生练习中',
            content: '学生正在尝试自己识别和移除修饰语。观察他的操作，如果超过30秒未操作，可给予提示。',
            action: '监控中：如学生遇到困难，可随时切换回【教师模式】示范'
        }
    ]
};

const STAGES: { id: Stage; label: string }[] = [
    { id: 'warm-up', label: '热身' },
    { id: 'skill', label: '技能' },
    { id: 'battle', label: '实战' },
    { id: 'coaching', label: '带练' },
    { id: 'vocab', label: '生词' },
    { id: 'surgery', label: '难句' },
    { id: 'review', label: '结束' },
];

const TEACHING_STEPS = [
    "1. 询问初步理解",
    "2. 确认深入学习意愿",
    "3. 寻找主要信息 (主干)",
    "4. 讲解主干成分构成",
    "5. 分解并引导理解各部分",
    "6. 解释生词或语法难点",
    "7. 可视化/结构化识别关键部分",
    "8. 拼接句子完整含义",
    "9. 大白话总结翻译"
];

/**
 * 教师端难句拆解组件 - 7:3布局重构版
 * 严格复刻热身阶段的布局和交互逻辑
 */
export const CoachSurgeryView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const {
        surgeryMode,
        setSurgeryMode,
        restoreSentence,
        restoreChunk,
        surgeryChunks,
        surgeryList,
        currentSurgeryIndex,
        setCurrentSurgeryIndex,
        removeChunk,
        messages,
        addMessage,
        remoteStream,
        hasSurgeryData,
        articleData,
        publishCoachingTask,
        coachingTaskCompleted,
        setStage,
        loadMockSurgeryData
    } = useGameStore();

    const [coachInput, setCoachInput] = useState("");
    const [operationHistory, setOperationHistory] = useState<string[]>([]);
    const [showStructure, setShowStructure] = useState(false); // 是否展示句子结构图
    const [pendingToolCall, setPendingToolCall] = useState<{ name: string; args: any; instruction: string } | null>(null);
    const [currentTask, setCurrentTask] = useState<{ type: string; instruction: string } | null>(null);
    const [activeJarvisTab, setActiveJarvisTab] = useState<'chat' | 'plan'>('chat');
    const chatRef = useRef<HTMLDivElement>(null);
    const jarvisChatRef = useRef<HTMLDivElement>(null);
    const prevChunksRef = useRef<SentenceChunk[]>([]);

    // 获取当前正在讲解的句子文本
    const currentSentenceText = useMemo(() => {
        if (surgeryList && surgeryList.length > 0) {
            return surgeryList[currentSurgeryIndex]?.originalSentence || "";
        }
        return "";
    }, [surgeryList, currentSurgeryIndex]);

    // 稳定 context 对象，避免频繁触发 Hook 重置
    const chatContext = useMemo(() => ({
        module_type: 'surgery' as const,
        article_content: articleData.paragraphs.join('\n'),
        current_sentence: currentSentenceText,
        surgery_chunks: surgeryChunks.map(c => ({ text: c.text, type: c.type })),
        student_name: 'Alex' // TODO: 从用户系统获取
    }), [articleData.paragraphs, currentSentenceText, surgeryChunks]);

    // 执行工具调用（确认发布后）
    const executeToolCall = useCallback((toolName: string, args: Record<string, any>) => {
        console.log('[CoachSurgeryView] Executing tool:', toolName, args);

        switch (toolName) {
            case 'publish_voice_task':
                setCurrentTask({ type: 'voice', instruction: args.instruction || '请用语音回答' });
                publishCoachingTask('voice');
                break;
            case 'publish_highlight_task':
                setCurrentTask({ type: 'highlight', instruction: args.instruction || '请在句子中标记' });
                publishCoachingTask('highlight', 'article');
                break;
            case 'show_sentence_structure':
                setShowStructure(true);
                break;
            case 'complete_surgery':
                if (currentSurgeryIndex < surgeryList.length - 1) {
                    setCurrentSurgeryIndex(currentSurgeryIndex + 1);
                    setShowStructure(false);
                    setCurrentTask(null);
                }
                break;
        }
        setPendingToolCall(null);
    }, [currentSurgeryIndex, surgeryList.length, setCurrentSurgeryIndex, publishCoachingTask]);

    // 工具调用回调处理（拦截需要确认的任务）
    const handleToolCall = useCallback((toolName: string, args: Record<string, any>) => {
        console.log('[CoachSurgeryView] Tool call received:', toolName, args);

        // 需要确认的任务类型（教师需要点击"确认发布"才会发送给学生）
        const confirmableTools = ['publish_voice_task', 'publish_highlight_task', 'complete_surgery'];

        if (confirmableTools.includes(toolName)) {
            let instruction = args.instruction;
            if (!instruction) {
                if (toolName === 'publish_voice_task') instruction = '请用语音回答';
                if (toolName === 'publish_highlight_task') instruction = '请在句子中标记';
                if (toolName === 'complete_surgery') instruction = `完成当前句子讲解，进入下一句 (${args.summary || '讲解完成'})`;
            }
            setPendingToolCall({ name: toolName, args, instruction });
        } else {
            // 其他工具直接执行
            executeToolCall(toolName, args);
        }
    }, [executeToolCall]);

    // 集成流式聊天 Hook (Jarvis 助教)
    const {
        messages: aiMessages,
        sendMessage: sendJarvisMessage,
        initSession: initJarvisSession,
        isLoading: isJarvisLoading,
        isThinking: isJarvisThinking
    } = useStreamingChat({
        context: chatContext,
        onToolCall: handleToolCall
    });

    // 初始化 Jarvis 会话
    useEffect(() => {
        // 确保数据完全就绪后再初始化，避免发送空上下文
        if (hasSurgeryData && currentSentenceText && surgeryChunks.length > 0) {
            console.log('[CoachSurgeryView] Initializing Jarvis session with context:', chatContext);
            initJarvisSession();
        }
    }, [hasSurgeryData, currentSentenceText, surgeryChunks.length, initJarvisSession]);

    // 自动滚动 Jarvis 聊天
    useEffect(() => {
        if (jarvisChatRef.current) {
            jarvisChatRef.current.scrollTop = jarvisChatRef.current.scrollHeight;
        }
    }, [aiMessages, isJarvisThinking]);

    // 监听学生完成任务 - 将学生回复发送给 Jarvis
    useEffect(() => {
        if (coachingTaskCompleted && currentTask) {
            let userMessage = '';

            if (currentTask.type === 'voice') {
                // 从 store 消息中获取学生回复
                const lastStudentMsg = messages.filter(m => m.role === 'student').slice(-1)[0];
                userMessage = lastStudentMsg?.text || '（学生已完成语音回答）';
            } else if (currentTask.type === 'highlight') {
                userMessage = '（学生已完成标记）';
            }

            if (userMessage) {
                console.log('[CoachSurgeryView] Sending student response to Jarvis:', userMessage);
                sendJarvisMessage(userMessage);
                setCurrentTask(null);
            }
        }
    }, [coachingTaskCompleted, currentTask, messages, sendJarvisMessage]);

    // 教师只能在 'teacher' 模式下点击句子
    const isTeacherInteractive = surgeryMode === 'teacher';

    // 监听surgeryChunks变化，自动记录删除操作（支持学生模式）
    useEffect(() => {
        const prevChunks = prevChunksRef.current;
        const currentChunks = surgeryChunks;

        // 初始化：第一次运行时设置ref
        if (prevChunks.length === 0) {
            prevChunksRef.current = JSON.parse(JSON.stringify(currentChunks));
            return;
        }

        // 找出新删除的chunk
        const newlyRemovedIds: string[] = [];
        currentChunks.forEach(currentChunk => {
            const prevChunk = prevChunks.find(c => c.id === currentChunk.id);
            // 如果之前未删除，现在删除了，记录这个操作
            if (prevChunk && !prevChunk.isRemoved && currentChunk.isRemoved) {
                newlyRemovedIds.push(currentChunk.id);
            }
        });

        // 更新操作历史
        if (newlyRemovedIds.length > 0) {
            setOperationHistory(prev => [...prev, ...newlyRemovedIds]);
        }

        // 检测重置操作（所有chunk都恢复了）
        const allRestored = currentChunks.every(c => !c.isRemoved);
        const prevHadRemoved = prevChunks.some(c => c.isRemoved);
        if (allRestored && prevHadRemoved) {
            setOperationHistory([]);
        }

        // 更新ref（深拷贝）
        prevChunksRef.current = JSON.parse(JSON.stringify(currentChunks));
    }, [surgeryChunks]);

    // 获取当前Jarvis指引
    const getCurrentJarvisScript = () => {
        const removedCount = surgeryChunks.filter(c => c.isRemoved).length;
        const totalModifiers = surgeryChunks.filter(c => c.type === 'modifier').length;

        if (surgeryMode === 'observation') {
            return SURGERY_TEACHING_SCRIPT.observation[0];
        } else if (surgeryMode === 'teacher') {
            if (removedCount === 0) {
                return SURGERY_TEACHING_SCRIPT.teacher[0];
            } else if (removedCount < totalModifiers) {
                return SURGERY_TEACHING_SCRIPT.teacher[1];
            } else {
                return SURGERY_TEACHING_SCRIPT.teacher[2];
            }
        } else {
            return SURGERY_TEACHING_SCRIPT.student[0];
        }
    };

    const currentScript = getCurrentJarvisScript();

    // 处理句子块点击
    const handleChunkClick = (chunk: SentenceChunk) => {
        if (!isTeacherInteractive || chunk.type !== 'modifier') return;

        // 直接删除，操作历史会由useEffect自动记录
        removeChunk(chunk.id);
    };

    // 撤回上一步操作
    const handleUndo = () => {
        if (operationHistory.length === 0) return;

        // 从历史栈中取出最后一个删除的chunk ID
        const lastRemovedId = operationHistory[operationHistory.length - 1];

        // 恢复这个chunk
        restoreChunk(lastRemovedId);

        // 从历史栈中移除
        setOperationHistory(prev => prev.slice(0, -1));
    };

    // 发送消息
    const handleSendCoachMsg = () => {
        if (!coachInput.trim()) return;
        addMessage({ role: 'coach', text: coachInput });
        setCoachInput("");
    };

    // 滚动到最新消息
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <main
            className="h-full w-full flex overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(0, 180, 238, 0.08) 0%, rgba(0, 180, 238, 0.12) 40%, rgba(253, 231, 0, 0.1) 70%, rgba(253, 231, 0, 0.15) 100%)'
            }}
        >
            {/* Background Grid for the whole view */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(#000 1px, transparent 1px),
                        linear-gradient(90deg, #000 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* ====== 左侧 70%：难句展示区 ====== */}
            <div className="flex-[7] flex flex-col relative min-w-0 p-6">
                {/* 顶部状态标签 */}
                <div className="flex justify-center pt-8 shrink-0">
                    <div className="bg-white/90 backdrop-blur border px-5 py-2 rounded-full shadow-sm text-sm font-bold flex items-center gap-2 z-10"
                        style={{ borderColor: 'rgba(0, 180, 238, 0.2)' }}>
                        {surgeryMode === 'observation' && (
                            <>
                                <Eye size={16} className="text-slate-400" />
                                <span className="text-slate-600">观察模式</span>
                            </>
                        )}
                        {surgeryMode === 'teacher' && (
                            <>
                                <GraduationCap size={16} style={{ color: '#00B4EE' }} />
                                <span style={{ color: '#00B4EE' }}>教师演示</span>
                            </>
                        )}
                        {surgeryMode === 'student' && (
                            <>
                                <Scissors size={16} style={{ color: '#FDE700' }} />
                                <span style={{ color: '#B39B00' }}>学生练习</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 句子展示主区域 */}
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                    <div className="w-full max-w-5xl">
                        {!hasSurgeryData ? (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">📝</div>
                                <div className="text-xl font-bold text-slate-400 mb-2">暂无长难句数据</div>
                            </div>
                        ) : (
                            <LayoutGroup id="coach-sentence">
                                <motion.div layout className="flex flex-wrap justify-center items-center gap-x-6 gap-y-8">
                                    <AnimatePresence mode="popLayout">
                                        {surgeryChunks.filter(c => !c.isRemoved).map(c => (
                                            <motion.div
                                                layout
                                                key={c.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ y: -30, opacity: 0, scale: 0.7, transition: { duration: 0.3 } }}
                                                onClick={() => handleChunkClick(c)}
                                                className={`text-4xl md:text-5xl font-serif font-bold px-4 py-2 rounded-2xl transition-all ${c.type === 'modifier' && isTeacherInteractive
                                                    ? 'cursor-pointer hover:bg-blue-50 hover:shadow-md active:scale-95'
                                                    : ''
                                                    } ${showStructure
                                                        ? (c.type === 'core'
                                                            ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400'
                                                            : 'bg-amber-100 text-amber-800 border-2 border-amber-400')
                                                        : 'text-[#1E293B]'
                                                    }`}
                                            >
                                                {c.text}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </LayoutGroup>
                        )}
                    </div>
                </div>

                {/* 底部操作提示 */}
                <div className="h-24 flex items-center justify-center shrink-0">
                    <span className="text-slate-400 font-medium tracking-wide">观察学生操作</span>
                </div>

                {/* 左下角控制按钮组 */}
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
                    <button className="p-2 text-white/50 hover:text-white transition-colors">
                        <User size={18} />
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button className="p-2 bg-white/20 text-white rounded-xl shadow-inner">
                        <Monitor size={18} />
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button className="p-2 text-white/50 hover:text-white transition-colors">
                        <Split size={18} />
                    </button>
                </div>
            </div>

            {/* ====== 右侧 30%：功能侧边栏 ====== */}
            <div className="flex-[3] bg-white border-l border-slate-200 flex flex-col min-w-[360px] shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                {/* 1. 视频面板 */}
                <div className="p-6 shrink-0">
                    <div className="aspect-video bg-[#0F172A] rounded-2xl relative overflow-hidden shadow-inner group">
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <User size={32} className="text-white/20" />
                            </div>
                            <span className="text-white/40 text-xs font-medium tracking-widest uppercase">学生视频连线中...</span>
                        </div>

                        {/* 视频顶部标签 */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">在线</span>
                        </div>

                        {/* 视频底部控制 */}
                        <div className="absolute bottom-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Volume2 size={14} className="text-white/80" />
                        </div>
                    </div>
                </div>

                {/* 2. 单词卡片控制面板 */}
                <div className="px-6 py-4 flex flex-col min-h-0 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">单词卡片控制</h3>
                    </div>

                    {/* 模式切换大按钮 */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                            onClick={() => setSurgeryMode('observation')}
                            className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${surgeryMode === 'observation'
                                ? 'shadow-md shadow-slate-200'
                                : 'shadow-sm hover:shadow-md'
                                }`}
                            style={surgeryMode === 'observation' ? {
                                backgroundColor: '#9CA3AF',
                                color: 'white',
                                borderColor: '#9CA3AF'
                            } : {
                                backgroundColor: '#F3F4F6',
                                color: '#6B7280',
                                borderColor: '#F3F4F6'
                            }}
                        >
                            <Eye size={16} />
                            <span className="text-[10px] font-bold">观察</span>
                        </button>
                        <button
                            onClick={() => setSurgeryMode('teacher')}
                            className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${surgeryMode === 'teacher'
                                ? 'shadow-md shadow-blue-100'
                                : 'shadow-sm hover:shadow-md'
                                }`}
                            style={surgeryMode === 'teacher' ? {
                                backgroundColor: '#00B4EE',
                                color: 'white',
                                borderColor: '#00B4EE'
                            } : {
                                backgroundColor: 'rgba(0, 180, 238, 0.1)',
                                color: '#00B4EE',
                                border: '1px solid rgba(0, 180, 238, 0.2)'
                            }}
                        >
                            <GraduationCap size={16} />
                            <span className="text-[10px] font-bold">教师</span>
                        </button>
                        <button
                            onClick={() => setSurgeryMode('student')}
                            className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${surgeryMode === 'student'
                                ? 'shadow-md shadow-yellow-100'
                                : 'shadow-sm hover:shadow-md'
                                }`}
                            style={surgeryMode === 'student' ? {
                                backgroundColor: '#FDE700',
                                color: '#57585A',
                                borderColor: '#FDE700'
                            } : {
                                backgroundColor: 'rgba(253, 231, 0, 0.1)',
                                color: '#B39B00',
                                border: '1px solid rgba(253, 231, 0, 0.3)'
                            }}
                        >
                            <Scissors size={16} />
                            <span className="text-[10px] font-bold">学生</span>
                        </button>
                    </div>

                    {/* 功能小按钮 */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                            onClick={restoreSentence}
                            className="flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-100 text-slate-500 text-[10px] font-bold hover:bg-slate-50 transition-colors"
                        >
                            <RotateCcw size={14} />
                            <span>重置</span>
                        </button>
                        <button
                            onClick={handleUndo}
                            disabled={operationHistory.length === 0}
                            className="flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-100 text-slate-500 text-[10px] font-bold hover:bg-slate-50 transition-colors disabled:opacity-30"
                        >
                            <Undo2 size={14} />
                            <span>撤回</span>
                        </button>
                    </div>


                    {/* 3. Jarvis 助教面板 */}
                    <div
                        className="flex-1 flex flex-col min-h-0"
                    >
                        <div className="px-6 py-4 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#00B4EE] flex items-center justify-center text-white shadow-md shadow-blue-100">
                                    <Sparkles size={16} fill="currentColor" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-black text-slate-800">Jarvis 助教</h4>
                                    <div className="flex gap-4 mt-1">
                                        <button
                                            onClick={() => setActiveJarvisTab('chat')}
                                            className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${activeJarvisTab === 'chat' ? 'text-[#00B4EE]' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            实时对话
                                        </button>
                                        <button
                                            onClick={() => setActiveJarvisTab('plan')}
                                            className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${activeJarvisTab === 'plan' ? 'text-[#00B4EE]' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            教学计划
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4" ref={jarvisChatRef}>
                            {activeJarvisTab === 'chat' ? (
                                <div className="space-y-4">
                                    {aiMessages.length === 0 && !isJarvisThinking && (
                                        <div className="text-center py-8">
                                            <p className="text-xs text-slate-400 font-medium">等待教学开始...</p>
                                        </div>
                                    )}
                                    {aiMessages.map((msg, idx) => (
                                        <StreamingMessageBubble
                                            key={idx}
                                            message={msg}
                                            isLast={idx === aiMessages.length - 1}
                                        />
                                    ))}
                                    {isJarvisThinking && (
                                        <div className="flex gap-2 items-center text-slate-400 p-2">
                                            <div className="flex gap-1">
                                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1 h-1 rounded-full bg-current" />
                                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1 h-1 rounded-full bg-current" />
                                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1 h-1 rounded-full bg-current" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Jarvis 思考中</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 py-2">
                                    {TEACHING_STEPS.map((step, idx) => (
                                        <div key={idx} className="flex gap-3 items-start group">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-50 transition-colors">
                                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500">{idx + 1}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {activeJarvisTab === 'chat' && pendingToolCall && (
                            <div className="px-6 py-4 border-t border-blue-50 bg-blue-50/30">
                                <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={12} className="text-blue-500" />
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">待发布任务</span>
                                    </div>
                                    <p className="text-xs text-blue-800 font-bold mb-3 leading-relaxed">
                                        {pendingToolCall.instruction}
                                    </p>
                                    <button
                                        onClick={() => executeToolCall(pendingToolCall.name, pendingToolCall.args)}
                                        className="w-full py-2 bg-blue-500 text-white text-[10px] font-black rounded-lg hover:bg-blue-600 transition-colors shadow-md shadow-blue-100"
                                    >
                                        确认发布给学生
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};
