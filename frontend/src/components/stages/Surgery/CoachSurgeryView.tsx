import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useGameStore, SentenceChunk } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Eye, GraduationCap, Scissors,
    Undo2, RotateCcw, Sparkles, MessageCircle, Send, User
} from 'lucide-react';

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
            content: '请点击句子中的修饰语部分（如 "that trained our team for three years"），向学生演示如何识别和移除修饰语。',
            action: '操作：点击左侧句子中的修饰语'
        },
        {
            step: 'removed_1',
            title: '教师演示 - 继续移除',
            content: '很好！继续移除其他修饰语，让学生看到句子核心逐渐显现的过程。',
            action: '话术建议："看，去掉修饰语后，句子的核心就是 \'The coach won many awards\'"'
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
        removeChunk,
        messages,
        addMessage,
        remoteStream
    } = useGameStore();

    const [coachInput, setCoachInput] = useState("");
    const [operationHistory, setOperationHistory] = useState<string[]>([]);
    const chatRef = useRef<HTMLDivElement>(null);
    const prevChunksRef = useRef<SentenceChunk[]>([]);

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
            className="h-full w-full flex bg-gray-50 p-6 gap-6 overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(0, 180, 238, 0.05) 0%, rgba(253, 231, 0, 0.08) 100%)'
            }}
        >
            {/* ====== 左侧 70%：难句展示 + 操作控制 ====== */}
            <div
                className="flex-[7] bg-white rounded-3xl shadow-sm flex flex-col h-full overflow-hidden"
                style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
            >
                {/* 上半部分：难句卡片展示 */}
                <div className="flex-[6] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    {/* 顶部标题栏 */}
                    <div className="absolute top-0 left-0 w-full p-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            难句拆解 / Sentence Surgery
                        </span>
                        <div className="flex items-center gap-2">
                            {surgeryMode === 'observation' && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                                    <Eye size={12} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-600">观察模式</span>
                                </div>
                            )}
                            {surgeryMode === 'teacher' && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border"
                                    style={{ backgroundColor: 'rgba(0, 180, 238, 0.1)', borderColor: 'rgba(0, 180, 238, 0.3)' }}>
                                    <GraduationCap size={12} style={{ color: '#00B4EE' }} />
                                    <span className="text-xs font-bold" style={{ color: '#00B4EE' }}>教师演示</span>
                                </div>
                            )}
                            {surgeryMode === 'student' && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border"
                                    style={{ backgroundColor: 'rgba(253, 231, 0, 0.15)', borderColor: 'rgba(253, 231, 0, 0.4)' }}>
                                    <Scissors size={12} style={{ color: '#B39B00' }} />
                                    <span className="text-xs font-bold" style={{ color: '#B39B00' }}>学生练习</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 难句内容 - 直接显示在背景上 */}
                    <div className="w-full max-w-4xl">
                        <LayoutGroup id="coach-sentence">
                            <motion.div layout className="flex flex-wrap justify-center items-center gap-x-3 gap-y-4">
                                <AnimatePresence mode="popLayout">
                                    {surgeryChunks.filter(c => !c.isRemoved).map(c => (
                                        <motion.div
                                            layout
                                            key={c.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ y: -30, opacity: 0, scale: 0.7, transition: { duration: 0.3 } }}
                                            onClick={() => handleChunkClick(c)}
                                            className={`text-3xl md:text-4xl font-serif font-bold px-2 py-1 rounded-xl transition-all ${c.type === 'modifier' && isTeacherInteractive
                                                    ? 'cursor-pointer hover:bg-blue-50 hover:shadow-md active:scale-95'
                                                    : ''
                                                } ${c.type === 'core' ? 'text-slate-900' : 'text-slate-700'}`}
                                        >
                                            {c.text}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </LayoutGroup>

                        {/* 底部提示 */}
                        {surgeryMode === 'teacher' && (
                            <div className="mt-6 text-center text-sm text-slate-400 font-medium">
                                点击修饰语部分可将其移除
                            </div>
                        )}
                        {surgeryMode === 'student' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-yellow-700"
                            >
                                <User size={16} />
                                <span>学生正在操作中...</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* 下半部分：操作台 + Jarvis */}
                <div className="flex-[4] border-t border-slate-100 bg-slate-50 p-6 pb-24 flex gap-6">
                    {/* 左：操作台（5个按钮） - 卡片化 */}
                    <div
                        className="flex-[5] bg-white rounded-2xl shadow-sm p-5 flex flex-col"
                        style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                    >
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">操作控制台</h3>

                        {/* 模式按钮（3个） */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <button
                                onClick={() => setSurgeryMode('observation')}
                                className={`py-3 rounded-xl font-bold text-sm flex flex-col items-center gap-1 transition-all ${surgeryMode === 'observation'
                                        ? 'shadow-md'
                                        : 'shadow-sm hover:shadow-md'
                                    }`}
                                style={surgeryMode === 'observation' ? {
                                    backgroundColor: '#9CA3AF',
                                    color: 'white'
                                } : {
                                    backgroundColor: '#F3F4F6',
                                    color: '#6B7280'
                                }}
                            >
                                <Eye size={18} />
                                <span className="text-xs">观察</span>
                            </button>

                            <button
                                onClick={() => setSurgeryMode('teacher')}
                                className={`py-3 rounded-xl font-bold text-sm flex flex-col items-center gap-1 transition-all ${surgeryMode === 'teacher'
                                        ? 'shadow-md'
                                        : 'shadow-sm hover:shadow-md'
                                    }`}
                                style={surgeryMode === 'teacher' ? {
                                    backgroundColor: '#00B4EE',
                                    color: 'white'
                                } : {
                                    backgroundColor: 'rgba(0, 180, 238, 0.1)',
                                    color: '#00B4EE',
                                    border: '1px solid rgba(0, 180, 238, 0.2)'
                                }}
                            >
                                <GraduationCap size={18} />
                                <span className="text-xs">教师</span>
                            </button>

                            <button
                                onClick={() => setSurgeryMode('student')}
                                className={`py-3 rounded-xl font-bold text-sm flex flex-col items-center gap-1 transition-all ${surgeryMode === 'student'
                                        ? 'shadow-md'
                                        : 'shadow-sm hover:shadow-md'
                                    }`}
                                style={surgeryMode === 'student' ? {
                                    backgroundColor: '#FDE700',
                                    color: '#57585A'
                                } : {
                                    backgroundColor: 'rgba(253, 231, 0, 0.1)',
                                    color: '#B39B00',
                                    border: '2px solid rgba(253, 231, 0, 0.3)'
                                }}
                            >
                                <Scissors size={18} />
                                <span className="text-xs">学生</span>
                            </button>
                        </div>

                        {/* 功能按钮（2个） */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={restoreSentence}
                                className="py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
                            >
                                <RotateCcw size={16} />
                                <span>重置</span>
                            </button>

                            <button
                                onClick={handleUndo}
                                disabled={operationHistory.length === 0}
                                className="py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Undo2 size={16} />
                                <span>撤回</span>
                            </button>
                        </div>
                    </div>

                    {/* 右：Jarvis助教 */}
                    <div
                        className="flex-[7] bg-white rounded-2xl shadow-sm p-5 flex flex-col"
                        style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                    >
                        {/* 标题 */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}>
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Jarvis 助教</h3>
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Teaching Assistant</p>
                            </div>
                        </div>

                        {/* 指引内容 */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="mb-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00B4EE' }} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#00B4EE' }}>
                                        {currentScript.title}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-700">
                                    {currentScript.content}
                                </p>
                            </div>

                            <div className="mt-auto pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageCircle size={12} style={{ color: '#00B4EE' }} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">建议行动</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {currentScript.action}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====== 右侧 30%：视频窗 + 对话框 ====== */}
            <div className="flex-[3] flex flex-col gap-4 h-full overflow-hidden">
                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="coach-video"
                    className="relative w-full shrink-0 rounded-xl shadow-md"
                    style={{ border: '1px solid rgba(0, 180, 238, 0.4)' }}
                    videoStream={remoteStream}
                />

                {/* 互动窗口 (Chat) */}
                <div
                    className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden min-h-0"
                    style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                >
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                        <span className="text-xs font-semibold text-slate-500">互动消息</span>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>

                    {/* 消息列表 */}
                    <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                暂无消息
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'coach' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'coach'
                                                ? 'text-white rounded-br-sm'
                                                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                                            }`}
                                        style={msg.role === 'coach'
                                            ? { background: 'linear-gradient(to bottom right, #00B4EE, #0088CC)' }
                                            : {}}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 输入区域 */}
                    <div className="p-3 border-t border-slate-100 shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={coachInput}
                                onChange={(e) => setCoachInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendCoachMsg()}
                                placeholder="给学生留言..."
                                className="flex-1 px-4 py-2 text-sm rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00B4EE]/30 focus:border-[#00B4EE]"
                            />
                            <button
                                onClick={handleSendCoachMsg}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                style={{ backgroundColor: '#00B4EE' }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};
