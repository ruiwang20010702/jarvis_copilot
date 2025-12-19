import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useGameStore, SentenceChunk } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import { Eye, GraduationCap, Scissors, Send, Mic, Loader2, Sparkles } from 'lucide-react';
import { transcribeAudio } from '../../../services/apiService';
import { audioRecorder } from '../../../services/audioRecorder';

/**
 * 学生端难句拆解组件
 * Surgery (Sentence Surgery) - 句子手术
 * 学生通过点击移除修饰语，保留句子核心
 */
export const StudentSurgeryView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const {
        surgeryChunks,
        surgeryList,
        currentSurgeryIndex,
        surgeryMode,
        removeChunk,
        triggerChunkShake,
        messages,
        addMessage,
        remoteStream,
        hasSurgeryData,
        coachingTaskType,
        coachingTaskReceived,
        receiveCoachingTask,
        completeCoachingTask
    } = useGameStore();

    const chatEndRef = useRef<HTMLDivElement>(null);
    const [inputText, setInputText] = useState("");
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // 严格模式：只有在 'student' 模式下学生才能交互
    const isInteractive = surgeryMode === 'student';

    // 根据句子总长度动态计算字体大小
    const dynamicFontSize = useMemo(() => {
        const totalLength = surgeryChunks.filter(c => !c.isRemoved).reduce((acc, c) => acc + c.text.length, 0);
        // 短句子用大字体，长句子自动缩小
        if (totalLength <= 30) return 'text-3xl md:text-4xl lg:text-5xl';
        if (totalLength <= 60) return 'text-2xl md:text-3xl lg:text-4xl';
        if (totalLength <= 100) return 'text-xl md:text-2xl lg:text-3xl';
        return 'text-lg md:text-xl lg:text-2xl';
    }, [surgeryChunks]);

    // 监听新任务
    useEffect(() => {
        if (coachingTaskType && !coachingTaskReceived) {
            setShowTaskModal(true);
        }
    }, [coachingTaskType, coachingTaskReceived]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 核心交互逻辑
    const handleChunkClick = (chunk: SentenceChunk) => {
        if (!isInteractive) return;

        if (chunk.type === 'modifier') {
            removeChunk(chunk.id);
        } else {
            triggerChunkShake(chunk.id);
        }
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        addMessage({ role: 'student', text: inputText });
        setInputText("");
    };

    // 接收任务
    const handleReceiveTask = () => {
        receiveCoachingTask();
        setShowTaskModal(false);

        // 语音任务自动开始录音
        if (coachingTaskType === 'voice') {
            handleStartRecording();
        }
    };

    // 开始录音
    const handleStartRecording = async () => {
        const started = await audioRecorder.startRecording();
        if (started) {
            setIsRecording(true);
        } else {
            addMessage({ role: 'student', text: '🎙️ 麦克风权限获取失败' });
        }
    };

    // 停止录音并转写
    const handleStopRecording = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        try {
            const audioBlob = await audioRecorder.stopRecording();
            if (!audioBlob) {
                setIsTranscribing(false);
                return;
            }

            // 调用 STT API
            const result = await transcribeAudio(audioBlob, 'zh');

            if (result.success && result.transcript) {
                addMessage({ role: 'student', text: result.transcript });
                completeCoachingTask();
            } else {
                addMessage({ role: 'student', text: '🎙️ 语音识别失败，请重试' });
            }
        } catch (error) {
            console.error('[Voice] Error:', error);
            addMessage({ role: 'student', text: '🎙️ 录音处理失败' });
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className="flex h-full w-full">
            {/* 任务弹窗 */}
            <AnimatePresence>
                {showTaskModal && coachingTaskType && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                    {coachingTaskType === 'voice' ? <Mic size={20} className="text-white" /> : <Sparkles size={20} className="text-white" />}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">老师发布了任务</div>
                                    <div className="text-xs text-slate-500">
                                        {coachingTaskType === 'voice' ? '语音回答' : '标记任务'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-lg">
                                {coachingTaskType === 'voice' ? '请用语音告诉老师你的理解' : '请在句子中标记'}
                            </div>
                            <button
                                onClick={handleReceiveTask}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
                            >
                                开始任务
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 录音状态悬浮按钮 */}
            {coachingTaskReceived && coachingTaskType === 'voice' && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                    {isRecording ? (
                        <button
                            onClick={handleStopRecording}
                            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-2xl flex items-center gap-2 animate-pulse"
                        >
                            <Mic size={20} />
                            <span>停止录音</span>
                        </button>
                    ) : isTranscribing ? (
                        <div className="px-6 py-3 bg-slate-100 text-slate-600 font-medium rounded-full shadow-lg flex items-center gap-2">
                            <Loader2 size={20} className="animate-spin" />
                            <span>正在识别...</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleStartRecording}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-full shadow-2xl flex items-center gap-2"
                        >
                            <Mic size={20} />
                            <span>开始录音</span>
                        </button>
                    )}
                </motion.div>
            )}

            {/* Left: Sentence Surgery Area */}
            <div
                className="flex-1 h-full flex flex-col justify-center items-center p-8 border-r border-slate-200 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 180, 238, 0.08) 0%, rgba(0, 180, 238, 0.12) 40%, rgba(253, 231, 0, 0.1) 70%, rgba(253, 231, 0, 0.15) 100%)'
                }}
            >
                {/* 背景装饰 */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-cyan-200 to-blue-200 blur-[120px]" />
                </div>

                {/* 顶部状态提示 */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur border border-slate-200 px-5 py-2 rounded-full shadow-sm text-sm font-bold text-slate-600 flex items-center gap-2 z-10">
                    {surgeryMode === 'observation' && (
                        <>
                            <Eye size={16} className="text-slate-400" />
                            <span>观察模式</span>
                        </>
                    )}
                    {surgeryMode === 'teacher' && (
                        <>
                            <GraduationCap size={16} className="text-indigo-500" />
                            <span>教师演示中...</span>
                        </>
                    )}
                    {surgeryMode === 'student' && (
                        <>
                            <Scissors size={16} className="text-emerald-500 animate-pulse" />
                            <span>尝试移除修饰语！</span>
                        </>
                    )}
                </div>

                {/* 句子卡片 */}
                <div className="relative z-10 w-full max-w-4xl">
                    {!hasSurgeryData ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">📝</div>
                            <div className="text-xl font-bold text-slate-400 mb-2">暂无长难句数据</div>
                            <div className="text-sm text-slate-400">当前文章尚未录入长难句拆解内容</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {/* 磁性句子区域 */}
                            <LayoutGroup>
                                <motion.div layout className="flex flex-wrap justify-center items-center gap-x-4 gap-y-8">
                                    <AnimatePresence mode="popLayout">
                                        {surgeryChunks.filter(c => !c.isRemoved).map((chunk) => (
                                            <motion.div
                                                layout
                                                key={chunk.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    x: chunk.shake ? [0, -5, 5, -5, 5, 0] : 0,
                                                    color: chunk.shake ? '#ef4444' : '#0f172a'
                                                }}
                                                exit={{
                                                    y: -50,
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    transition: { duration: 0.3 }
                                                }}
                                                transition={{
                                                    layout: { type: "spring", stiffness: 300, damping: 25 }
                                                }}
                                                onClick={() => handleChunkClick(chunk)}
                                                className={`
                                                    relative px-3 py-2 rounded-xl transition-all duration-200
                                                    ${dynamicFontSize} font-serif font-bold tracking-tight
                                                    ${isInteractive
                                                        ? 'cursor-pointer pointer-events-auto'
                                                        : 'cursor-default pointer-events-none'
                                                    }
                                                    ${isInteractive && chunk.type === 'modifier' ? 'hover:bg-white/60 hover:shadow-lg' : ''}
                                                    ${chunk.type === 'core' ? 'text-slate-900' : 'text-slate-700'}
                                                    ${chunk.shake ? '!text-red-500' : ''}
                                                `}
                                            >
                                                {chunk.text}

                                                {/* 学生模式下的提示指示器 */}
                                                {isInteractive && chunk.type === 'modifier' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -5 }}
                                                        whileHover={{ opacity: 1, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-sans font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg"
                                                        style={{
                                                            backgroundColor: '#00B4EE',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        点击移除
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </LayoutGroup>

                            {/* 进度显示 */}
                            <div className="mt-12 flex justify-center">
                                <div className="px-5 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-white/60 flex items-center gap-3 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                                    <div className="flex items-center gap-1.5">
                                        {surgeryList.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSurgeryIndex ? 'w-5 bg-blue-500' : 'w-1.5 bg-slate-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-slate-600 ml-1">
                                        {currentSurgeryIndex + 1} / {surgeryList.length}
                                    </span>
                                </div>
                            </div>

                            {/* 底部提示 */}
                            <div className="mt-8 text-center text-slate-500 text-base font-medium">
                                {surgeryMode === 'student'
                                    ? "点击修饰语部分来简化句子"
                                    : "等待教师指令..."}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Video + Chat Area */}
            <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col bg-gradient-to-b from-slate-50/30 to-white h-full relative border-l border-slate-100 p-6">

                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="student-video"
                    className="relative w-full shrink-0 mb-6 rounded-xl shadow-md"
                    placeholderText="老师视频连线中..."
                    videoStream={remoteStream}
                />

                {/* 聊天区域 */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
                    {/* 聊天头部 */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                        <span className="text-sm font-bold text-slate-700">互动消息</span>
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                    </div>

                    {/* 消息列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                暂无消息
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'student'
                                        ? 'bg-[#00B4EE] text-white rounded-br-sm'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* 输入区域 */}
                    <div className="p-3 border-t border-slate-100 shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="输入消息..."
                                className="flex-1 px-4 py-2 text-sm rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00B4EE]/30 focus:border-[#00B4EE]"
                            />
                            <button
                                onClick={handleSend}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                style={{ backgroundColor: '#00B4EE' }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
