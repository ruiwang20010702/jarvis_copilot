import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import { 
    Target, Mountain, Music, BarChart3,
    Sparkles, MessageSquare, ArrowRight, Dribbble, Snowflake,
    GraduationCap, BrainCircuit, HeartHandshake, Flame
} from 'lucide-react';

/**
 * 教师端热身组件
 * Coach Warmup View - 监控学生信息并引导对话
 */
export const CoachWarmupView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
     const { addMessage, setQuickReplies, messages } = useGameStore();
     const [coachInput, setCoachInput] = useState("");
     const chatRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
     }, [messages]);

     const handleSendCoachMsg = () => {
         if (!coachInput.trim()) return;
         addMessage({ role: 'coach', text: coachInput });
         setCoachInput("");
     };

     const triggerOpening = () => {
        addMessage({ role: 'coach', text: 'Hi Alex! 我注意到你喜欢篮球，今天准备好读一篇篮球相关的文章了吗？' });
        setQuickReplies(["教练好！我准备好了！🏀", "我想先聊聊昨天的比赛"]);
    };

    return (
        <main className="h-full w-full flex bg-gray-50 p-6 gap-6 overflow-hidden">
            {/* Left Pane (70%): 学员全景档案 */}
            <div 
                className="flex-[7] bg-white rounded-3xl shadow-sm p-8 flex flex-col h-full overflow-auto"
                style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
            >
                {/* Header: 身份区 */}
                <div className="mb-8">
                    {/* 标题 */}
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                        学员信息 / Student Profile
                    </h2>
                    
                    {/* 主信息行：左(头像/姓名) + 中(阅读挑战) + 右(标签矩阵) */}
                    <div className="flex items-center justify-between gap-10">
                        {/* 左侧：头像 + 名字 */}
                        <div className="flex items-center gap-4">
                            {/* 头像 */}
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md" style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}>
                                AJ
                            </div>
                            {/* 名字 */}
                            <div>
                                <h1 className="text-4xl font-bold" style={{ color: '#1A1A1A' }}>Alex</h1>
                                <p className="text-sm text-slate-500 mt-1">Alex Johnson</p>
                            </div>
                        </div>

                        {/* 中间：阅读挑战连胜徽章 */}
                        <div className="flex items-center gap-2 px-5 py-3 bg-orange-50/80 border border-orange-100 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 shrink-0 h-16">
                            <Flame className="w-7 h-7 text-orange-600 fill-orange-600 animate-pulse" />
                            <span className="text-orange-600 font-extrabold text-2xl leading-none">
                                15
                            </span>
                            <span className="text-orange-500 text-[11px] font-bold uppercase tracking-wider leading-none">
                                DAYS
                            </span>
                        </div>
                        
                        {/* 右侧：标签矩阵 (品牌蓝 #00B4EE/黄 深色系文字 + 呼吸动效) */}
                        <div className="flex flex-col gap-3 items-end">
                            {/* Row 1: 兴趣标签 */}
                            <div className="flex gap-3">
                                <div className="px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border shadow-sm animate-pulse hover:scale-105 transition-all duration-300"
                                    style={{ backgroundColor: 'rgba(0, 180, 238, 0.08)', borderColor: 'rgba(0, 180, 238, 0.25)', color: '#0088CC' }}>
                                    <Dribbble className="w-3.5 h-3.5 shrink-0" style={{ color: '#00B4EE' }} />
                                    <span>篮球</span>
                                </div>
                                <div className="px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 bg-yellow-50/80 border border-yellow-200 shadow-sm animate-pulse hover:scale-105 transition-all duration-300 text-yellow-700">
                                    <Snowflake className="w-3.5 h-3.5 shrink-0 text-yellow-600" />
                                    <span>滑雪</span>
                                </div>
                                <div className="px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border shadow-sm animate-pulse hover:scale-105 transition-all duration-300"
                                    style={{ backgroundColor: 'rgba(0, 180, 238, 0.08)', borderColor: 'rgba(0, 180, 238, 0.25)', color: '#0088CC' }}>
                                    <Music className="w-3.5 h-3.5 shrink-0" style={{ color: '#00B4EE' }} />
                                    <span>音乐</span>
                                </div>
                            </div>
                            {/* Row 2: 教学画像 */}
                            <div className="flex gap-3">
                                <div className="px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border shadow-sm animate-pulse hover:scale-105 transition-all duration-300"
                                    style={{ backgroundColor: 'rgba(0, 180, 238, 0.08)', borderColor: 'rgba(0, 180, 238, 0.25)', color: '#0088CC' }}>
                                    <GraduationCap className="w-3.5 h-3.5 shrink-0" style={{ color: '#00B4EE' }} />
                                    <span>初二</span>
                                </div>
                                <div className="px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border shadow-sm animate-pulse hover:scale-105 transition-all duration-300"
                                    style={{ backgroundColor: 'rgba(0, 180, 238, 0.08)', borderColor: 'rgba(0, 180, 238, 0.25)', color: '#0088CC' }}>
                                    <BrainCircuit className="w-3.5 h-3.5 shrink-0" style={{ color: '#00B4EE' }} />
                                    <span>视觉型</span>
                                </div>
                                <div className="px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 bg-yellow-50/80 border border-yellow-200 shadow-sm animate-pulse hover:scale-105 transition-all duration-300 text-yellow-700">
                                    <HeartHandshake className="w-3.5 h-3.5 shrink-0 text-yellow-600" />
                                    <span>偏好: 幽默鼓励</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body: 数据看板 (2x2 Grid) */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 size={18} style={{ color: '#00B4EE' }} />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                            核心数据看板
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 h-[calc(100%-3rem)]">
                        {/* 词汇量 */}
                        <div 
                            className="bg-gray-50 rounded-xl p-6 flex flex-col justify-center"
                            style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                                词汇量 / Vocab
                            </div>
                            <div className="text-5xl font-black mb-2" style={{ color: '#00B4EE' }}>
                                4300
                            </div>
                            <div className="text-sm text-slate-400">掌握单词数</div>
                        </div>
                        
                        {/* 当前等级 */}
                        <div 
                            className="bg-gray-50 rounded-xl p-6 flex flex-col justify-center"
                            style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                                当前等级 / Level
                            </div>
                            <div className="text-5xl font-black mb-2" style={{ color: '#FDE700' }}>
                                L0
                            </div>
                            <div className="text-sm text-slate-400">初级阅读者</div>
                        </div>
                        
                        {/* 今日目标 */}
                        <div 
                            className="bg-gray-50 rounded-xl p-6 flex flex-col justify-center"
                            style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                                今日目标 / Goal
                            </div>
                            <div className="text-5xl font-black mb-2" style={{ color: '#00B4EE' }}>
                                3
                            </div>
                            <div className="text-sm text-slate-400">篇文章</div>
                        </div>
                        
                        {/* 专项技能 */}
                        <div 
                            className="bg-gray-50 rounded-xl p-6 flex flex-col justify-center"
                            style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
                                专项技能 / Skill
                            </div>
                            <div className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                                细节理解题
                            </div>
                            <div className="text-sm text-slate-400">Detail Questions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Pane (30%): 工具栈 */}
            <div className="flex-[3] flex flex-col gap-4 h-full overflow-hidden">
                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="coach-video"
                    className="relative w-full shrink-0 rounded-xl shadow-md"
                    placeholderText="学生视频连线中..."
                    style={{ border: '1px solid rgba(0, 180, 238, 0.4)' }}
                />

                {/* Slot 2: Jarvis 建议 */}
                <div 
                    className="shrink-0 bg-white rounded-xl shadow-sm p-5"
                    style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                >
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-3">
                        <Sparkles size={16} style={{ color: '#00B4EE' }} />
                        <span className="uppercase tracking-wider">Jarvis 建议</span>
                    </div>
                    <button
                        onClick={triggerOpening}
                        className="group w-full text-left p-4 rounded-xl transition-all active:scale-[0.98] flex items-start justify-between"
                        style={{ backgroundColor: 'rgba(0, 180, 238, 0.05)', border: '1px solid rgba(0, 180, 238, 0.1)' }}
                    >
                        <div className="flex-1">
                            <h3 className="text-slate-800 font-bold text-sm mb-2 flex items-center gap-2">
                                <MessageSquare size={16} style={{ color: '#00B4EE' }} />
                                发送开场白
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                "Hi Alex! 我注意到你喜欢篮球，今天准备好读一篇篮球相关的文章了吗？"
                            </p>
                        </div>
                        <div className="ml-3 shrink-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00B4EE' }}>
                                <ArrowRight size={16} className="text-white" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Slot 3: 互动窗口 (Chat) */}
                <div 
                    className="flex-1 flex flex-col bg-white rounded-xl overflow-hidden shadow-sm min-h-0"
                    style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}
                >
                    <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">互动窗口</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    
                    <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-300">
                                <div className="text-center">
                                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">暂无消息</p>
                                </div>
                            </div>
                        ) : (
                            messages.map((m) => (
                                <div key={m.id} className={`flex flex-col ${m.role === 'coach' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-slate-400 mb-1 uppercase">{m.role}</span>
                                    <div className={`p-3 rounded-xl max-w-[85%] text-sm ${
                                        m.role === 'coach' 
                                        ? 'text-white' 
                                        : m.role === 'student'
                                        ? 'bg-slate-100 text-slate-700' 
                                        : 'bg-yellow-50 text-yellow-800'
                                    }`}
                                    style={m.role === 'coach' ? { backgroundColor: '#00B4EE' } : {}}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
                        <input 
                            className="flex-1 bg-white text-slate-800 text-sm px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                            placeholder="给学生留言..."
                            value={coachInput}
                            onChange={(e) => setCoachInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendCoachMsg()}
                        />
                        <button 
                            onClick={handleSendCoachMsg}
                            className="p-2 rounded-lg transition-colors flex items-center justify-center"
                            style={{ backgroundColor: '#00B4EE' }}
                        >
                            <ArrowRight size={18} className="text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

