/**
 * 技能阶段子组件
 * 包含文字雨、GPS卡片、交互演示、工具栏等组件
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, Hand, Search, Sparkles, PartyPopper } from 'lucide-react';

// 文字雨粒子组件
export const TextRainParticle: React.FC<{ 
    word: string; 
    delay: number; 
    duration: number; 
    left: number 
}> = ({ word, delay, duration, left }) => {
    return (
        <motion.div
            initial={{ y: -100, opacity: 0, rotate: Math.random() * 20 - 10 }}
            animate={{ 
                y: window.innerHeight + 100, 
                opacity: [0, 1, 1, 0],
                rotate: Math.random() * 40 - 20
            }}
            transition={{ 
                duration, 
                delay, 
                ease: 'linear',
                repeat: Infinity,
                repeatDelay: Math.random() * 2
            }}
            className="absolute text-white/70 font-mono text-sm md:text-base whitespace-nowrap pointer-events-none"
            style={{ 
                left: `${left}%`,
                textShadow: '0 0 10px rgba(255,255,255,0.3)'
            }}
        >
            {word}
        </motion.div>
    );
};

// GPS 卡片组件
export const GPSEquipCard: React.FC<{ onEquip: () => void }> = ({ onEquip }) => {
    return (
        <motion.div
            initial={{ scale: 0, rotateY: 180, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
            className="relative"
        >
            {/* 发光效果 */}
            <div className="absolute -inset-4 rounded-3xl opacity-50 blur-xl" 
                 style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #FDE700 100%)' }} />
            
            {/* 主卡片 */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 border-2 shadow-2xl"
                 style={{ borderColor: '#00B4EE' }}>
                {/* 卡片头部装饰 */}
                <div className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl"
                     style={{ background: 'linear-gradient(90deg, #00B4EE 0%, #FDE700 100%)' }} />
                
                {/* 卫星图标 */}
                <div className="w-32 h-32 mx-auto mb-6 rounded-2xl flex items-center justify-center relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg, rgba(0,180,238,0.2) 0%, rgba(253,231,0,0.2) 100%)' }}>
                    {/* 轨道动画 */}
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute w-24 h-24 border-2 border-dashed rounded-full opacity-30"
                        style={{ borderColor: '#00B4EE' }}
                    />
                    <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        className="absolute w-28 h-28 border border-dashed rounded-full opacity-20"
                        style={{ borderColor: '#FDE700' }}
                    />
                    
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Target size={56} style={{ color: '#00B4EE' }} />
                    </motion.div>
                </div>

                {/* 卡片标题 */}
                <h3 className="text-2xl font-bold text-white text-center mb-2">
                    GPS 定位卡
                </h3>
                <p className="text-sm text-white/60 text-center mb-6 font-mono">
                    READING NAVIGATION TOOL
                </p>

                {/* 功能描述 */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} style={{ color: '#FDE700' }} />
                        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">能力加成</span>
                    </div>
                    <ul className="space-y-1 text-sm text-white/60">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00B4EE' }} />
                            快速定位关键信息
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FDE700' }} />
                            精准锁定答案区域
                        </li>
                    </ul>
                </div>

                {/* 装备按钮 */}
                <motion.button
                    onClick={onEquip}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 relative overflow-hidden"
                    style={{ 
                        background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)',
                        boxShadow: '0 10px 40px rgba(0,180,238,0.4)'
                    }}
                >
                    {/* 脉冲动画 */}
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}
                    />
                    <span className="relative z-10 text-white">✨ 点击装备</span>
                </motion.button>
            </div>
        </motion.div>
    );
};

