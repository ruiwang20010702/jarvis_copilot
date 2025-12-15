import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    CloudRain, Radar, Check, Clock, User,
    Play, Sparkles, ArrowRight, Loader2, BookOpen, Target, AlertTriangle
} from 'lucide-react';

// 5道题目数据
const DEMO_QUIZ_DATA = [
    { id: 1, question: "What time did Tom go to the park?", keywords: ["Time", "Tom", "Park"] },
    { id: 2, question: "What color was Sarah's dress?", keywords: ["Color", "Sarah", "Dress"] },
    { id: 3, question: "Where is the science museum?", keywords: ["Where", "Science Museum"] },
    { id: 4, question: "How long is the Great Wall of China?", keywords: ["How long", "Great Wall"] },
    { id: 5, question: "Why were the students late?", keywords: ["Why", "Students", "Late"] }
];

// 剧本配置
const SKILL_SCRIPT = [
    { stepIndex: 0, buttonText: "开始课程", jarvisTitle: "台词", jarvisContent: "欢迎同学们！今天我们学习用GPS定位法解题。" },
    { stepIndex: 1, buttonText: "部署解决方案", jarvisTitle: "台词", jarvisContent: "大意：阅读中最常见的就是细节理解题。就像是屏幕上这样密密麻麻的具体事实。" },
    { stepIndex: 2, buttonText: "展示口诀", jarvisTitle: "演示口诀", jarvisContent: "GPS定位法核心口诀：一圈路标，二搜原句，三锁答案。" },
    { stepIndex: 3, buttonText: "步骤 1: 圈路标", jarvisTitle: "演示步骤", jarvisContent: "跟读第一步：圈关键词定位。我们要带着题干里的关键词定位。" },
    { stepIndex: 4, buttonText: "步骤 2: 搜原句", jarvisTitle: "演示步骤", jarvisContent: "第二步：文章里定位。带着你的路标，去文章里扫描。" },
    { stepIndex: 5, buttonText: "步骤 3: 锁答案", jarvisTitle: "演示步骤", jarvisContent: "第三步：仔细比对。读懂那个长难句，和选项比对。" },
    { stepIndex: 6, buttonText: "开始练手", jarvisTitle: "台词", jarvisContent: "光说不练假把式，来做道题。" }
];

/**
 * 教师端技能阶段主组件
 */
