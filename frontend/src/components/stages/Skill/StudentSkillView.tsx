import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Target, Check, X, Clock, Hand, Search,
    Award, Sparkles, BookOpen, ArrowRight, Trophy, Lock, Pointer
} from 'lucide-react';
import { TEXT_RAIN_WORDS } from './config';
import { TextRainParticle, GPSEquipCard, StudentToolbar } from './components';

// 5道题目数据
const DEMO_QUIZ_DATA = [
    {
        id: 1,
        question: "What time did Tom go to the park?",
        text: "Tom went to the park at 3 p.m. and played soccer with his friends until 5 p.m.",
        keywords: ["Time", "Tom", "Park"],
        options: [
            { id: "A", text: "3 p.m.", isCorrect: true },
            { id: "B", text: "5 p.m.", isCorrect: false },
            { id: "C", text: "4 p.m.", isCorrect: false },
            { id: "D", text: "2 p.m.", isCorrect: false }
        ]
    },
    {
        id: 2,
        question: "What color was Sarah's dress?",
        text: "Sarah bought a blue dress from the mall yesterday. It cost her $50.",
        keywords: ["Color", "Sarah", "Dress"],
        options: [
            { id: "A", text: "Red", isCorrect: false },
            { id: "B", text: "Blue", isCorrect: true },
            { id: "C", text: "Green", isCorrect: false },
            { id: "D", text: "Yellow", isCorrect: false }
        ]
    },
    {
        id: 3,
        question: "Where is the science museum?",
        text: "The science museum is located on Main Street, next to the library. It opens at 9 a.m.",
        keywords: ["Where", "Science Museum"],
        options: [
            { id: "A", text: "Park Avenue", isCorrect: false },
            { id: "B", text: "Oak Road", isCorrect: false },
            { id: "C", text: "Main Street", isCorrect: true },
            { id: "D", text: "River Lane", isCorrect: false }
        ]
    },
    {
        id: 4,
        question: "How long is the Great Wall of China?",
        text: "The Great Wall of China is about 21,196 kilometers long. It was built over 2,000 years ago.",
        keywords: ["How long", "Great Wall"],
        options: [
            { id: "A", text: "10,000 km", isCorrect: false },
            { id: "B", text: "15,000 km", isCorrect: false },
            { id: "C", text: "21,196 km", isCorrect: true },
            { id: "D", text: "30,000 km", isCorrect: false }
        ]
    },
    {
        id: 5,
        question: "Why were the students late?",
        text: "The students were late because the school bus broke down on the highway.",
        keywords: ["Why", "Students", "Late"],
        options: [
            { id: "A", text: "Traffic jam", isCorrect: false },
            { id: "B", text: "Bad weather", isCorrect: false },
            { id: "C", text: "Bus broke down", isCorrect: true },
            { id: "D", text: "Overslept", isCorrect: false }
        ]
    }
];

