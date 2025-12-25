import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Search, Highlighter, PenLine, AlertCircle, AlertTriangle,
    Monitor, FileQuestion, Sparkles, Lightbulb, CheckCircle2, ListChecks
} from 'lucide-react';

type ActivityType = 'quiz' | 'lookup' | 'highlight' | 'alert';

interface Activity {
    id: string;
    type: ActivityType;
    timestamp: string;
    content: string;
    detail?: string;
    isUnsure?: boolean;
}

export const CoachBattleView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const { articleData, highlights, lookups, quizAnswers, remoteStream } = useGameStore();

    console.log('[CoachBattleView] remoteStream:', remoteStream ? 'MediaStream with ' + remoteStream.getTracks().length + ' tracks' : 'null');


    const generateActivities = (): Activity[] => {
        const activities: Activity[] = [];
        lookups.forEach((lookup, i) => {
            activities.push({ id: `lookup - ${i} `, type: 'lookup', timestamp: `16: 25:${30 + i} `, content: 'Alex 查询单词', detail: lookup.word });
        });
        highlights.forEach((h, i) => {
            activities.push({ id: `highlight - ${i} `, type: 'highlight', timestamp: `16: 24:${40 + i} `, content: 'Alex 高亮了', detail: h.text.substring(0, 25) });
        });
        quizAnswers.forEach((answer, i) => {
            activities.push({ id: `quiz - ${i} `, type: 'quiz', timestamp: `16: 26:${10 + i} `, content: `Alex 回答第 ${answer.questionId} 题`, detail: `选择了 ${answer.optionId} `, isUnsure: answer.isUnsure });
        });
        activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        activities.unshift({ id: 'system-alert-base', type: 'alert', timestamp: '刚刚', content: '系统提醒', detail: 'Alex 已经 1 分钟 没有进行操作' });
        return activities;
    };

    const activities = generateActivities();
    const hasStagnation = true;

    const getActivityStyle = (type: ActivityType) => {
        switch (type) {
            case 'quiz': return { bg: 'rgba(253, 231, 0, 0.1)', border: '#FDE700', icon: <PenLine size={10} className="text-yellow-700" />, iconBg: 'rgba(253, 231, 0, 0.2)' };
            case 'lookup': return { bg: 'rgba(0, 180, 238, 0.08)', border: '#00B4EE', icon: <Search size={10} style={{ color: '#00B4EE' }} />, iconBg: 'rgba(0, 180, 238, 0.15)' };
            case 'highlight': return { bg: 'rgba(0, 180, 238, 0.08)', border: '#00B4EE', icon: <Highlighter size={10} style={{ color: '#00B4EE' }} />, iconBg: 'rgba(0, 180, 238, 0.15)' };
            case 'alert': return { bg: 'rgba(239, 68, 68, 0.08)', border: '#EF4444', icon: <AlertTriangle size={10} className="text-red-600" />, iconBg: 'rgba(239, 68, 68, 0.15)' };
        }
    };

    const renderParagraph = (text: string, paragraphIndex: number) => {
        // 只渲染当前段落的高亮
        const paragraphHighlights = highlights.filter(h => h.paragraphIndex === paragraphIndex);
        let parts = [{ text, isHighlight: false }];
        paragraphHighlights.forEach(h => {
            const newParts: typeof parts = [];
            parts.forEach(part => {
                if (part.isHighlight) { newParts.push(part); }
                else {
                    const split = part.text.split(h.text);
                    for (let i = 0; i < split.length; i++) {
                        if (i > 0) newParts.push({ text: h.text, isHighlight: true });
                        if (split[i]) newParts.push({ text: split[i], isHighlight: false });
                    }
                }
            });
            parts = newParts;
        });
        return (
            <p className="mb-4 text-sm leading-relaxed text-slate-600 font-serif">
                {parts.map((part, i) => part.isHighlight ? <span key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">{part.text}</span> : <span key={i}>{part.text}</span>)}
            </p>
        );
    };

    return (
        <main className="h-full w-full flex bg-gray-50 p-6 gap-6 overflow-hidden">
            {/* Left Pane: 70% - Article & Quiz Monitoring */}
            <div className="flex-[7] bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="h-14 border-b border-slate-100 flex justify-between items-center px-8 bg-white z-10 shrink-0">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 tracking-wider">
                        <Monitor size={14} />实时监控
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-500 font-mono">已同步</span>
                    </div>
                </div>

                {/* Article Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8 relative">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold text-slate-800 mb-8 font-serif">{articleData.title}</h2>
                            {articleData.paragraphs.map((para, i) => <div key={i}>{renderParagraph(para, i)}</div>)}
                        </div>
                    </div>

                    {/* Quiz Monitoring Section */}
                    <div className="px-8 pb-8">
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-6 flex items-center gap-3">
                                <FileQuestion size={20} style={{ color: '#00B4EE' }} />
                                <h3 className="text-xl font-bold text-slate-800">学生答题监控</h3>
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-sm text-slate-500">{quizAnswers.length}/{articleData.quiz.length} 已答</span>
                            </div>
                            <div className="space-y-6">
                                {articleData.quiz.map((q, idx) => {
                                    const studentAnswer = quizAnswers.find(a => a.questionId === q.id);
                                    return (
                                        <div key={q.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                            <div className="flex gap-4 mb-4">
                                                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-200">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-sm font-semibold text-slate-700 leading-relaxed pt-1 font-serif">{q.question}</p>
                                            </div>
                                            <div className="space-y-2.5 pl-11">
                                                {q.options.map(opt => {
                                                    const isStudentChoice = studentAnswer?.optionId === opt.id;
                                                    return (
                                                        <div
                                                            key={opt.id}
                                                            className={`text - sm py - 3 px - 4 rounded - xl border transition - all ${isStudentChoice ? 'border-blue-600 shadow-blue-200 shadow-sm' : 'bg-white border-slate-200'
                                                                } `}
                                                            style={isStudentChoice ? { backgroundColor: '#00B4EE', color: 'white' } : {}}
                                                        >
                                                            <span className={`font - bold mr - 3 ${isStudentChoice ? 'text-white' : 'text-slate-400'} `}>
                                                                {opt.id}
                                                            </span>
                                                            <span className="font-serif">{opt.text}</span>
                                                            {isStudentChoice && studentAnswer?.isUnsure && (
                                                                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full inline-flex items-center gap-1"
                                                                    style={{ backgroundColor: '#FDE700', color: '#1A1A1A' }}>
                                                                    <AlertCircle size={12} />不确定
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Pane: 30% - Vertical Stack */}
            <div className="flex-[3] flex flex-col gap-4 h-full overflow-hidden">

                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="coach-video"
                    className="relative w-full shrink-0 rounded-xl shadow-md"
                    videoStream={remoteStream}
                />

                {/* Slot 2: Stats Grid - Keep Original */}
                <div className="shrink-0 grid grid-cols-2 gap-2">
                    <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                        <div className="text-slate-500 text-[10px] font-semibold mb-1">查词次数</div>
                        <div className="text-xl font-bold leading-tight" style={{ color: '#00B4EE' }}>
                            {lookups.length}/3
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                        <div className="text-slate-500 text-[10px] font-semibold mb-1">答题进度</div>
                        <div className="text-xl font-bold leading-tight" style={{ color: '#00B4EE' }}>
                            {quizAnswers.length}/{articleData.quiz.length}
                        </div>
                    </div>
                </div>

                {/* Slot 3: Activity Log - ⬆️ Expanded (flex-1) */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm min-h-0">
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
                        <span className="text-xs font-semibold text-slate-500">实时活动记录</span>
                    </div>
                    {/* Activity List - Increased gap to prevent overlap */}
                    <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                        {activities.map((activity) => {
                            const style = getActivityStyle(activity.type);
                            return (
                                <div
                                    key={activity.id}
                                    className="shrink-0 relative rounded-md overflow-hidden transition-all hover:shadow-sm"
                                    style={{ backgroundColor: style.bg, border: `1px solid ${style.border} 20` }}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: style.border }} />
                                    <div className="pl-2.5 pr-1.5 py-1.5 flex items-center gap-1.5">
                                        <div className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: style.iconBg }}>
                                            {style.icon}
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-semibold text-slate-700">
                                                {activity.content}
                                                {activity.detail && <span className="text-[9px] text-slate-600"> {activity.detail}</span>}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-400 shrink-0">{activity.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {activities.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                    <ListChecks size={16} className="text-slate-400" />
                                </div>
                                <p className="text-[10px] text-slate-400">暂无活动记录</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Slot 4: Jarvis Assistant - ⬇️ Shrunk (fixed height) */}
                <div className="shrink-0 h-48 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 shrink-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#00B4EE' }}>
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-800">Jarvis 助教</h3>
                            <p className="text-[10px] text-slate-500">AI 智能建议</p>
                        </div>
                    </div>
                    <div className="flex-1 px-4 pb-4 flex flex-col gap-2 overflow-y-auto">
                        {hasStagnation ? (
                            <>
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2.5 border border-orange-200/50 shadow-sm shrink-0">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shadow-sm">
                                            <AlertTriangle size={14} className="text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[10px] font-bold text-orange-700 mb-1">⚠️ 学生停滞检测</h4>
                                            <p className="text-[10px] text-slate-700 leading-relaxed">
                                                Alex 已经 <span className="font-bold text-orange-600">1 分钟</span> 没有进行任何操作。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2.5 border border-cyan-200/50 shadow-sm flex-1 min-h-0 overflow-y-auto">
                                    <h4 className="text-[10px] font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Lightbulb size={12} className="text-amber-500" />建议行动
                                    </h4>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-slate-700">
                                            <span className="font-bold" style={{ color: '#00B4EE' }}>1.</span> 发送语音鼓励
                                        </p>
                                        <p className="text-[10px] text-slate-700">
                                            <span className="font-bold" style={{ color: '#00B4EE' }}>2.</span> 推送长难句解析
                                        </p>
                                        <p className="text-[10px] text-slate-700">
                                            <span className="font-bold" style={{ color: '#00B4EE' }}>3.</span> 考虑降低难度
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2.5 border border-green-200/50 shadow-sm">
                                <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shadow-sm">
                                        <CheckCircle2 size={14} className="text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-bold text-green-700 mb-1">✅ 学习状态良好</h4>
                                        <p className="text-[10px] text-slate-700 leading-relaxed">Alex 正在专注阅读，表现优秀。</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};
