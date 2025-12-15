import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../../../store';
import { MessageCircle, ArrowRight } from 'lucide-react';

/**
 * 聊天面板组件（内嵌式，简洁风格）
 */
export const ChatPanel: React.FC<{ role: 'student' | 'coach' }> = ({ role }) => {
    const { messages, addMessage } = useGameStore();
    const [inputText, setInputText] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        addMessage({ role, text: inputText });
        setInputText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-full">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    CHAT LOG
                </span>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <MessageCircle size={32} className="mb-2 opacity-30" />
                        <p className="text-xs">暂无消息</p>
                    </div>
                )}
                {messages.slice(-10).map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === role ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                msg.role === role
                                    ? 'bg-[#00A0E9] text-white'
                                    : msg.role === 'jarvis'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                            <div className="text-[10px] opacity-60 mb-0.5 font-semibold">
                                {msg.role === 'jarvis' ? 'Jarvis' : 
                                 msg.role === role ? 'You' : 
                                 msg.role === 'student' ? 'Student' : 
                                 'Coach'}
                            </div>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="border-t border-slate-200 p-3 bg-white flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={role === 'student' ? '向老师提问...' : '给学生留言...'}
                    className="flex-1 px-4 py-2 text-sm bg-white rounded-lg border-2 border-[#00A0E9] focus:outline-none focus:border-[#0088CC] transition-colors placeholder:text-slate-400"
                />
                <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
                >
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

