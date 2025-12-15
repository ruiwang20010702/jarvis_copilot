
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore, Stage, ViewMode, VocabItem, SentenceChunk } from '../store';

// 新拆分的模块导入
import { StudentWarmupView, CoachWarmupView } from '../src/components/stages/Warmup';
import { StudentSkillView, CoachSkillView } from '../src/components/stages/Skill';
import { StudentBattleView, CoachBattleView, ChatPanel } from '../src/components/stages/Battle';
import { StudentCoachingView, CoachCoachingView } from '../src/components/stages/Coaching';
import { StudentVocabView, CoachVocabView } from '../src/components/stages/Vocab';
import { StudentSurgeryView, CoachSurgeryView } from '../src/components/stages/Surgery';
import { StudentReviewView, CoachReviewView } from '../src/components/stages/Review';
import {
    Zap, Swords, BrainCircuit, Library, ScanSearch, Trophy, // Navbar Icons
    User, Monitor, Split, // DevControl Icons
    MessageSquare, Mic, Sparkles, Send, Target, ChevronRight, LayoutDashboard, ArrowRight,
    Battery, Signal, Wifi, // Mobile Status Icons
    Clock, Search, Highlighter, HelpCircle, CheckCircle2, AlertCircle, X,
    Lightbulb, Volume2, VolumeX, Edit3, MessageCircle, Play,
    Stethoscope, Clapperboard, BookOpen, FileQuestion, MousePointer2, AlertTriangle, ShieldAlert,
    RotateCw, Check, ListChecks, BarChart3, Repeat, Scissors, RefreshCcw, Maximize2, PartyPopper,
    Undo2, Eye, Hand, GraduationCap, GripVertical, TrendingUp, Mountain, Music,
    PenLine, MoreHorizontal, // 实时活动记录图标
    CloudRain, Radar, // Skill Phase Icons
    Award, Star // Mini-Quiz Reward Icons
} from 'lucide-react';

// --- Types & Config ---

const STAGES: { id: Stage; label: string; icon: React.ElementType }[] = [
    { id: 'warm-up', label: '热身', icon: Zap },
    { id: 'skill', label: '技能', icon: Target },
    { id: 'battle', label: '实战', icon: Swords },
    { id: 'coaching', label: '带练', icon: BrainCircuit },
    { id: 'vocab', label: '生词', icon: Library },
    { id: 'surgery', label: '难句', icon: ScanSearch },
    { id: 'review', label: '结束', icon: Trophy },
];

// --- Components ---

