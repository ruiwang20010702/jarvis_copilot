import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import { Target, Zap, TrendingUp, Send } from 'lucide-react';

/**
 * 学生端热身组件
 * Student Warmup View - 互动聊天和任务介绍
 */
export const StudentWarmupView: React.FC = () => {
    const { messages, quickReplies, addMessage, setQuickReplies, remoteStream } = useGameStore();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [inputText, setInputText] = useState("");

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        addMessage({ role: 'student', text: inputText });
        setInputText("");
    };

    const handleQuickReply = (text: string) => {
        addMessage({ role: 'student', text: text });
        setQuickReplies([]);
    };

    return (
        <div className="flex h-full w-full">
            {/* Left: Task Board */}
            <div
                className="flex-1 h-full flex flex-col justify-center items-center p-12 border-r border-slate-200 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 180, 238, 0.08) 0%, rgba(0, 180, 238, 0.12) 40%, rgba(253, 231, 0, 0.1) 70%, rgba(253, 231, 0, 0.15) 100%)'
                }}
            >

                <div className="relative z-10 max-w-lg text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-6 px-3 py-1.5 rounded-full border"
                        style={{ color: '#00B4EE', backgroundColor: 'rgba(0, 180, 238, 0.1)', borderColor: 'rgba(0, 180, 238, 0.2)' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#00B4EE' }} />
                        阅读挑战第 15 天
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight" style={{ color: '#1A1A1A' }}>
                        欢迎回来，<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(to right, #00B4EE, #0088CC)' }}>Alex</span>
                    </h1>

                    {/* 兴趣标签 - 品牌色 + 呼吸动效 */}
                    <div className="flex flex-wrap gap-2 mb-10">
                        <motion.div
                            className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                            style={{ backgroundColor: 'rgba(0, 180, 238, 0.1)', borderWidth: '1px', borderColor: 'rgba(0, 180, 238, 0.2)', color: '#00B4EE' }}
                            animate={{
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                    '0 0 0 0 rgba(0, 180, 238, 0)',
                                    '0 0 0 4px rgba(0, 180, 238, 0.15)',
                                    '0 0 0 0 rgba(0, 180, 238, 0)'
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Target size={16} className="shrink-0" />
                            <span>篮球</span>
                        </motion.div>
                        <motion.div
                            className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                            style={{ backgroundColor: 'rgba(253, 231, 0, 0.1)', borderWidth: '1px', borderColor: 'rgba(253, 231, 0, 0.3)', color: '#B39B00' }}
                            animate={{
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                    '0 0 0 0 rgba(253, 231, 0, 0)',
                                    '0 0 0 4px rgba(253, 231, 0, 0.2)',
                                    '0 0 0 0 rgba(253, 231, 0, 0)'
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.3
                            }}
                        >
                            <Zap size={16} className="shrink-0" />
                            <span>青少年运动</span>
                        </motion.div>
                        <motion.div
                            className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                            style={{ backgroundColor: 'rgba(0, 180, 238, 0.1)', borderWidth: '1px', borderColor: 'rgba(0, 180, 238, 0.2)', color: '#0077B5' }}
                            animate={{
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                    '0 0 0 0 rgba(0, 180, 238, 0)',
                                    '0 0 0 4px rgba(0, 180, 238, 0.15)',
                                    '0 0 0 0 rgba(0, 180, 238, 0)'
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.6
                            }}
                        >
                            <TrendingUp size={16} className="shrink-0" />
                            <span>职业发展</span>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className="bg-white p-5 rounded-2xl shadow-sm"
                            style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#808080' }}>今日目标</div>
                            <div className="text-xl font-bold" style={{ color: '#1A1A1A' }}>3 篇文章</div>
                        </div>
                        <div
                            className="bg-white p-5 rounded-2xl shadow-sm"
                            style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#808080' }}>专项技能</div>
                            <div className="text-xl font-bold" style={{ color: '#1A1A1A' }}>细节理解题</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Video + Chat Area - 统一容器风格 */}
            <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col bg-gradient-to-b from-slate-50/30 to-white h-full relative border-l border-slate-100 p-6">

                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="student-video"
                    className="relative w-full shrink-0 mb-6 rounded-xl shadow-md"
                    placeholderText="老师视频连线中..."
                    style={{ border: '1px solid rgba(0, 180, 238, 0.4)' }}
                    videoStream={remoteStream}
                />

                {/* 互动消息区 - 圆角卡片风格 */}
                <div
                    className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden min-h-0"
                    style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                >
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                        <span className="text-xs font-semibold text-slate-500">
                            互动消息
                        </span>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>

                    {/* 消息区域 */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 relative scroll-smooth no-scrollbar">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex w-full ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm border
                                    ${msg.role === 'student'
                                                ? 'text-white border-transparent rounded-br-none'
                                                : 'border-slate-100 rounded-bl-none'}`}
                                        style={msg.role === 'student'
                                            ? { background: 'linear-gradient(to bottom right, #00B4EE, #0088CC)', boxShadow: '0 2px 8px rgba(0, 180, 238, 0.2)' }
                                            : { backgroundColor: '#F9FAFB', color: '#4D4D4D' }}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="min-h-[90px] bg-slate-50 px-5 pb-5 pt-2 relative z-20 border-t border-slate-100 shrink-0">
                        {/* Floating Quick Replies */}
                        <div className="absolute bottom-full left-0 w-full px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                            <AnimatePresence>
                                {quickReplies.map((reply) => (
                                    <motion.button
                                        key={reply}
                                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={() => handleQuickReply(reply)}
                                        className="whitespace-nowrap px-4 py-2 bg-white rounded-full shadow-lg transition-colors text-sm font-bold"
                                        style={{
                                            borderWidth: '1px',
                                            borderColor: 'rgba(0, 180, 238, 0.2)',
                                            color: '#00B4EE',
                                            boxShadow: '0 2px 8px rgba(0, 180, 238, 0.05)'
                                        }}
                                    >
                                        {reply}
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="输入消息..."
                                className="flex-1 h-12 rounded-full px-5 text-sm transition-all border focus:outline-none"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    color: '#1A1A1A',
                                    borderColor: 'transparent'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                className="w-12 h-12 text-white rounded-full flex items-center justify-center active:scale-95 transition-all"
                                style={{
                                    background: 'linear-gradient(to right, #00B4EE, #0088CC)',
                                    boxShadow: '0 4px 12px rgba(0, 180, 238, 0.3)'
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