// 交互式演示组件
const InteractiveDemo: React.FC<{ demoTeacherStep: number; onStepComplete: (step: number) => void }> = ({ demoTeacherStep, onStepComplete }) => {
    const [highlighted1969, setHighlighted1969] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [lockComplete, setLockComplete] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // 当老师推进步骤2时开始扫描
    useEffect(() => {
        if (demoTeacherStep >= 2 && !scanComplete) {
            setIsScanning(true);
            const timer = setTimeout(() => {
                setIsScanning(false);
                setScanComplete(true);
                onStepComplete(2);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [demoTeacherStep, scanComplete, onStepComplete]);

    // 当老师推进步骤3时触发锁定
    useEffect(() => {
        if (demoTeacherStep >= 3 && scanComplete && !lockComplete) {
            const timer = setTimeout(() => {
                setLockComplete(true);
                onStepComplete(3);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [demoTeacherStep, scanComplete, lockComplete, onStepComplete]);

    const handleClick1969 = () => {
        if (!highlighted1969 && demoTeacherStep >= 1) {
            setHighlighted1969(true);
            onStepComplete(1);
        }
    };

    return (
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {[
                    { num: 1, text: '圈', active: demoTeacherStep >= 1, done: highlighted1969 },
                    { num: 2, text: '搜', active: demoTeacherStep >= 2, done: scanComplete },
                    { num: 3, text: '锁', active: demoTeacherStep >= 3, done: lockComplete }
                ].map((step) => (
                    <div key={step.num} className="flex items-center">
                        <motion.div
                            animate={step.active && !step.done ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step.done ? 'bg-emerald-500 text-white' :
                                step.active ? 'bg-blue-500 text-white' :
                                    'bg-gray-200 text-gray-400'
                                }`}>
                            {step.done ? <Check size={20} /> : step.num}
                        </motion.div>
                        <span className={`ml-2 text-sm ${step.active ? 'text-gray-700' : 'text-gray-400'}`}>
                            {step.text}
                        </span>
                        {step.num < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
                    </div>
                ))}
            </div>

            {/* 示例句子 */}
            <div className="text-xs font-mono text-gray-400 mb-2 uppercase">EXAMPLE SENTENCE</div>
            <div className="relative text-xl text-gray-800 leading-relaxed mb-6 p-4 pt-12 bg-gray-50 rounded-xl overflow-visible">
                {/* 扫描光束 */}
                {isScanning && (
                    <motion.div
                        initial={{ left: '-20%' }}
                        animate={{ left: '120%' }}
                        transition={{ duration: 1.5, ease: "linear" }}
                        className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent skew-x-12 z-10"
                    />
                )}

                <span>In </span>
                {/* 1969 - 可点击关键词 */}
                <motion.span
                    onClick={handleClick1969}
                    animate={demoTeacherStep >= 1 && !highlighted1969 ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className={`relative cursor-pointer transition-all px-1 py-0.5 rounded ${highlighted1969 ? 'bg-yellow-300 font-semibold' :
                        demoTeacherStep >= 1 ? 'hover:bg-yellow-100 ring-2 ring-blue-400 ring-offset-2' : ''
                        }`}
                >
                    {/* 跳动的手指图标 */}
                    {demoTeacherStep >= 1 && !highlighted1969 && (
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                            className="absolute -top-8 left-1/2 -translate-x-1/2 z-50"
                        >
                            <Pointer size={24} className="text-blue-500 rotate-180" />
                        </motion.div>
                    )}
                    1969
                </motion.span>
                <span>, Neil Armstrong became </span>
                {/* 锁定区域 */}
                <span className={`relative inline-block ${lockComplete ? '' : ''}`}>
                    {lockComplete && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -inset-2 rounded-lg border-2 border-emerald-500 bg-emerald-50/50 z-0"
                        />
                    )}
                    <span className={`relative z-10 ${lockComplete ? 'text-emerald-700 font-semibold' : ''} ${scanComplete && !lockComplete ? 'bg-blue-100' : ''}`}>
                        the first person to walk on the Moon
                    </span>
                    {lockComplete && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-3 -top-3 z-20"
                        >
                            <Lock size={20} className="text-emerald-600 fill-emerald-200" />
                        </motion.div>
                    )}
                </span>
                <span>.</span>
            </div>

            {/* 步骤说明 */}
            <div className="bg-gray-50 rounded-xl p-4">
                {!highlighted1969 && demoTeacherStep >= 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-blue-600">
                        <Target size={20} />
                        <span className="font-bold">第一步：圈关键词</span>
                        <span className="text-sm text-gray-500">👆 点击句子中的 "1969"</span>
                    </motion.div>
                )}
                {highlighted1969 && !scanComplete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-emerald-600">
                        <Check size={20} />
                        <span className="font-bold">步骤1完成！</span>
                        <span className="text-sm text-gray-500">等待老师推进下一步...</span>
                    </motion.div>
                )}
                {isScanning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-cyan-600">
                        <Search size={20} />
                        <span className="font-bold">第二步：搜原句</span>
                        <span className="text-sm text-gray-500">正在扫描定位...</span>
                    </motion.div>
                )}
                {scanComplete && !lockComplete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-emerald-600">
                        <Check size={20} />
                        <span className="font-bold">步骤2完成！</span>
                        <span className="text-sm text-gray-500">等待老师推进下一步...</span>
                    </motion.div>
                )}
                {lockComplete && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2">
                        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
                            <Lock size={20} />
                            <span className="font-bold text-lg">Matched!</span>
                            <Sparkles size={20} className="text-yellow-500" />
                        </div>
                        <div className="text-sm text-gray-500">演示完成！等待老师开始练手</div>
                    </motion.div>
                )}
                {!demoTeacherStep && (
                    <div className="text-center text-gray-400">等待老师开始演示...</div>
                )}
            </div>
        </div>
    );
};

// 可点击的单词组件
const ClickableWord: React.FC<{
    word: string;
    isHighlighted: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ word, isHighlighted, onClick, disabled }) => {
    return (
        <span
            onClick={disabled ? undefined : onClick}
            className={`cursor-pointer px-0.5 rounded transition-all ${isHighlighted ? 'bg-yellow-300 font-semibold' :
                disabled ? '' : 'hover:bg-yellow-100'
                }`}
        >
            {word}
        </span>
    );
};

/**
 * 学生端技能阶段主组件
 */
export const StudentSkillView: React.FC = () => {
    const {
        skillNode,
        studentHasEquipped,
        setStudentEquipped,
        studentConfirmedFormula,
        setStudentConfirmedFormula,
        studentDemoStep,
        setStudentDemoStep,
        demoTeacherStep,
        currentQuizIndex,
        quizCompleted,
        skillQuizSelectedAnswer,
        skillQuizAnswerCorrect,
        skillQuizHighlightedWords,
        toggleSkillQuizWord,
        setSkillQuizAnswer,
        setSkillQuizWrongAttempt,
        nextQuizQuestion,
        startSkillQuiz,
        remoteStream
    } = useGameStore();

    const [isEquipping, setIsEquipping] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [wrongOptionId, setWrongOptionId] = useState<string | null>(null);

    // 当前题目
    const currentQuiz = DEMO_QUIZ_DATA[currentQuizIndex] || DEMO_QUIZ_DATA[0];

    // 生成文字雨粒子
    const rainParticles = useMemo(() =>
        TEXT_RAIN_WORDS.map((word) => ({
            word,
            delay: Math.random() * 3,
            duration: 4 + Math.random() * 4,
            left: Math.random() * 100
        })),
        []);

    // 装备GPS卡
    const handleEquip = () => {
        setIsEquipping(true);
        setTimeout(() => {
            setStudentEquipped(true);
            setIsEquipping(false);
        }, 800);
    };

    // 确认口诀
    const handleConfirmFormula = () => {
        setStudentConfirmedFormula(true);
    };

    // 演示步骤完成
    const handleDemoStepComplete = (step: number) => {
        setStudentDemoStep(step);
    };

    // 进入Quiz阶段时初始化
    useEffect(() => {
        if (skillNode === 3) {
            startSkillQuiz();
        }
    }, [skillNode, startSkillQuiz]);

    // 处理选项点击
    const handleOptionSelect = (optionId: string, isCorrect: boolean) => {
        if (skillQuizSelectedAnswer) return;

        if (isCorrect) {
            setSkillQuizAnswer(optionId, true);
            setShowFeedback(true);
            setWrongOptionId(null);
        } else {
            // 答错：抖动动画，不跳转
            setWrongOptionId(optionId);
            setSkillQuizWrongAttempt({ questionId: currentQuiz.id, optionId });
            setTimeout(() => setWrongOptionId(null), 400);
        }
    };

    // 点击单词高亮
    const handleWordClick = (word: string) => {
        if (skillQuizSelectedAnswer) return;
        toggleSkillQuizWord(word);
    };

    // 下一题
    const handleNextQuestion = () => {
        setShowFeedback(false);
        setSkillQuizWrongAttempt(null);
        nextQuizQuestion();
    };

    // 计算场景状态
    const getSceneState = () => {
        if (skillNode === 0) return 'waiting';
        if (skillNode === 1) return 'overload';
        if (skillNode === 2) {
            if (!studentHasEquipped) return 'equip';
            if (!studentConfirmedFormula) return 'formula';
            if (studentDemoStep < 3) return 'demo';
            return 'ready';
        }
        if (skillNode === 3) {
            if (quizCompleted) return 'complete';
            return 'quiz';
        }
        return 'complete';
    };

    const sceneState = getSceneState();

    // 拆分文本为可点击单词
    const renderClickableText = (text: string) => {
        const words = text.split(/(\s+)/);
        return words.map((word, idx) => {
            if (/^\s+$/.test(word)) return word;
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            const isHighlighted = skillQuizHighlightedWords.includes(cleanWord);
            return (
                <ClickableWord
                    key={idx}
                    word={word}
                    isHighlighted={isHighlighted}
                    onClick={() => handleWordClick(cleanWord)}
                    disabled={!!skillQuizSelectedAnswer}
                />
            );
        });
    };

    return (
        <div
            className="w-full h-full relative overflow-hidden transition-colors duration-1000"
            style={{
                background: sceneState === 'overload' || sceneState === 'equip'
                    ? '#0f172a'
                    : 'linear-gradient(135deg, rgba(0, 180, 238, 0.08) 0%, rgba(0, 180, 238, 0.12) 40%, rgba(253, 231, 0, 0.1) 70%, rgba(253, 231, 0, 0.15) 100%)'
            }}
        >

            {/* 视频窗口 - 使用内联style强制右上角定位 */}
            <VideoWindow
                layoutId="student-video"
                className="absolute w-64 z-[60] rounded-xl shadow-2xl"
                style={{ top: '1.5rem', right: '1.5rem', left: 'auto' }}
                placeholderText="老师视频连线中..."
                videoStream={remoteStream}
            />

            {/* 工具栏 */}
            <StudentToolbar hasGPS={studentHasEquipped} />

            {/* 等待开始 */}
            <AnimatePresence>
                {sceneState === 'waiting' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <Clock size={64} className="mx-auto mb-4 text-slate-300 animate-pulse" />
                            <h1 className="text-3xl font-bold text-slate-700 mb-2">技能习得阶段</h1>
                            <p className="text-slate-500">等待教师推送...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 文字雨 */}
            <AnimatePresence>
                {sceneState === 'overload' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0">
                            {rainParticles.map((particle, idx) => (
                                <TextRainParticle key={idx} {...particle} />
                            ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                                className="bg-black/60 backdrop-blur-xl rounded-2xl px-12 py-8 border border-red-500/30">
                                <div className="text-red-500 text-5xl font-bold mb-2">WARNING</div>
                                <div className="text-white text-2xl font-mono">INFORMATION OVERLOAD</div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GPS卡装备 */}
            <AnimatePresence>
                {sceneState === 'equip' && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
                        className="absolute inset-0 flex items-center justify-center z-10">
                        <GPSEquipCard
                            onEquip={handleEquip}
                            isEquipping={isEquipping}
                            isEquipped={studentHasEquipped}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 口诀页面 */}
            <AnimatePresence>
                {sceneState === 'formula' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex items-center justify-center z-10 bg-gradient-to-br from-slate-900 to-slate-800">
                        <div className="max-w-2xl w-full mx-6 text-center">
                            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #00B4EE, #0088CC)' }}>
                                    <BookOpen size={40} className="text-white" />
                                </div>
                                <h1 className="text-4xl font-bold text-white mb-2">GPS 定位法</h1>
                                <p className="text-slate-400 mb-8">核心口诀 · Core Formula</p>
                            </motion.div>

                            <div className="flex gap-4 justify-center mb-8">
                                {[
                                    { num: 1, text: '圈路标', en: 'CIRCLE KEYWORDS', color: '#00B4EE' },
                                    { num: 2, text: '搜原句', en: 'SCAN FOR SOURCE', color: '#10B981' },
                                    { num: 3, text: '锁答案', en: 'LOCK THE ANSWER', color: '#FDE700' }
                                ].map((step, idx) => (
                                    <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 + idx * 0.2 }}
                                        className="flex-1 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                            style={{ backgroundColor: step.color }}>
                                            {step.num}
                                        </div>
                                        <div className="text-white text-xl font-bold mb-1">{step.text}</div>
                                        <div className="text-slate-400 text-xs font-mono">{step.en}</div>
                                    </motion.div>
                                ))}
                            </div>

                            <p className="text-slate-300 text-lg mb-8">三步定位，精准找答案！</p>

                            <motion.button onClick={handleConfirmFormula}
                                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}
                                className="px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 mx-auto"
                                style={{ background: '#FDE700', color: '#1a1a2e' }}>
                                <Check size={20} />
                                <span>我已掌握口诀</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 交互式演示 */}
            <AnimatePresence>
                {(sceneState === 'demo' || sceneState === 'ready') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center p-8">
                        <InteractiveDemo
                            demoTeacherStep={demoTeacherStep}
                            onStepComplete={handleDemoStepComplete}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quiz答题 */}
            <AnimatePresence>
                {sceneState === 'quiz' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="max-w-2xl w-full">
                            {/* 进度 */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm font-mono text-gray-500">QUESTION {currentQuizIndex + 1} / 5</div>
                                <div className="flex gap-2">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`w-8 h-1.5 rounded-full ${i < currentQuizIndex ? 'bg-emerald-500' :
                                            i === currentQuizIndex ? 'bg-blue-500' :
                                                'bg-gray-200'
                                            }`} />
                                    ))}
                                </div>
                            </div>

                            {/* 关键词提示 Banner */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 flex items-center gap-2"
                            >
                                <Hand size={18} className="text-yellow-600" />
                                <span className="text-sm text-yellow-700">👇 点击题干里的关键词 (Click Keywords to Focus)</span>
                            </motion.div>

                            {/* 题目卡片 */}
                            <motion.div key={currentQuizIndex} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                className="bg-white rounded-2xl shadow-xl p-8">
                                {/* 题干 */}
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                    {renderClickableText(currentQuiz.question)}
                                </h2>

                                {/* 原文 */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <div className="text-xs font-mono text-gray-400 mb-2">PASSAGE</div>
                                    <p className="text-gray-700 leading-relaxed">
                                        {renderClickableText(currentQuiz.text)}
                                    </p>
                                </div>

                                {/* 已高亮的关键词显示 */}
                                {skillQuizHighlightedWords.length > 0 && (
                                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-gray-400">已标记:</span>
                                        {skillQuizHighlightedWords.map((word, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-yellow-200 rounded text-sm text-yellow-800">{word}</span>
                                        ))}
                                    </div>
                                )}

                                {/* 选项 */}
                                <div className="grid grid-cols-2 gap-3">
                                    {currentQuiz.options.map((option) => {
                                        const isSelected = skillQuizSelectedAnswer === option.id;
                                        const isWrong = wrongOptionId === option.id;
                                        const showCorrect = showFeedback && option.isCorrect;
                                        const showWrongSelected = showFeedback && isSelected && !option.isCorrect;

                                        return (
                                            <motion.button
                                                key={option.id}
                                                onClick={() => handleOptionSelect(option.id, option.isCorrect)}
                                                disabled={!!skillQuizSelectedAnswer}
                                                animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                                                transition={{ duration: 0.4 }}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${showCorrect ? 'border-emerald-500 bg-emerald-50' :
                                                    showWrongSelected || isWrong ? 'border-red-500 bg-red-50' :
                                                        isSelected ? 'border-blue-500 bg-blue-50' :
                                                            'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${showCorrect ? 'bg-emerald-500 text-white' :
                                                        showWrongSelected || isWrong ? 'bg-red-500 text-white' :
                                                            isSelected ? 'bg-blue-500 text-white' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {showCorrect ? <Check size={16} /> :
                                                            showWrongSelected || isWrong ? <X size={16} /> :
                                                                option.id}
                                                    </div>
                                                    <span className="text-gray-700 font-serif">{option.text}</span>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* 错误提示 */}
                                {wrongOptionId && !showFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 text-center text-red-600 font-medium"
                                    >
                                        再想想... (Try Again) 💪
                                    </motion.div>
                                )}

                                {/* 正确反馈和下一题 */}
                                {showFeedback && skillQuizAnswerCorrect && (
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        className="mt-6 text-center">
                                        <div className="mb-4">
                                            <Sparkles size={32} className="mx-auto mb-2 text-yellow-500" />
                                            <p className="text-lg font-bold text-emerald-600">正确! 🎉</p>
                                        </div>
                                        <button onClick={handleNextQuestion}
                                            className="px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 mx-auto"
                                            style={{ backgroundColor: '#00B4EE' }}>
                                            <span>{currentQuizIndex < 4 ? '下一题' : '完成'}</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 完成页面 */}
            <AnimatePresence>
                {sceneState === 'complete' && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500">
                        <div className="text-center text-white">
                            <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
                            </motion.div>
                            <h1 className="text-5xl font-bold mb-4">GPS 大师!</h1>
                            <p className="text-xl opacity-80 mb-2">恭喜你掌握了 GPS 定位法</p>
                            <p className="text-lg opacity-60">完成了全部 5 道练习题</p>
                            <div className="mt-8 flex justify-center gap-4">
                                <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-4">
                                    <Award size={24} className="mx-auto mb-2 text-yellow-300" />
                                    <div className="text-sm opacity-70">技能徽章</div>
                                    <div className="font-bold">已获得</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