const StageNavbar: React.FC = () => {
    const { currentStage, setStage } = useGameStore();

    return (
        <div className="flex gap-1 items-center bg-white/20 backdrop-blur-sm p-1 rounded-full border border-white/30">
            {STAGES.map((s) => {
                const isActive = currentStage === s.id;
                return (
                    <button
                        key={s.id}
                        onClick={() => setStage(s.id)}
                        className={`relative px-4 py-1.5 rounded-full transition-all duration-300 group ${isActive
                            ? 'shadow-sm'
                            : 'hover:bg-white/20'
                            }`}
                        style={isActive ? {} : { color: 'rgba(0,0,0,0.7)' }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="stage-active-pill"
                                className="absolute inset-0 rounded-full bg-white shadow-md"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2" style={isActive ? { color: '#00B4EE' } : {}}>
                            <s.icon size={14} strokeWidth={2.5} />
                            <span className={`text-xs font-bold tracking-wide ${isActive ? 'inline-block' : 'hidden md:inline-block'}`}>
                                {s.label}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const DevControls: React.FC = () => {
    const { viewMode, setViewMode } = useGameStore();

    return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1 p-1 bg-black/80 backdrop-blur text-white rounded-full shadow-2xl border border-white/10">
            <button
                onClick={() => setViewMode('student')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'student' ? 'bg-white/20' : 'hover:bg-white/10 text-slate-400'}`}
                title="Student View"
            >
                <User size={16} />
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button
                onClick={() => setViewMode('coach')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'coach' ? 'bg-white/20' : 'hover:bg-white/10 text-slate-400'}`}
                title="Coach View"
            >
                <Monitor size={16} />
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button
                onClick={() => setViewMode('split')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'split' ? 'bg-white/20' : 'hover:bg-white/10 text-slate-400'}`}
                title="Split View"
            >
                <Split size={16} />
            </button>
        </div>
    );
};

import { useWebRTC } from '../src/hooks/useWebRTC';
import { VideoWindow } from '../src/components/shared/VideoWindow';

// --- Main Container ---

const Classroom: React.FC = () => {
    const { userRole, viewMode, currentStage, remoteStream } = useGameStore();
    const navigate = useNavigate();
    const [remainingSeconds, setRemainingSeconds] = useState(420); // 7分钟（实战阶段专用）

    // Compute WebRTC role - MUST be correct before calling useWebRTC
    const webrtcRole: 'student' | 'teacher' = userRole === 'coach' ? 'teacher' : 'student';
    console.log('[Classroom] userRole:', userRole, 'webrtcRole:', webrtcRole);

    // Global WebRTC Connection
    useWebRTC({ role: webrtcRole });

    useEffect(() => {
        if (!userRole) navigate('/');
    }, [userRole, navigate]);


    // 倒计时逻辑（仅在实战阶段运行）
    useEffect(() => {
        if (currentStage !== 'battle') return;

        const timer = setInterval(() => {
            setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [currentStage]);

    // 格式化时间为 MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 根据剩余时间计算圆点状态
    const getTimerDotState = () => {
        if (remainingSeconds > 300) return 'normal';      // > 5分钟：绿色
        if (remainingSeconds > 60) return 'urgent';       // 1-5分钟：黄色
        return 'warning';                                 // < 1分钟：红色 + 闪烁
    };

    const timerDotState = getTimerDotState();

    return (
        <div className="w-full h-screen bg-white font-sans flex flex-col overflow-hidden">
            {/* Sticky Top Header - 品牌渐变风格 */}
            <header
                className="w-full h-16 shadow-md flex items-center justify-between px-6 z-50 shrink-0"
                style={{
                    backgroundColor: '#3B82F6', // Fallback
                    backgroundImage: `
                    radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(135deg, #3B82F6 0%, #60A5FA 25%, #FEF08A 75%, #FEF3C7 100%)
                `,
                    backgroundSize: `
                    20px 20px,
                    40px 40px,
                    40px 40px,
                    100% 100%
                `,
                    backgroundAttachment: 'fixed'
                }}
            >
                {/* Logo/Left */}
                <div className="flex items-center gap-2 font-bold text-gray-900">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ background: 'rgba(0,0,0,0.15)' }}>
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <span className="tracking-tight text-lg">Jarvis</span>
                </div>

                {/* Center Navigation - 绝对居中 */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <StageNavbar />
                </div>

                {/* Right Side - 倒计时 + 用户信息 */}
                <div className="flex items-center gap-4">
                    {/* 倒计时组件 - 幽灵按钮风格（仅实战阶段显示）*/}
                    {currentStage === 'battle' && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/40 backdrop-blur border border-white/60 rounded-xl shadow-sm">
                            {/* 状态圆点指示器 */}
                            <div className="relative flex items-center justify-center">
                                <div
                                    className={`w-2 h-2 rounded-full transition-colors ${timerDotState === 'warning' ? 'bg-red-500 animate-pulse' :
                                        timerDotState === 'urgent' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}
                                />
                                {/* 外圈光晕（警告状态）*/}
                                {timerDotState === 'warning' && (
                                    <div className="absolute inset-0 w-2 h-2 bg-red-400 rounded-full animate-ping opacity-75" />
                                )}
                            </div>

                            {/* 时间显示 */}
                            <span
                                className="font-mono font-bold text-slate-900"
                                style={{ fontSize: '15px', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em' }}
                            >
                                {formatTime(remainingSeconds)}
                            </span>
                        </div>
                    )}

                    {/* 用户信息 - 根据视图模式动态显示 */}
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-900">
                            {viewMode === 'coach' ? 'Bryce Zhou' : 'Alex Johnson'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                            {viewMode === 'coach' ? '教师' : 'Student'}
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/40 backdrop-blur border border-white/60 flex items-center justify-center text-gray-900 font-bold shadow-sm">
                        {viewMode === 'coach' ? 'BZ' : 'AJ'}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 w-full overflow-hidden relative">
                {viewMode === 'split' ? (
                    <div className="flex w-full h-full">
                        <div className="w-1/2 h-full border-r border-slate-200 relative bg-white overflow-hidden">
                            <StudentView isEmbedded />
                        </div>
                        <div className="w-1/2 h-full relative bg-white overflow-hidden">
                            <CoachView isEmbedded />
                        </div>
                    </div>
                ) : viewMode === 'coach' ? (
                    <CoachView />
                ) : (
                    <StudentView />
                )}
            </div>


            <DevControls />
        </div>
    );

};

// ==========================================
// STUDENT VIEWS
// ==========================================

const StudentView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const { currentStage } = useGameStore();

    // 使用新拆分的模块
    if (currentStage === 'warm-up') {
        return <StudentWarmupView />;
    }
    if (currentStage === 'skill') {
        return <StudentSkillView />;
    }
    if (currentStage === 'battle') {
        return <StudentBattleView isEmbedded={isEmbedded} />;
    }
    if (currentStage === 'coaching') {
        return <StudentCoachingView isEmbedded={isEmbedded} />;
    }
    if (currentStage === 'vocab') {
        return <StudentVocabView isEmbedded={isEmbedded} />;
    }
    if (currentStage === 'surgery') {
        return <StudentSurgeryView isEmbedded={isEmbedded} />;
    }
    if (currentStage === 'review') {
        return <StudentReviewView />;
    }

    return <div className="w-full h-full bg-white relative" />;
};


// StudentBattleView moved to Battle module

// ChatPanel moved to Battle module

// StudentCoachingView moved to Coaching module

// ==========================================
// PHASE 5: SENTENCE SURGERY (STUDENT)
// ==========================================


// ==========================================
// COACH VIEWS
// ==========================================

const CoachView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const { currentStage } = useGameStore();

    return (
        <div className={`w-full h-full font-sans flex flex-col ${isEmbedded ? 'text-[0.9em]' : ''}`}>
            {/* 使用新拆分的模块 */}
            {currentStage === 'warm-up' && <CoachWarmupView isEmbedded={isEmbedded} />}
            {currentStage === 'skill' && <CoachSkillView isEmbedded={isEmbedded} />}
            {currentStage === 'battle' && <CoachBattleView isEmbedded={isEmbedded} />}
            {currentStage === 'coaching' && <CoachCoachingView isEmbedded={isEmbedded} />}
            {currentStage === 'vocab' && <CoachVocabView isEmbedded={isEmbedded} />}
            {currentStage === 'surgery' && <CoachSurgeryView isEmbedded={isEmbedded} />}
            {currentStage === 'review' && <CoachReviewView />}
            <CoachStageController />
        </div>
    );
};

const CoachStageController: React.FC = () => {
    const { currentStage, setStage } = useGameStore();

    const nextStage = () => {
        const idx = STAGES.findIndex(s => s.id === currentStage);
        if (idx < STAGES.length - 1) {
            setStage(STAGES[idx + 1].id);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 pl-6 pr-2 py-2 rounded-full shadow-xl shadow-slate-200/20 flex items-center gap-8 ring-1 ring-slate-100">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Stage</span>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        {STAGES.find(s => s.id === currentStage)?.label || 'Loading...'}
                    </div>
                </div>

                <button
                    onClick={nextStage}
                    className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                    <span>下一阶段</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    )
}

// ============================================
// 🎯 Phase 2: 技能习得 (The Armory) - 教师端指挥舱
// ============================================

type SkillNode = {
    id: number;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    status: 'pending' | 'active' | 'completed';
    jarvisPrompt: string;
    jarvisAction: string;
};



// CoachBattleView moved to Battle module

// CoachCoachingView moved to Coaching module

export default Classroom;