export const CoachSkillView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const {
        skillNode,
        studentHasEquipped,
        studentConfirmedFormula,
        studentDemoStep,
        demoTeacherStep,
        setDemoTeacherStep,
        advanceSkillNode,
        setStage,
        currentQuizIndex,
        quizCompleted,
        skillQuizHighlightedWords,
        skillQuizSelectedAnswer,
        skillQuizWrongAttempt,
        remoteStream
    } = useGameStore();

    const [scriptIndex, setScriptIndex] = useState(0);

    // 当前题目
    const currentQuiz = DEMO_QUIZ_DATA[currentQuizIndex] || DEMO_QUIZ_DATA[0];

    // 根据状态同步 scriptIndex
    // scriptIndex 反映"老师接下来可以做什么"，基于学生完成进度
    useEffect(() => {
        if (skillNode === 0) {
            setScriptIndex(0);
        } else if (skillNode === 1) {
            setScriptIndex(1);
        } else if (skillNode === 2) {
            if (!studentHasEquipped) {
                setScriptIndex(1);
            } else if (!studentConfirmedFormula) {
                setScriptIndex(2);
            } else {
                // 演示阶段：根据学生完成进度决定老师下一步
                // studentDemoStep: 0=未开始, 1=圈完成, 2=搜完成, 3=锁完成
                if (studentDemoStep === 0) {
                    setScriptIndex(3); // 步骤1: 圈路标
                } else if (studentDemoStep === 1) {
                    setScriptIndex(4); // 步骤2: 搜原句
                } else if (studentDemoStep === 2) {
                    setScriptIndex(5); // 步骤3: 锁答案
                } else {
                    setScriptIndex(6); // 演示完成，准备练手
                }
            }
        } else if (skillNode === 3) {
            setScriptIndex(6);
        }
    }, [skillNode, studentHasEquipped, studentConfirmedFormula, studentDemoStep]);

    const currentScript = SKILL_SCRIPT[scriptIndex] || SKILL_SCRIPT[0];

    // 主控按钮点击处理
    const handleMainAction = () => {
        if (scriptIndex === 0) {
            advanceSkillNode(); // 0 -> 1
        } else if (scriptIndex === 1 && !studentHasEquipped) {
            advanceSkillNode(); // 1 -> 2
        } else if (scriptIndex === 2 && studentConfirmedFormula) {
            // 确认口诀后，立即进入步骤1
            setDemoTeacherStep(1);
        } else if (scriptIndex === 3 && demoTeacherStep === 0) {
            // 老师启动演示步骤1
            setDemoTeacherStep(1);
        } else if (scriptIndex === 4 && demoTeacherStep < 2) {
            // 学生完成步骤1，老师推进步骤2
            setDemoTeacherStep(2);
        } else if (scriptIndex === 5 && demoTeacherStep < 3) {
            // 学生完成步骤2，老师推进步骤3
            setDemoTeacherStep(3);
        } else if (scriptIndex === 6 && skillNode === 2) {
            // 演示完成，进入练手
            advanceSkillNode(); // 2 -> 3
        }
    };

    // 下一阶段
    const handleNextStage = () => {
        setStage('battle');
    };

    // 按钮状态判断
    const getButtonState = () => {
        // 等待装备
        if (scriptIndex === 1 && skillNode === 2 && !studentHasEquipped) {
            return { disabled: true, message: "等待学生装备...", color: "gray", subtext: "学生正在查看GPS卡" };
        }
        // 等待确认口诀
        if (scriptIndex === 2 && !studentConfirmedFormula) {
            return { disabled: true, message: "等待学生确认口诀...", color: "gray", subtext: "学生正在学习口诀" };
        }

        // 演示阶段逻辑：老师先点击启动，学生执行，完成后老师可推进下一步
        // 步骤1：老师启动演示
        if (scriptIndex === 3 && demoTeacherStep === 0) {
            return { disabled: false, message: "步骤 1: 圈路标", color: "blue", subtext: "点击启动演示" };
        }
        // 步骤1：老师已启动，等待学生点击1969
        if (scriptIndex === 3 && demoTeacherStep >= 1) {
            return { disabled: true, message: "等待学生操作...", color: "gray", subtext: "学生需要点击 '1969'" };
        }

        // 步骤2：学生完成步骤1，老师可推进步骤2（触发扫描）
        if (scriptIndex === 4 && demoTeacherStep < 2) {
            return { disabled: false, message: "步骤 2: 搜原句", color: "blue", subtext: "✓ 学生已完成圈路标" };
        }
        // 步骤2：扫描进行中
        if (scriptIndex === 4 && demoTeacherStep >= 2) {
            return { disabled: true, message: "扫描中...", color: "gray", subtext: "扫描动画进行中" };
        }

        // 步骤3：学生完成步骤2，老师可推进步骤3（触发锁定）
        if (scriptIndex === 5 && demoTeacherStep < 3) {
            return { disabled: false, message: "步骤 3: 锁答案", color: "blue", subtext: "✓ 学生已完成搜原句" };
        }
        // 步骤3：锁定进行中
        if (scriptIndex === 5 && demoTeacherStep >= 3) {
            return { disabled: true, message: "锁定中...", color: "gray", subtext: "锁定动画进行中" };
        }

        // 演示完成，可以开始练手
        if (scriptIndex === 6 && skillNode === 2) {
            return { disabled: false, message: "开始练手", color: "blue", subtext: "✓ 演示完成！" };
        }

        // Quiz阶段监控
        if (skillNode === 3 && !quizCompleted) {
            return { disabled: true, message: "监控中...", color: "gray", subtext: `Q${currentQuizIndex + 1}/5` };
        }
        // Quiz完成
        if (skillNode === 3 && quizCompleted) {
            return { disabled: false, message: "下一阶段", color: "green", subtext: "学生已完成所有题目" };
        }

        return { disabled: false, message: currentScript.buttonText, color: "blue", subtext: "" };
    };

    const buttonState = getButtonState();

    // 获取步骤标签
    const getStepLabel = () => {
        if (scriptIndex === 0) return 'START';
        if (scriptIndex === 1) return 'DEPLOY';
        if (scriptIndex === 2) return 'FORMULA';
        if (scriptIndex >= 3 && scriptIndex <= 5) return 'DEMO';
        return 'VERIFY';
    };

    return (
        <main className="h-full w-full flex bg-gray-50 p-6 gap-6 overflow-hidden">
            {/* Left Pane: 70% */}
            <div className="flex-[7] bg-gray-900 rounded-3xl border-4 border-gray-800 shadow-2xl h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'linear-gradient(rgba(0,180,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,238,0.3) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }} />

                <div className="relative z-10 flex flex-col h-full p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: '#00B4EE', boxShadow: '0 0 8px rgba(0,180,238,0.5)' }} />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest"
                            style={{ color: '#00B4EE' }}>
                            LIVE STAGE MIRROR
                        </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        {/* 等待开始 */}
                        {skillNode === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="inline-block mb-4">
                                    <Clock size={80} className="text-white/30" />
                                </motion.div>
                                <div className="text-white/60 text-2xl font-mono mb-2">等待开始</div>
                                <div className="text-white/40 text-base">点击右侧按钮开始课程</div>
                            </motion.div>
                        )}

                        {/* 文字雨 */}
                        {skillNode === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="mb-4 inline-block">
                                    <CloudRain size={80} style={{ color: '#00B4EE' }} />
                                </motion.div>
                                <div className="text-white/80 text-2xl font-mono mb-2">文字雨特效进行中</div>
                                <div className="text-white/40 text-base">学生正在体验信息过载...</div>
                            </motion.div>
                        )}

                        {/* 等待装备 */}
                        {skillNode === 2 && !studentHasEquipped && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                <motion.div
                                    className="rounded-2xl p-8 shadow-2xl inline-flex items-center justify-center mb-4"
                                    style={{ background: 'linear-gradient(135deg, #FDE700 0%, #D4C400 100%)' }}
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Radar size={64} className="text-slate-900" />
                                </motion.div>
                                <div className="text-white/80 text-2xl font-mono mb-2">GPS 定位卡已发送</div>
                                <div className="text-base flex items-center justify-center gap-2" style={{ color: '#FDE700' }}>
                                    <Clock size={20} />
                                    <span>等待学生装备...</span>
                                </div>
                            </motion.div>
                        )}

                        {/* 口诀阶段 */}
                        {skillNode === 2 && studentHasEquipped && !studentConfirmedFormula && (
                            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-4">
                                    <BookOpen size={48} className="mx-auto mb-4" style={{ color: '#FDE700' }} />
                                    <div className="text-2xl font-bold text-white mb-4">GPS 定位法口诀</div>
                                    <div className="flex gap-6 justify-center">
                                        {['圈路标', '搜原句', '锁答案'].map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-3 text-white/80 text-lg">
                                                <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">{idx + 1}</div>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-white/60 text-base font-mono">等待学生确认口诀...</div>
                            </motion.div>
                        )}

                        {/* 演示阶段 */}
                        {skillNode === 2 && studentHasEquipped && studentConfirmedFormula && (
                            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-center">
                                <div className="flex gap-8 mb-6 justify-center">
                                    {[1, 2, 3].map((num) => {
                                        const isCompleted = num <= studentDemoStep;
                                        const isActive = num === demoTeacherStep && num > studentDemoStep;
                                        const isWaiting = num === studentDemoStep + 1 && demoTeacherStep >= num;
                                        return (
                                            <motion.div
                                                key={num}
                                                animate={isWaiting ? { scale: [1, 1.2, 1] } : {}}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className={`w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-lg ${isCompleted ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                                                        : isActive || isWaiting ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                                                            : 'bg-gradient-to-br from-gray-600 to-gray-700'
                                                    }`}
                                            >
                                                {isCompleted ? <Check size={32} /> : num}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <div className="text-white/80 text-2xl font-mono mb-2">圈 → 搜 → 锁</div>
                                <div className="text-white/40 text-base">
                                    {studentDemoStep === 0 && demoTeacherStep >= 1 && '学生需要点击 "1969"'}
                                    {studentDemoStep === 1 && demoTeacherStep < 2 && '✓ 步骤1完成！点击推进步骤2'}
                                    {studentDemoStep === 1 && demoTeacherStep >= 2 && '扫描动画进行中...'}
                                    {studentDemoStep === 2 && demoTeacherStep < 3 && '✓ 步骤2完成！点击推进步骤3'}
                                    {studentDemoStep === 2 && demoTeacherStep >= 3 && '锁定动画进行中...'}
                                    {studentDemoStep >= 3 && '✓ 演示完成！准备开始练手'}
                                </div>
                            </motion.div>
                        )}

                        {/* Quiz监控 */}
                        {skillNode === 3 && !quizCompleted && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl">
                                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                                    <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-700">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                            <User size={28} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-bold text-lg">Alex Johnson</div>
                                            <div className="text-sm text-slate-400 font-mono">正在答题: Q{currentQuizIndex + 1}/5</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,180,238,0.2)' }}>
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00B4EE' }} />
                                            <span className="text-xs font-bold" style={{ color: '#00B4EE' }}>LIVE</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase">题目进度</span>
                                                <span className="text-base font-mono font-bold" style={{ color: '#00B4EE' }}>
                                                    {currentQuizIndex + 1} / 5
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ background: 'linear-gradient(to right, #00B4EE, #FDE700)' }}
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: `${((currentQuizIndex + 1) / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-slate-700/50 rounded-lg p-4">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">当前题目</div>
                                            <p className="text-sm text-white font-serif">{currentQuiz.question}</p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400 uppercase">学生选择</span>
                                            <span className="text-sm font-mono" style={{ color: skillQuizSelectedAnswer ? '#00B4EE' : '#64748b' }}>
                                                {skillQuizSelectedAnswer || '思考中...'}
                                            </span>
                                        </div>

                                        {skillQuizHighlightedWords.length > 0 && (
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase">已标记关键词</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {skillQuizHighlightedWords.map((word, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-yellow-500/30 text-yellow-300 rounded text-xs">{word}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Quiz完成 */}
                        {skillNode === 3 && quizCompleted && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}
                                >
                                    <Target size={48} className="text-white" />
                                </motion.div>
                                <div className="text-white/80 text-xl font-mono mb-2">GPS大师!</div>
                                <div className="text-white/40 text-base">学生已完成所有5道题目</div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Pane: 30% */}
            <div className="flex-[3] flex flex-col gap-4 h-full overflow-hidden">

                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="coach-video"
                    className="relative w-full shrink-0 rounded-xl shadow-md"
                    videoStream={remoteStream}
                />

                {/* 控制按钮 */}
                <div className="shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center items-center">
                    <div className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                        STEP {scriptIndex} - {getStepLabel()}
                    </div>

                    {buttonState.color === "green" ? (
                        <button
                            onClick={handleNextStage}
                            className="h-14 w-full text-base rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all font-bold tracking-wide flex items-center justify-center gap-3 bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            <ArrowRight size={22} />
                            <span>下一阶段</span>
                        </button>
                    ) : buttonState.disabled ? (
                        <button
                            disabled
                            className="h-14 w-full text-base rounded-xl shadow-md font-bold tracking-wide flex items-center justify-center gap-3 bg-slate-300 text-slate-500 cursor-not-allowed"
                        >
                            <Loader2 size={22} className="animate-spin" />
                            <span>{buttonState.message}</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleMainAction}
                            className="h-14 w-full text-base rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all font-bold tracking-wide flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Play size={22} />
                            <span>{buttonState.message}</span>
                        </button>
                    )}

                    {/* 状态提示 */}
                    {buttonState.subtext && (
                        <div className={`mt-2 text-xs ${buttonState.subtext.startsWith('✓') ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {buttonState.subtext}
                        </div>
                    )}
                </div>

                {/* Jarvis */}
                <div className={`flex-1 flex flex-col rounded-2xl border shadow-sm overflow-hidden min-h-0 ${skillQuizWrongAttempt ? 'border-red-400 bg-red-50' : 'bg-white border-slate-200'
                    }`}>
                    <div className={`px-4 py-3 flex items-center gap-2 border-b shrink-0 ${skillQuizWrongAttempt ? 'bg-gradient-to-r from-red-500 to-orange-500 border-red-400' : 'bg-gradient-to-r from-cyan-500 to-blue-600 border-white/10'
                        }`}>
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                            {skillQuizWrongAttempt ? <AlertTriangle size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
                        </div>
                        <div>
                            <div className="text-white font-bold text-xs">
                                {skillQuizWrongAttempt ? '⚠️ 学生答错了！' : 'Jarvis 助教'}
                            </div>
                            <div className="text-white/70 text-[10px] font-mono">
                                {skillQuizWrongAttempt ? '需要引导' : currentScript.jarvisTitle}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto">
                        {skillQuizWrongAttempt ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm text-red-800 font-medium mb-2">
                                                🚨 Alex 在 Q{currentQuizIndex + 1} 选错了选项 {skillQuizWrongAttempt.optionId}
                                            </p>
                                            <p className="text-xs text-red-700">
                                                建议：引导学生重新审题，关注题干中的关键词，再回到原文中定位相关信息。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-800">
                                        💡 话术建议: "别着急，我们再看一下题目。关键词是什么？在原文里找到了吗？"
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={scriptIndex}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        {currentScript.jarvisContent}
                                    </p>
                                </div>

                                {skillNode === 3 && !quizCompleted && (
                                    <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: 'rgba(0, 180, 238, 0.2)', backgroundColor: 'rgba(0, 180, 238, 0.05)' }}>
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">当前题目 Q{currentQuizIndex + 1}</div>
                                        <p className="text-xs text-slate-600 font-serif">{currentQuiz.question}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};
