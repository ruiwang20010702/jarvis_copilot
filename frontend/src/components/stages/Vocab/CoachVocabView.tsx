import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Monitor, ChevronLeft, ChevronRight, RotateCw, Volume2,
    Eye, ListChecks, Check, Trophy, Play, RefreshCcw,
    Mic, Sparkles, MessageCircle, FlipVertical, Type
} from 'lucide-react';

// C-E-O 教学剧本配置
const VOCAB_TEACHING_SCRIPT = [
    {
        step: 0,
        phase: 'E',
        phaseName: 'Encoding',
        buttonTarget: 'play', // 对应哪个按钮
        jarvisTitle: '🎧 第一步：听音',
        jarvisContent: '请点击【播放】按钮，让学生先听标准发音。长难词像切香肠一样切开，一眼就记住。',
        jarvisAction: '播放标准音频'
    },
    {
        step: 1,
        phase: 'E',
        phaseName: 'Encoding',
        buttonTarget: 'syllable',
        jarvisTitle: '✂️ 第二步：切分',
        jarvisContent: '请点击【音节】按钮，展示音节切分。让学生看清楚单词的结构，降低记忆难度。',
        jarvisAction: '展示音节切分'
    },
    {
        step: 2,
        phase: 'C',
        phaseName: 'Context',
        buttonTarget: 'flip',
        jarvisTitle: '📖 第三步：语境',
        jarvisContent: '请点击【翻转】按钮，展示词意。还记得它在哪出现的吗？让学生回忆文章中的原句。',
        jarvisAction: '展示词意'
    },
    {
        step: 3,
        phase: 'O',
        phaseName: 'Output',
        buttonTarget: 'speak',
        jarvisTitle: '🎤 第四步：跟读',
        jarvisContent: '来，张嘴读出来。让学生跟读单词，通过发音肌肉记忆固化拼写。',
        jarvisAction: '开始跟读'
    },
    {
        step: 4,
        phase: 'NEXT',
        phaseName: 'Next',
        buttonTarget: 'next',
        jarvisTitle: '✅ 完成！',
        jarvisContent: '这个单词学完了！点击【下一个】继续学习下一个单词。',
        jarvisAction: '进入下一个'
    }
];

/**
 * 教师端生词学习组件
 * Vocab Coach View - 监控学生学习状态并提供控制
 */
