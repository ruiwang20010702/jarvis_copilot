import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useGameStore, SentenceChunk } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import { Eye, GraduationCap, Scissors, Send } from 'lucide-react';

/**
 * 学生端难句拆解组件
 * Surgery (Sentence Surgery) - 句子手术
 * 学生通过点击移除修饰语，保留句子核心
 */
export const StudentSurgeryView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const { 
        surgeryChunks, 
        surgeryMode, 
        removeChunk, 
        triggerChunkShake,
        messages,
        addMessage 
    } = useGameStore();

    const chatEndRef = useRef<HTMLDivElement>(null);
    const [inputText, setInputText] = useState("");

    // 严格模式：只有在 'student' 模式下学生才能交互
    const isInteractive = surgeryMode === 'student';

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

    return (
        <div className="flex h-full w-full">
            {/* Left: Sentence Surgery Area */}
            <div className="flex-1 h-full bg-slate-50 flex flex-col justify-center items-center p-8 border-r border-slate-200 relative overflow-hidden">
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
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 md:p-14"
                    >
                        {/* 磁性句子区域 */}
                        <LayoutGroup>
                            <motion.div layout className="flex flex-wrap justify-center items-center gap-x-2 gap-y-4">
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
                                                relative px-2 py-1 rounded-xl transition-colors duration-200
                                                text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight
                                                ${isInteractive 
                                                    ? 'cursor-pointer pointer-events-auto' 
                                                    : 'cursor-default pointer-events-none'
                                                }
                                                ${isInteractive && chunk.type === 'modifier' ? 'hover:bg-blue-50 hover:text-blue-800' : ''}
                                                ${isInteractive && chunk.type === 'core' ? 'hover:cursor-not-allowed' : ''}
                                                ${chunk.shake ? 'text-red-500' : 'text-slate-900'}
                                            `}
                                        >
                                            {chunk.text}
                                            
                                            {/* 学生模式下的提示指示器 */}
                                            {isInteractive && chunk.type === 'modifier' && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    whileHover={{ opacity: 1 }}
                                                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-sans font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap"
                                                >
                                                    点击移除
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </LayoutGroup>
                        
                        {/* 底部提示 */}
                        <div className="mt-10 text-center text-slate-400 text-sm font-medium">
                            {surgeryMode === 'student' 
                                ? "点击多余的修饰语来简化句子" 
                                : "等待教师指令..."}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right: Video + Chat Area */}
            <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col bg-gradient-to-b from-slate-50/30 to-white h-full relative border-l border-slate-100 p-6">
                
                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="student-video"
                    className="relative w-full shrink-0 mb-6 rounded-xl shadow-md"
                    placeholderText="老师视频连线中..."
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
                                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                                        msg.role === 'student' 
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
