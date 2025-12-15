import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, VocabItem } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Volume2, Mic, RotateCw, CheckCircle2, ArrowRight,
    Clock, Trophy, ListChecks, Check, Sparkles, Lightbulb, RefreshCcw
} from 'lucide-react';

/**
 * 学生端生词学习组件
 * Vocab Learning - 单词卡片式学习
 * 包含闪卡、录音、回炉和出口测试多个环节
 */
export const StudentVocabView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const {
        vocabList,
        currentVocabIndex,
        phase4Step,
        exitPassStep,
        remedialQueue,
        remedialIndex,
        vocabCardFlipped,
        setVocabCardFlipped,
        nextVocabCard,
        vocabStatus,
        setReviewingVocabWord,
        reviewingVocabWord,
        setStage,
        isSyllableMode,
        toggleSyllableMode,
        isPlayingAudio,
        playStandardAudio,
        completeRemedialWord,
        vocabSpeakEnabled,
        remoteStream
    } = useGameStore();

    let currentCard: VocabItem | undefined;
    let isRemedialMode = false;

    if (phase4Step === 'flashcards') {
        currentCard = vocabList[currentVocabIndex];
    } else if (phase4Step === 'exitpass' && exitPassStep === 'remedial') {
        const wordId = remedialQueue[remedialIndex];
        currentCard = vocabList.find(v => v.word === wordId);
        isRemedialMode = true;
    }

    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'playing_user' | 'playing_standard' | 'finished'>('idle');
    const [score, setScore] = useState<number | null>(null);
    const [cardKey, setCardKey] = useState(0);

    useEffect(() => {
        setRecordingState('idle');
        setScore(null);
        setCardKey(prev => prev + 1);
    }, [currentVocabIndex, remedialIndex, exitPassStep]);

    useEffect(() => {
        if (isPlayingAudio === 'standard') {
            setRecordingState('playing_standard');
            const timer = setTimeout(() => {
                setRecordingState(prev => prev === 'playing_standard' ? 'idle' : prev);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isPlayingAudio]);

    const handleRecordStart = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (recordingState === 'finished') return;
        setRecordingState('recording');
    };

    const handleRecordEnd = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (recordingState !== 'recording') return;

        setRecordingState('playing_user');
        setTimeout(() => {
            setRecordingState('playing_standard');
            setTimeout(() => {
                const mockScore = 85 + Math.floor(Math.random() * 11);
                setScore(mockScore);
                setRecordingState('finished');
                setVocabCardFlipped(true);
            }, 1500);
        }, 1500);
    };

    const syllableColors = [
        { text: 'text-rose-600', bg: 'bg-rose-50' },
        { text: 'text-blue-600', bg: 'bg-blue-50' },
        { text: 'text-emerald-600', bg: 'bg-emerald-50' },
        { text: 'text-purple-600', bg: 'bg-purple-50' },
        { text: 'text-amber-600', bg: 'bg-amber-50' }
    ];

    // 完成状态
    if (phase4Step === 'exitpass' && exitPassStep === 'done') {
        return (
            <div className="flex h-full w-full bg-slate-50 flex-col items-center justify-center text-center p-8 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-10 left-10 text-4xl animate-bounce delay-100">🎉</div>
                    <div className="absolute top-20 right-20 text-4xl animate-bounce delay-300">✨</div>
                    <div className="absolute bottom-20 left-1/4 text-4xl animate-bounce delay-500">🏆</div>
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg w-full relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-tr from-brand-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 text-white">
                        <Trophy size={48} fill="currentColor" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">学习完成！</h1>
                    <p className="text-slate-500 text-lg mb-8">你已经掌握了本节课的所有生词。</p>

                    <button
                        onClick={() => setStage('surgery')}
                        className="w-full py-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                        <span>前往下一阶段</span>
                        <ArrowRight size={20} />
                    </button>
                </motion.div>
            </div>
        )
    }

    // 闪卡模式或回炉模式
    if (currentCard && (phase4Step === 'flashcards' || (phase4Step === 'exitpass' && exitPassStep === 'remedial'))) {
        return (
            <div
                className="flex h-full w-full relative overflow-hidden flex-col items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 180, 238, 0.08) 0%, rgba(0, 180, 238, 0.12) 40%, rgba(253, 231, 0, 0.1) 70%, rgba(253, 231, 0, 0.15) 100%)'
                }}
            >

                {/* 复习弹窗 */}
                <AnimatePresence>
                    {reviewingVocabWord && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8"
                            onClick={() => setReviewingVocabWord(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8"
                            >
                                <h3 className="text-3xl font-serif font-bold text-slate-900 mb-2">{reviewingVocabWord}</h3>
                                <p className="text-slate-500 mb-6">{vocabList.find(v => v.word === reviewingVocabWord)?.definition}</p>
                                <button
                                    onClick={() => setReviewingVocabWord(null)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                >
                                    关闭复习
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="student-video"
                    className="absolute top-6 right-6 w-64 z-[60] rounded-xl shadow-2xl"
                    placeholderText="老师连线中..."
                    videoStream={remoteStream}
                />

                {/* 单词卡片 */}
                <motion.div
                    key={cardKey}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    <div
                        className="bg-white rounded-[2rem] shadow-2xl overflow-hidden h-[32rem] flex flex-col"
                        style={{ border: '2px solid rgba(0, 180, 238, 0.25)' }}
                    >
                        {/* 主内容区域 - 单词居中 */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                            {/* 单词标题 */}
                            <div className="flex items-center gap-4 mb-4">
                                {isSyllableMode && currentCard.syllables ? (
                                    <div className="flex gap-2">
                                        {currentCard.syllables.map((syl, i) => {
                                            const colorScheme = syllableColors[i % syllableColors.length];
                                            return (
                                                <motion.span
                                                    key={i}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className={`text-5xl font-serif font-bold px-3 py-1 rounded-xl ${colorScheme.text} ${colorScheme.bg}`}
                                                >
                                                    {syl}
                                                </motion.span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <h2 className="text-6xl font-serif font-bold text-slate-900">{currentCard.word}</h2>
                                )}

                                <button
                                    onClick={() => playStandardAudio()}
                                    disabled={recordingState === 'playing_standard'}
                                    className={`p-4 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 ${recordingState === 'playing_standard' ? 'animate-pulse' : ''
                                        }`}
                                >
                                    <Volume2 size={28} className="text-slate-600" />
                                </button>
                            </div>

                            {/* 音标 */}
                            <div className="text-xl text-slate-400 font-mono mb-6">/{currentCard.phonetic}/</div>

                            {/* 翻转后的内容 */}
                            <AnimatePresence mode="wait">
                                {vocabCardFlipped && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="w-full space-y-3 max-w-md"
                                    >
                                        {/* 词意 */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                                        >
                                            <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">释义</p>
                                            <p className="text-slate-800 text-base font-medium">
                                                {currentCard.definition}
                                            </p>
                                        </motion.div>

                                        {/* AI助记 */}
                                        {currentCard.mnemonic && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Sparkles size={14} className="text-[#00B4EE]" />
                                                    <p className="text-[#00B4EE] text-xs font-bold uppercase tracking-wider">AI助记</p>
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed">
                                                    {currentCard.mnemonic}
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* 例句 */}
                                        {currentCard.contextSentence && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="bg-amber-50 rounded-xl p-3 border border-amber-100"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Lightbulb size={14} className="text-amber-600" />
                                                    <p className="text-amber-700 text-xs font-bold uppercase tracking-wider">例句</p>
                                                </div>
                                                <p className="text-slate-700 text-sm italic leading-relaxed">
                                                    "{currentCard.contextSentence}"
                                                </p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 录音按钮 - 固定在卡片底部区域 */}
                        {!isRemedialMode && (
                            <div
                                className="shrink-0 py-6 flex justify-center"
                                style={{
                                    background: 'linear-gradient(180deg, rgba(0, 180, 238, 0.06) 0%, rgba(0, 180, 238, 0.12) 100%)',
                                    borderTop: '1px solid rgba(0, 180, 238, 0.2)'
                                }}
                            >
                                <button
                                    onPointerDown={handleRecordStart}
                                    onPointerUp={handleRecordEnd}
                                    onPointerLeave={handleRecordEnd}
                                    disabled={!vocabSpeakEnabled || recordingState === 'finished'}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${!vocabSpeakEnabled
                                            ? 'bg-slate-300 cursor-not-allowed shadow-md'
                                            : recordingState === 'recording'
                                                ? 'bg-red-500 shadow-xl shadow-red-500/40 scale-110'
                                                : recordingState === 'finished'
                                                    ? 'bg-emerald-500 shadow-xl shadow-emerald-500/40'
                                                    : 'bg-slate-900 hover:bg-slate-800 active:scale-95 shadow-xl'
                                        }`}
                                >
                                    <Mic size={28} className="text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 底部按钮 - 仅回炉模式显示 */}
                {isRemedialMode && (
                    <div className="absolute bottom-8 left-0 w-full flex justify-center z-30">
                        {!vocabCardFlipped ? (
                            <button
                                onClick={() => setVocabCardFlipped(true)}
                                className="px-10 py-4 rounded-full bg-slate-900 text-white font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <RotateCw size={20} />
                                <span>查看单词</span>
                            </button>
                        ) : (
                            <motion.button
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={completeRemedialWord}
                                className="px-10 py-4 rounded-full bg-amber-500 text-white shadow-xl shadow-amber-500/30 flex items-center gap-3 font-bold text-lg hover:scale-105 transition-transform"
                            >
                                <CheckCircle2 size={24} />
                                <span>I Got It</span>
                            </motion.button>
                        )}
                    </div>
                )}

                {/* 录音状态提示 - 简化显示 */}
                {!isRemedialMode && recordingState !== 'idle' && recordingState !== 'finished' && (
                    <div className="absolute bottom-8 left-0 w-full flex justify-center z-20">
                        <div className="text-slate-400 font-bold text-sm bg-white/90 backdrop-blur px-5 py-2 rounded-full border border-slate-200 shadow-sm">
                            {recordingState === 'recording' && <span className="text-rose-500 animate-pulse">录音中...</span>}
                            {recordingState === 'playing_user' && <span className="text-indigo-500">Replaying You...</span>}
                            {recordingState === 'playing_standard' && <span className="text-indigo-500">Comparing Standard...</span>}
                        </div>
                    </div>
                )}

                {/* 录音完成后显示分数徽章 */}
                {!isRemedialMode && recordingState === 'finished' && score && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute bottom-8 left-0 w-full flex justify-center z-20"
                    >
                        <div className={`px-8 py-3 rounded-full font-bold text-lg shadow-xl flex items-center gap-3 ${score >= 80
                                ? 'bg-emerald-500 text-white'
                                : 'bg-amber-500 text-white'
                            }`}>
                            {score >= 80 ? '🎉' : '💪'} 得分: {score}
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    // 出口测试 - 检查阶段
    if (phase4Step === 'exitpass' && exitPassStep === 'check') {
        return (
            <div className="flex-1 max-w-3xl mx-auto w-full p-8 flex flex-col h-full">
                <div className="text-center mb-10 shrink-0 mt-8">
                    <div className="inline-block p-4 rounded-3xl bg-indigo-50 text-indigo-600 mb-6 shadow-sm border border-indigo-100">
                        <ListChecks size={40} />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-slate-900 mb-3">小试牛刀</h1>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pb-32 px-2 no-scrollbar">
                    {vocabList.map((item, i) => {
                        const isMastered = vocabStatus[item.word] === 'mastered';
                        return (
                            <motion.div
                                key={item.word}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`group flex items-center justify-between p-6 rounded-2xl border transition-all ${isMastered
                                        ? 'bg-emerald-50/50 border-emerald-100 shadow-none'
                                        : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex-1 flex items-center gap-6">
                                    <div className={`text-2xl font-serif font-bold transition-all ${isMastered ? 'text-slate-800' : 'text-slate-800'}`}>
                                        {item.word}
                                    </div>
                                </div>

                                <div className="flex-[2] text-center hidden sm:block relative">
                                    {isMastered ? (
                                        <p className="text-base text-slate-600">{item.definition}</p>
                                    ) : (
                                        <span className="text-sm font-bold text-slate-300 tracking-widest">隐藏</span>
                                    )}
                                </div>

                                <div
                                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all pointer-events-none ${isMastered
                                            ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-200'
                                            : 'bg-slate-50 border-slate-200 text-transparent'
                                        }`}
                                >
                                    <Check size={24} strokeWidth={3} />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent flex justify-center pointer-events-none z-20">
                    <div className="pointer-events-none px-16 py-5 rounded-full bg-gradient-to-r from-slate-400 to-slate-500 text-white font-bold text-xl transition-all flex items-center gap-3 shadow-xl">
                        <Clock size={24} className="animate-pulse" />
                        <span>检查中...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback: 回炉模式但卡片未加载
    if (phase4Step === 'exitpass' && exitPassStep === 'remedial') {
        return (
            <div className="flex h-full w-full bg-slate-50 flex-col items-center justify-center p-8">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-orange-100 text-center">
                    <RefreshCcw size={48} className="text-orange-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 text-xl font-bold mb-2">正在加载回炉单词...</p>
                    <p className="text-slate-400">请稍候，系统正在准备复习内容</p>
                </div>
            </div>
        );
    }

    return null;
}