export const CoachVocabView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
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
        toggleSyllableMode,
        playStandardAudio,
        vocabStatus,
        isSyllableMode,
        toggleVocabCheck,
        submitExitPass,
        remoteStream,
        vocabSpeakEnabled,
        vocabRecordingScore,
        studentRecordingState
    } = useGameStore();

    const currentCard = vocabList[currentVocabIndex];
    const currentRemedialWord = remedialQueue[remedialIndex];
    const currentRemedialCard = vocabList.find(v => v.word === currentRemedialWord);
    const checkedVocabWords = Object.keys(vocabStatus).filter(word => vocabStatus[word] === 'mastered');

    const [cardKey, setCardKey] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

    // 教学步骤状态 (0=播放, 1=音节, 2=翻转, 3=跟读, 4=下一个)
    const [teachingStep, setTeachingStep] = useState(0);

    // 当前剧本
    const currentScript = VOCAB_TEACHING_SCRIPT[teachingStep];

    // 切换单词时完全重置所有状态（教学步骤 + 卡片状态）
    useEffect(() => {
        setCardKey(prev => prev + 1);
        setTeachingStep(0);
        // 同时重置卡片的翻转和音节状态，以及跟读权限和评分
        useGameStore.setState({
            vocabCardFlipped: false,
            isSyllableMode: false,
            vocabSpeakEnabled: false,
            vocabRecordingScore: null
        });
    }, [currentVocabIndex, currentRemedialWord]);

    const prevVocabCard = () => {
        const prevIndex = currentVocabIndex - 1;
        if (prevIndex >= 0) {
            // 先重置本地状态
            setTeachingStep(0);


            // 再更新全局状态（这会触发 useEffect）
            useGameStore.setState({
                currentVocabIndex: prevIndex,
                vocabCardFlipped: false,
                isSyllableMode: false
            });
        }
    };

    // 处理下一个单词
    const handleNextVocabCard = () => {
        // 先重置本地状态
        setTeachingStep(0);


        // 再调用全局的 nextVocabCard（这会触发 useEffect）
        nextVocabCard();
    };

    // 处理播放按钮点击
    const handlePlayClick = () => {
        playStandardAudio();
        if (teachingStep === 0) {
            setTeachingStep(1);
        }
    };

    // 处理音节按钮点击
    const handleSyllableClick = () => {
        toggleSyllableMode();
        if (teachingStep === 1) {
            setTeachingStep(2);
        }
    };

    // 处理翻转按钮点击
    const handleFlipClick = () => {
        setVocabCardFlipped(!vocabCardFlipped);
        if (teachingStep === 2) {
            setTeachingStep(3);
        }
    };

    // 处理跟读按钮 - 只启用学生端录音权限
    const handleSpeakClick = () => {
        // 启用学生端的麦克风录音权限
        useGameStore.setState({ vocabSpeakEnabled: true });
        // 进入下一步（等待学生录音完成）
        if (teachingStep === 3) {
            setTeachingStep(4);
        }
    };

    // 判断按钮是否应该闪烁
    const shouldPulse = (buttonName: string) => {
        if (phase4Step !== 'flashcards') return false;
        if (currentScript?.buttonTarget !== buttonName) return false;

        // 根据不同按钮判断是否已完成
        switch (buttonName) {
            case 'play':
                return teachingStep === 0; // 只有在第0步才闪烁
            case 'syllable':
                return teachingStep === 1; // 只有在第1步才闪烁
            case 'flip':
                return teachingStep === 2; // 只有在第2步才闪烁
            case 'speak':
                return teachingStep === 3 && vocabRecordingScore === null; // 第3步且未录音
            case 'next':
                return teachingStep === 4; // 第4步（所有步骤完成后）
            default:
                return false;
        }
    };

    return (
        <main className="flex h-full w-full bg-slate-50">
            {/* 左侧：学生镜像 */}
            <div
                className="flex-1 flex flex-col items-center justify-center p-8 border-r border-slate-200 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 180, 238, 0.08) 0%, rgba(0, 180, 238, 0.12) 40%, rgba(253, 231, 0, 0.1) 70%, rgba(253, 231, 0, 0.15) 100%)'
                }}
            >
                {/* 顶部状态栏 */}
                <div className="absolute top-0 left-0 w-full p-4 border-b border-slate-100 bg-white z-10 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Monitor size={14} /> 学生镜像
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">
                        {phase4Step === 'flashcards'
                            ? '卡片模式'
                            : phase4Step === 'exitpass' && exitPassStep === 'check'
                                ? '出门测: 检查'
                                : phase4Step === 'exitpass' && exitPassStep === 'remedial'
                                    ? '🔄 回炉学习'
                                    : '完成'
                        }
                    </span>
                </div>


                <div className={`w-full max-w-4xl transition-all ${phase4Step === 'exitpass' && exitPassStep === 'check'
                    ? 'scale-100 opacity-100'
                    : 'scale-75 origin-center opacity-90'
                    }`}>
                    <AnimatePresence mode="wait">
                        {phase4Step === 'flashcards' && currentCard ? (
                            <motion.div
                                key={`flashcard-${cardKey}`}
                                initial={{ opacity: 0, x: slideDirection === 'right' ? 50 : -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: slideDirection === 'right' ? -50 : 50 }}
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                                className="relative"
                            >
                                {/* 简单的进度显示 - 在单词卡片上方 */}
                                <div className="absolute -top-8 left-0 right-0 flex items-center justify-center gap-3">
                                    <span className="text-slate-400 text-sm font-medium">
                                        {currentVocabIndex + 1} / {vocabList.length}
                                    </span>
                                    <div className="flex gap-1">
                                        {VOCAB_TEACHING_SCRIPT.slice(0, 4).map((s, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-2 h-2 rounded-full transition-all ${idx < teachingStep ? 'bg-[#00B4EE]' :
                                                    idx === teachingStep ? 'bg-[#FDE700]' : 'bg-slate-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="aspect-[16/10] bg-white rounded-[3rem] shadow-xl border border-slate-200 flex flex-col items-center justify-center relative p-10">
                                    <h2 className="text-7xl font-serif font-bold text-slate-800">
                                        {isSyllableMode && currentCard.syllables ? currentCard.syllables.join('·') : currentCard.word}
                                    </h2>
                                    {vocabCardFlipped && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-8 bg-slate-50 rounded-xl p-4 w-full text-center"
                                        >
                                            <p className="text-slate-500">{currentCard.definition}</p>
                                        </motion.div>
                                    )}
                                    {/* 跟读状态显示 */}
                                    {(studentRecordingState !== 'idle' || vocabRecordingScore !== null) && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute bottom-8 left-1/2 -translate-x-1/2"
                                        >
                                            {studentRecordingState === 'recording' ? (
                                                <div className="flex items-center gap-3 px-6 py-3 bg-red-50 border-2 border-red-200 rounded-full">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                                    <span className="text-red-600 font-bold">录音中...</span>
                                                    <Mic size={18} className="text-red-500" />
                                                </div>
                                            ) : studentRecordingState === 'assessing' ? (
                                                <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-2 border-amber-200 rounded-full">
                                                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                                                    <span className="text-amber-600 font-bold">评分中...</span>
                                                </div>
                                            ) : vocabRecordingScore !== null && (
                                                <div className={`flex items-center gap-3 px-6 py-3 rounded-full ${vocabRecordingScore >= 80
                                                    ? 'bg-emerald-50 border-2 border-emerald-200'
                                                    : 'bg-amber-50 border-2 border-amber-200'
                                                    }`}>
                                                    {vocabRecordingScore >= 80 ? (
                                                        <>
                                                            <Sparkles size={18} className="text-emerald-500" />
                                                            <span className="text-emerald-600 font-bold">发音很棒！{vocabRecordingScore}分</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-amber-600 font-bold">{vocabRecordingScore}分 - 再试一次？</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ) : phase4Step === 'exitpass' && exitPassStep === 'check' ? (
                            <motion.div
                                key="check"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full bg-white rounded-[3rem] shadow-xl border border-slate-200 p-10"
                            >
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 mb-2">
                                        <ListChecks size={20} />
                                        <span className="font-bold text-sm">出口测试</span>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {vocabList.map((item) => {
                                        const isMastered = vocabStatus[item.word] === 'mastered';
                                        return (
                                            <div
                                                key={item.word}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isMastered
                                                    ? 'bg-emerald-50 border-emerald-100'
                                                    : 'bg-white border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="text-xl font-serif font-bold text-slate-800">
                                                        {item.word}
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-1">
                                                        {item.definition}
                                                    </div>
                                                </div>
                                                <div
                                                    onClick={() => toggleVocabCheck(item.word)}
                                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isMastered
                                                        ? 'bg-emerald-500 border-emerald-500 cursor-pointer'
                                                        : 'bg-white border-slate-300 cursor-pointer hover:border-emerald-400'
                                                        }`}
                                                >
                                                    {isMastered && <Check size={16} className="text-white" strokeWidth={3} />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        ) : phase4Step === 'exitpass' && exitPassStep === 'remedial' ? (
                            currentRemedialCard ? (
                                <motion.div
                                    key={`remedial-${remedialIndex}`}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                    className="relative"
                                >
                                    {/* 回炉学习进度显示 */}
                                    <div className="absolute -top-8 left-0 right-0 flex items-center justify-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100">
                                            <RefreshCcw size={14} className="text-orange-500" />
                                            <span className="text-orange-600 text-sm font-bold">回炉学习</span>
                                        </div>
                                        <span className="text-slate-400 text-sm font-medium">
                                            {remedialIndex + 1} / {remedialQueue.length}
                                        </span>
                                        <div className="flex gap-1">
                                            {VOCAB_TEACHING_SCRIPT.slice(0, 4).map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`w-2 h-2 rounded-full transition-all ${idx < teachingStep ? 'bg-[#00B4EE]' :
                                                        idx === teachingStep ? 'bg-[#FDE700]' : 'bg-slate-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* 回炉单词卡片 */}
                                    <div className="aspect-[16/10] bg-white rounded-[3rem] shadow-xl border border-orange-100 flex flex-col items-center justify-center relative p-10">
                                        <h2 className="text-7xl font-serif font-bold text-slate-800">
                                            {isSyllableMode && currentRemedialCard.syllables ? currentRemedialCard.syllables.join('·') : currentRemedialCard.word}
                                        </h2>
                                        {vocabCardFlipped && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-8 bg-slate-50 rounded-xl p-4 w-full text-center"
                                            >
                                                <p className="text-slate-500">{currentRemedialCard.definition}</p>
                                            </motion.div>
                                        )}
                                        {/* 跟读状态显示 */}
                                        {(studentRecordingState !== 'idle' || vocabRecordingScore !== null) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                                            >
                                                {studentRecordingState === 'recording' ? (
                                                    <div className="flex items-center gap-3 px-6 py-3 bg-red-50 border-2 border-red-200 rounded-full">
                                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                                        <span className="text-red-600 font-bold">录音中...</span>
                                                        <Mic size={18} className="text-red-500" />
                                                    </div>
                                                ) : studentRecordingState === 'assessing' ? (
                                                    <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-2 border-amber-200 rounded-full">
                                                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                                                        <span className="text-amber-600 font-bold">评分中...</span>
                                                    </div>
                                                ) : vocabRecordingScore !== null && (
                                                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full ${vocabRecordingScore >= 80
                                                        ? 'bg-emerald-50 border-2 border-emerald-200'
                                                        : 'bg-amber-50 border-2 border-amber-200'
                                                        }`}>
                                                        {vocabRecordingScore >= 80 ? (
                                                            <>
                                                                <Sparkles size={18} className="text-emerald-500" />
                                                                <span className="text-emerald-600 font-bold">发音很棒！{vocabRecordingScore}分</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-amber-600 font-bold">{vocabRecordingScore}分 - 再试一次？</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                /* Fallback: remedial 模式但卡片未加载 */
                                <motion.div
                                    key="remedial-loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="aspect-[16/10] bg-white rounded-[3rem] shadow-xl border border-orange-100 flex flex-col items-center justify-center p-10"
                                >
                                    <RefreshCcw size={48} className="text-orange-400 animate-spin mb-4" />
                                    <p className="text-slate-500 text-lg">正在加载回炉单词...</p>
                                    <p className="text-slate-400 text-sm mt-2">
                                        待复习: {remedialQueue.length} 个单词
                                    </p>
                                </motion.div>
                            )
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>

            {/* 右侧：控制面板 */}
            <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col">
                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <div className="p-6 border-b border-slate-100 shrink-0">
                    <VideoWindow
                        layoutId="coach-video"
                        className="relative w-full rounded-xl shadow-md"
                        videoStream={remoteStream}
                    />
                </div>

                {/* 控制区 */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                    {phase4Step === 'flashcards' && (
                        <>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">单词卡片控制</div>

                            {/* 导航按钮 */}
                            <div className="flex gap-2">
                                <button
                                    onClick={prevVocabCard}
                                    disabled={currentVocabIndex === 0}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    <span>上一个</span>
                                </button>
                                <motion.button
                                    onClick={handleNextVocabCard}
                                    disabled={currentVocabIndex >= vocabList.length - 1}
                                    animate={{
                                        boxShadow: shouldPulse('next')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('next') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`flex-1 py-3 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('next')
                                        ? 'bg-[#00B4EE]'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                >
                                    <span>下一个</span>
                                    <ChevronRight size={16} />
                                </motion.button>
                            </div>

                            {/* 功能按钮 - 带闪烁动效 */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* 翻转按钮 - 只有当前步骤才闪烁 */}
                                <motion.button
                                    onClick={handleFlipClick}
                                    animate={{
                                        boxShadow: shouldPulse('flip')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('flip') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('flip')
                                        ? 'bg-[#00B4EE] text-white'
                                        : 'bg-slate-100 hover:bg-slate-200'
                                        }`}
                                >
                                    <RotateCw size={14} />
                                    <span>翻转</span>
                                </motion.button>

                                {/* 播放按钮 - 只有当前步骤才闪烁 */}
                                <motion.button
                                    onClick={handlePlayClick}
                                    animate={{
                                        boxShadow: shouldPulse('play')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('play') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('play')
                                        ? 'bg-[#00B4EE] text-white'
                                        : 'bg-slate-100 hover:bg-slate-200'
                                        }`}
                                >
                                    <Volume2 size={14} />
                                    <span>播放</span>
                                </motion.button>

                                {/* 音节按钮 - 只有当前步骤才闪烁 */}
                                <motion.button
                                    onClick={handleSyllableClick}
                                    animate={{
                                        boxShadow: shouldPulse('syllable')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('syllable') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('syllable')
                                        ? 'bg-[#00B4EE] text-white'
                                        : 'bg-slate-100 hover:bg-slate-200'
                                        }`}
                                >
                                    <Eye size={14} />
                                    <span>音节</span>
                                </motion.button>

                                {/* 跟读按钮 - 只有当前步骤才闪烁 */}
                                <motion.button
                                    onClick={handleSpeakClick}
                                    disabled={vocabSpeakEnabled}
                                    animate={{
                                        boxShadow: shouldPulse('speak')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('speak') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('speak')
                                        ? 'bg-[#00B4EE] text-white'
                                        : studentRecordingState === 'recording'
                                            ? 'bg-red-500 text-white'
                                            : studentRecordingState === 'assessing'
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-slate-100 hover:bg-slate-200'
                                        }`}
                                >
                                    <Mic size={14} />
                                    <span>{studentRecordingState === 'recording' ? '录音中...' : studentRecordingState === 'assessing' ? '评分中...' : vocabRecordingScore !== null ? `${vocabRecordingScore}分` : '跟读'}</span>
                                </motion.button>
                            </div>

                            {/* 出口测按钮 */}
                            <button
                                onClick={() => useGameStore.setState({ phase4Step: 'exitpass', exitPassStep: 'check' })}
                                className="py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
                            >
                                <Play size={14} />
                                <span>进入出口测试</span>
                            </button>

                            {/* Jarvis 助教卡片 */}
                            <motion.div
                                key={teachingStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex-1 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 rounded-2xl p-5 flex flex-col"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B4EE] to-cyan-400 flex items-center justify-center shadow-md">
                                        <MessageCircle size={14} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-cyan-800">Jarvis 助教</div>
                                        <div className="text-[10px] text-cyan-600">智能教学引导</div>
                                    </div>
                                    {/* 阶段指示器 */}
                                    <div className="ml-auto flex items-center gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentScript?.phase === 'E' ? 'bg-blue-100 text-blue-700' :
                                            currentScript?.phase === 'C' ? 'bg-green-100 text-green-700' :
                                                currentScript?.phase === 'O' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {currentScript?.phase}
                                        </span>
                                    </div>
                                </div>

                                {/* Jarvis 内容 */}
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-700 mb-2">
                                        {currentScript?.jarvisTitle}
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {currentScript?.jarvisContent}
                                    </p>
                                </div>

                                {/* 操作提示 */}
                                <div className="mt-4 pt-3 border-t border-cyan-100">
                                    <div className="flex items-center gap-2 text-xs text-cyan-700">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="w-2 h-2 rounded-full bg-[#00B4EE]"
                                        />
                                        <span className="font-medium">下一步: {currentScript?.jarvisAction}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}

                    {phase4Step === 'exitpass' && exitPassStep === 'check' && (
                        <div className="space-y-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">出口测试控制</div>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <div className="text-xs font-bold text-blue-600 mb-1">已勾选</div>
                                <div className="text-3xl font-bold text-blue-700">
                                    {checkedVocabWords.length} / {vocabList.length}
                                </div>
                            </div>

                            <button
                                onClick={submitExitPass}
                                disabled={checkedVocabWords.length === 0}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                            >
                                <Trophy size={20} />
                                <span>提交测试</span>
                            </button>

                            <button
                                onClick={() => useGameStore.setState({ phase4Step: 'flashcards' })}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <RefreshCcw size={14} />
                                <span>返回卡片</span>
                            </button>
                        </div>
                    )}

                    {phase4Step === 'exitpass' && exitPassStep === 'remedial' && (
                        <>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">回炉学习控制</div>

                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                <div className="text-xs font-bold text-orange-600 mb-1">当前进度</div>
                                <div className="text-3xl font-bold text-orange-700">
                                    {remedialIndex + 1} / {remedialQueue.length}
                                </div>
                                <div className="text-xs text-orange-500 mt-1">
                                    待复习: {currentRemedialWord}
                                </div>
                            </div>

                            {/* 导航按钮 */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const newIndex = remedialIndex - 1;
                                        if (newIndex >= 0) {
                                            useGameStore.setState({
                                                remedialIndex: newIndex,
                                                vocabCardFlipped: false,
                                                isSyllableMode: false,
                                                vocabSpeakEnabled: false
                                            });
                                            setTeachingStep(0);


                                        }
                                    }}
                                    disabled={remedialIndex === 0}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    <span>上一个</span>
                                </button>
                                <button
                                    onClick={() => {
                                        useGameStore.getState().completeRemedialWord();
                                        setTeachingStep(0);


                                    }}
                                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <span>下一个</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* 功能按钮 - 带闪烁动效 */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* 翻转按钮 */}
                                <motion.button
                                    onClick={handleFlipClick}
                                    animate={{
                                        boxShadow: shouldPulse('flip')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('flip') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('flip')
                                        ? 'bg-[#00B4EE] text-white'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}
                                >
                                    <FlipVertical size={14} />
                                    <span>翻转</span>
                                </motion.button>

                                {/* 音节按钮 */}
                                <motion.button
                                    onClick={handleSyllableClick}
                                    animate={{
                                        boxShadow: shouldPulse('syllable')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('syllable') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('syllable')
                                        ? 'bg-[#00B4EE] text-white'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}
                                >
                                    <Type size={14} />
                                    <span>音节</span>
                                </motion.button>

                                {/* 播放按钮 */}
                                <motion.button
                                    onClick={() => { playStandardAudio(); setTeachingStep(1); }}
                                    animate={{
                                        boxShadow: shouldPulse('play')
                                            ? ['0 0 0 0 rgba(0, 180, 238, 0)', '0 0 0 8px rgba(0, 180, 238, 0.3)', '0 0 0 0 rgba(0, 180, 238, 0)']
                                            : '0 0 0 0 rgba(0, 180, 238, 0)'
                                    }}
                                    transition={shouldPulse('play') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shouldPulse('play')
                                        ? 'bg-[#00B4EE] text-white'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}
                                >
                                    <Volume2 size={14} />
                                    <span>播放</span>
                                </motion.button>

                                {/* 跟读按钮 */}
                                <motion.button
                                    onClick={handleSpeakClick}
                                    disabled={vocabSpeakEnabled}
                                    animate={{
                                        boxShadow: shouldPulse('readAloud')
                                            ? ['0 0 0 0 rgba(239, 68, 68, 0)', '0 0 0 8px rgba(239, 68, 68, 0.3)', '0 0 0 0 rgba(239, 68, 68, 0)']
                                            : '0 0 0 0 rgba(239, 68, 68, 0)'
                                    }}
                                    transition={shouldPulse('readAloud') ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
                                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${studentRecordingState === 'recording'
                                        ? 'bg-red-500 text-white'
                                        : studentRecordingState === 'assessing'
                                            ? 'bg-amber-500 text-white'
                                            : shouldPulse('readAloud')
                                                ? 'bg-red-500 text-white'
                                                : 'bg-slate-100 text-slate-700'
                                        }`}
                                >
                                    <Mic size={14} />
                                    <span>{studentRecordingState === 'recording' ? '录音中...' : studentRecordingState === 'assessing' ? '评分中...' : vocabRecordingScore !== null ? `得分: ${vocabRecordingScore}` : '跟读'}</span>
                                </motion.button>
                            </div>

                            {/* Jarvis 助教卡片 */}
                            <motion.div
                                key={teachingStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex-1 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-5 flex flex-col"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
                                        <MessageCircle size={14} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-orange-800">Jarvis 助教</div>
                                        <div className="text-[10px] text-orange-600">回炉指导</div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/80 rounded-xl p-4 overflow-y-auto">
                                    <div className="mb-3">
                                        <p className="text-xs font-bold text-orange-700 mb-1">{currentScript?.jarvisTitle || '回炉学习'}</p>
                                        <p className="text-slate-700 text-sm leading-relaxed">{currentScript?.jarvisContent || '请按照 C-E-O 流程引导学生复习这个单词。'}</p>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                                        ⏭ 下一步: {currentScript?.jarvisAction || '继续教学'}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
};