// 圈-搜-锁 交互演示组件
export const InteractiveDemo: React.FC<{ 
    step: number; 
    onStepComplete: () => void 
}> = ({ step, onStepComplete }) => {
    const [circledWord, setCircledWord] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const exampleSentence = "In 1969, Neil Armstrong became the first person to walk on the Moon.";
    const targetWord = "1969";
    const answerPhrase = "the first person to walk on the Moon";

    const handleCircle = () => {
        if (step === 1) {
            setCircledWord(targetWord);
            setTimeout(onStepComplete, 800);
        }
    };

    const handleScan = () => {
        if (step === 2) {
            setIsScanning(true);
            setTimeout(() => {
                setIsScanning(false);
                onStepComplete();
            }, 1500);
        }
    };

    const handleLock = () => {
        if (step === 3) {
            setIsLocked(true);
            setTimeout(onStepComplete, 800);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-4 mb-12">
                {['圈', '搜', '锁'].map((label, idx) => (
                    <div key={label} className="flex items-center gap-2">
                        <motion.div
                            animate={step === idx + 1 ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                            className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                                transition-all duration-300
                                ${step > idx + 1 
                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' 
                                    : step === idx + 1 
                                    ? 'text-white shadow-lg shadow-cyan-400/50' 
                                    : 'bg-slate-200 text-slate-400'
                                }
                            `}
                            style={step === idx + 1 ? { background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' } : {}}
                        >
                            {step > idx + 1 ? <Check size={20} /> : idx + 1}
                        </motion.div>
                        <span className={`font-bold ${step >= idx + 1 ? 'text-slate-800' : 'text-slate-400'}`}>
                            {label}
                        </span>
                        {idx < 2 && <div className="w-12 h-0.5 bg-slate-200 mx-2" />}
                    </div>
                ))}
            </div>

            {/* 例句展示区 */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 relative overflow-hidden">
                {/* 扫描光效 */}
                {isScanning && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(0,180,238,0.3) 50%, transparent 100%)',
                            width: '50%'
                        }}
                    />
                )}

                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">
                    Example Sentence
                </div>

                <p className="text-2xl leading-relaxed text-slate-800">
                    In{' '}
                    <span 
                        onClick={handleCircle}
                        className={`
                            relative cursor-pointer transition-all duration-300
                            ${circledWord === targetWord ? 'px-2 py-1 rounded-lg' : 'hover:bg-yellow-100'}
                        `}
                        style={circledWord === targetWord ? { 
                            backgroundColor: 'rgba(253,231,0,0.3)',
                            border: '3px solid #FDE700',
                            borderRadius: '50%'
                        } : {}}
                    >
                        {step === 1 && !circledWord && (
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap px-2 py-1 rounded-full"
                                style={{ backgroundColor: '#FDE700', color: '#333' }}
                            >
                                👆 点击这里
                            </motion.span>
                        )}
                        1969
                    </span>
                    , Neil Armstrong became{' '}
                    <span 
                        className={`
                            transition-all duration-500
                            ${isLocked ? 'px-2 py-1 rounded-lg font-bold' : ''}
                        `}
                        style={isLocked ? { 
                            backgroundColor: 'rgba(0,180,238,0.2)',
                            borderBottom: '3px solid #00B4EE'
                        } : {}}
                    >
                        {answerPhrase}
                    </span>
                    .
                </p>

                {/* 步骤提示 */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <AnimatePresence mode="wait">
                        {step === 1 && !circledWord && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3 text-slate-600"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                     style={{ backgroundColor: 'rgba(253,231,0,0.2)' }}>
                                    <Hand size={20} style={{ color: '#D4A000' }} />
                                </div>
                                <div>
                                    <div className="font-bold">第一步：圈 (Circle)</div>
                                    <div className="text-sm text-slate-400">点击句子中的时间信息</div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3 text-slate-600"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                     style={{ backgroundColor: 'rgba(0,180,238,0.2)' }}>
                                    <Search size={20} style={{ color: '#00B4EE' }} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold">第二步：搜 (Scan)</div>
                                    <div className="text-sm text-slate-400">扫描原文，寻找相关信息</div>
                                </div>
                                <motion.button
                                    onClick={handleScan}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={isScanning}
                                    className="px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}
                                >
                                    {isScanning ? '扫描中...' : '开始扫描'}
                                </motion.button>
                            </motion.div>
                        )}

                        {step === 3 && !isLocked && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3 text-slate-600"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                     style={{ backgroundColor: 'rgba(16,185,129,0.2)' }}>
                                    <Target size={20} className="text-emerald-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold">第三步：锁 (Lock)</div>
                                    <div className="text-sm text-slate-400">锁定答案关键句</div>
                                </div>
                                <motion.button
                                    onClick={handleLock}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 rounded-xl font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                                >
                                    锁定答案
                                </motion.button>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-4"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5 }}
                                    className="inline-block mb-4"
                                >
                                    <PartyPopper size={48} style={{ color: '#00B4EE' }} />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">完美！你已掌握 GPS 定位法</h3>
                                <p className="text-slate-500">现在可以独立完成阅读任务了</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// 学生工具栏组件
export const StudentToolbar: React.FC<{ hasGPS: boolean }> = ({ hasGPS }) => {
    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-6 z-40"
        >
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-3 flex items-center gap-2">
                <div className="text-xs font-mono text-slate-400 px-2">TOOLS</div>
                <div className="w-px h-8 bg-slate-200" />
                
                <AnimatePresence>
                    {hasGPS && (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                            style={{ background: 'linear-gradient(135deg, rgba(0,180,238,0.2) 0%, rgba(253,231,0,0.2) 100%)' }}
                        >
                            <Target size={24} style={{ color: '#00B4EE' }} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {!hasGPS && (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                        <span className="text-slate-300 text-lg">?</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

