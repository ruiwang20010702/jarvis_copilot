import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Highlighter, Mic, CheckCircle2, BookOpen, BarChart3,
    X, HelpCircle, Navigation, Trophy, Send,
    MousePointer2, ChevronDown
} from 'lucide-react';
import {
    COACHING_DEMO_QUESTION,
    DEMO_QUIZ_ANALYSIS,
    getPhaseConfig,
    generateQuizAnalysis,
    QuizAnalysis
} from './config';
import { audioRecorder } from '../../../services/audioRecorder';
import { transcribeAudio } from '../../../services/apiService';

export const StudentCoachingView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const {
        articleData,
        quizAnswers,
        focusParagraphIndex,
        coachingPhase,
        coachingTaskType,
        coachingTaskReceived,
        coachingTaskCompleted,
        coachingTaskTarget,
        teacherHighlights,
        studentHighlights,
        gpsCardReceived,
        receiveCoachingTask,
        completeCoachingTask,
        addStudentHighlight,
        receiveGpsCard,
        setStudentVoiceAnswer,
        setCoachingReselectedAnswer,
        highlights, // 实战阶段做题痕迹
        messages,
        addMessage,
        remoteStream,
        currentCorrectionQuestionId
    } = useGameStore();

    const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);
    const lastAutoSwitchPhase = useRef<number | null>(null);
    const [activeTab, setActiveTab] = useState<'article' | 'analysis'>('analysis');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [selectionInfo, setSelectionInfo] = useState<{ top: number; left: number } | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [showGpsCard, setShowGpsCard] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    // 从 store 生成 quiz 分析数据
    const quizAnalysis = useMemo(() => {
        if (articleData.quiz.length > 0 && quizAnswers.length > 0) {
            const analysis = generateQuizAnalysis({
                quiz: articleData.quiz,
                quizAnswers
            });
            // 默认展开第一道错题
            const firstWrong = analysis.find(q => q.status === 'wrong' || q.status === 'guessed');
            if (firstWrong && expandedQuestion === null) {
                setExpandedQuestion(firstWrong.questionId);
            }
            return analysis;
        }
        return DEMO_QUIZ_ANALYSIS;
    }, [articleData.quiz, quizAnswers]);

    // 从 store 生成完整的题目选项数据
    const fullQuizOptions = useMemo(() => {
        if (articleData.quiz.length > 0) {
            return articleData.quiz.map(q => {
                const answer = quizAnswers.find(a => a.questionId === q.id);
                return {
                    questionId: q.id,
                    question: q.question,
                    options: q.options,
                    studentAnswer: answer?.optionId || '',
                    correctAnswer: q.correctOption
                };
            });
        }
        return [];
    }, [articleData.quiz, quizAnswers]);

    // 获取当前错题（用于高亮相关段落）
    const currentWrongQuestion = useMemo(() => {
        // 1. 优先使用 store 中指定的当前纠错题目 ID
        if (currentCorrectionQuestionId) {
            return articleData.quiz.find(q => q.id === currentCorrectionQuestionId) || null;
        }

        // 2. Fallback: 查找第一个需要讲解的题目
        const coachingItem = quizAnalysis.find(q => q.status === 'wrong' || q.status === 'guessed');
        if (coachingItem) {
            return articleData.quiz.find(q => q.id === coachingItem.questionId) || null;
        }
        return null;
    }, [quizAnalysis, articleData.quiz, currentCorrectionQuestionId]);

    const currentPhaseConfig = getPhaseConfig(coachingPhase);

    useEffect(() => {
        if (coachingTaskType && !coachingTaskReceived) {
            setShowTaskModal(true);
        }
    }, [coachingTaskType, coachingTaskReceived]);

    useEffect(() => {
        if (focusParagraphIndex !== null && paraRefs.current[focusParagraphIndex]) {
            paraRefs.current[focusParagraphIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [focusParagraphIndex]);

    // 自动跳转页面逻辑
    useEffect(() => {
        if (coachingTaskReceived && coachingPhase !== lastAutoSwitchPhase.current) {
            if (coachingPhase === 2 || coachingPhase === 3) { // 技能召回(GPS) / 路标定位 - 划题干
                setActiveTab('analysis');
            } else if (coachingPhase === 4) { // 搜原句 - 划文章
                setActiveTab('article');
            } else if (coachingPhase === 5) { // 纠偏锁定 - 重选
                setActiveTab('analysis');
            } else if (coachingPhase === 6) { // 技巧复盘
                setActiveTab('analysis');
            }
            lastAutoSwitchPhase.current = coachingPhase;
        }
    }, [coachingPhase, coachingTaskReceived]);

    const handleStudentTextSelection = () => {
        if (coachingTaskType !== 'highlight' || !coachingTaskReceived) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            setSelectionInfo(null);
            return;
        }
        const text = selection.toString().trim();
        if (!text) {
            setSelectionInfo(null);
            return;
        }
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionInfo({ top: rect.top - 60, left: rect.left + rect.width / 2 });
    };

    const confirmHighlightAndSubmit = () => {
        if (selectedText) {
            addStudentHighlight({
                paragraphIndex: focusParagraphIndex || 0,
                startOffset: 0,
                endOffset: selectedText.length,
                text: selectedText
            });
            // 不再自动完成任务，让学生可以继续划词
            // completeCoachingTask(); 
        }
        setSelectionInfo(null);
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
    };

    // 学生确认完成划词任务
    const submitHighlightTask = () => {
        if (studentHighlights.length > 0) {
            completeCoachingTask();
        }
    };

    const handleReceiveTask = () => {
        receiveCoachingTask();
        setShowTaskModal(false);

        // 根据任务类型自动切换标签页
        if (coachingTaskType === 'gps') {
            setShowGpsCard(true);
        } else if (coachingTaskType === 'select') {
            // 选择答案任务 → 切换到题目分析
            setActiveTab('analysis');
        } else if (coachingTaskType === 'highlight') {
            // 划词任务：根据目标区域切换
            if (coachingTaskTarget === 'question') {
                // 目标是题干 -> 切换到题目分析
                setActiveTab('analysis');
            } else {
                // 默认（如目标是文章） -> 切换到原文
                setActiveTab('article');
            }
        } else if (coachingTaskType === 'voice') {
            // 语音任务 → 自动开始录音
            handleStartRecording();
        }
    };

    const handleReceiveGps = () => {
        receiveGpsCard();
        setShowGpsCard(false);
        completeCoachingTask();
    };

    // 开始录音
    const handleStartRecording = async () => {
        const started = await audioRecorder.startRecording();
        if (started) {
            setIsRecording(true);
        } else {
            addMessage({ role: 'student', text: '🎙️ 麦克风权限获取失败' });
        }
    };

    // 停止录音并转写
    const handleStopRecording = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        try {
            const audioBlob = await audioRecorder.stopRecording();
            if (!audioBlob) {
                setIsTranscribing(false);
                return;
            }

            console.log('[Voice] Audio recorded, size:', audioBlob.size);

            // 调用 STT API
            const result = await transcribeAudio(audioBlob, 'zh');

            if (result.success && result.transcript) {
                console.log('[Voice] Transcript:', result.transcript);
                setStudentVoiceAnswer(result.transcript);
                addMessage({ role: 'student', text: result.transcript });
                completeCoachingTask();
            } else {
                console.error('[Voice] Transcription failed:', result.error);
                addMessage({ role: 'student', text: '🎙️ 语音识别失败，请重试' });
            }
        } catch (error) {
            console.error('[Voice] Error:', error);
            addMessage({ role: 'student', text: '🎙️ 录音处理失败' });
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleSelectAnswer = (optionId: string) => {
        setSelectedAnswer(optionId);
        setCoachingReselectedAnswer(optionId); // 同步到 store，供教练端读取
        // 检查是否选对了正确答案
        if (currentWrongQuestion && optionId === currentWrongQuestion.correctOption) {
            completeCoachingTask();
        }
    };

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'voice': return <Mic size={28} className="text-rose-500" />;
            case 'highlight': return <Highlighter size={28} className="text-amber-500" />;
            case 'select': return <MousePointer2 size={28} className="text-blue-500" />;
            case 'gps': return <Navigation size={28} className="text-cyan-500" />;
            case 'review': return <Trophy size={28} className="text-amber-500" />;
            default: return <Send size={28} className="text-slate-500" />;
        }
    };

    const getTaskDescription = (type: string) => {
        switch (type) {
            case 'voice': return '请按住麦克风按钮，用语音回答老师的问题';
            case 'highlight': return '请在文章或题干中画线标记关键内容';
            case 'select': return '请重新选择正确答案';
            case 'gps': return '老师给你发送了GPS解题卡，点击接收';
            case 'review': return '查看本题的解题路径总结';
            default: return '完成老师布置的任务';
        }
    };

    const renderParagraphWithHighlights = (para: string, paraIndex: number) => {
        const isFocused = focusParagraphIndex === paraIndex;
        const isBlur = focusParagraphIndex !== null && !isFocused;

        // 检查当前段落是否是错题相关段落
        const isRelatedToWrongQuestion = currentWrongQuestion?.relatedParagraphIndices?.includes(paraIndex);

        // 收集所有高亮区域，按 startOffset 排序
        const allHighlightRanges: Array<{
            start: number;
            end: number;
            text: string;
            type: 'battle' | 'teacher' | 'student';
        }> = [];

        // 1. 实战阶段黄色高亮（使用精确位置）
        highlights.filter(h => h.paragraphIndex === paraIndex).forEach(h => {
            allHighlightRanges.push({
                start: h.startOffset,
                end: h.startOffset + h.text.length,
                text: h.text,
                type: 'battle'
            });
        });

        // 2. 教师红色画线
        teacherHighlights.filter(h => h.paragraphIndex === paraIndex).forEach(h => {
            allHighlightRanges.push({
                start: h.startOffset,
                end: h.endOffset,
                text: h.text,
                type: 'teacher'
            });
        });

        // 3. 学生带练阶段画线
        studentHighlights.filter(h => h.paragraphIndex === paraIndex).forEach(h => {
            allHighlightRanges.push({
                start: h.startOffset,
                end: h.endOffset,
                text: h.text,
                type: 'student'
            });
        });

        // 按起始位置排序
        allHighlightRanges.sort((a, b) => a.start - b.start);

        // 构建渲染片段
        const segments: React.ReactNode[] = [];
        let currentOffset = 0;

        allHighlightRanges.forEach((range, idx) => {
            // 添加高亮前的普通文本
            if (range.start > currentOffset) {
                segments.push(<span key={`text-${idx}`}>{para.slice(currentOffset, range.start)}</span>);
            }
            // 添加高亮文本
            const highlightClass = range.type === 'battle'
                ? 'bg-yellow-200/60 text-yellow-900 px-0.5 rounded'
                : range.type === 'teacher'
                    ? 'bg-red-200 text-red-900 px-0.5 rounded underline decoration-red-500 decoration-2'
                    : 'bg-amber-300 text-amber-900 px-0.5 rounded font-medium';
            const title = range.type === 'battle' ? '我的标记' : range.type === 'teacher' ? '老师标记' : '带练标记';
            segments.push(
                <span key={`highlight-${idx}`} className={highlightClass} title={title}>
                    {para.slice(range.start, range.end)}
                </span>
            );
            currentOffset = range.end;
        });

        // 添加最后一段普通文本
        if (currentOffset < para.length) {
            segments.push(<span key="text-last">{para.slice(currentOffset)}</span>);
        }

        const content = segments.length > 0 ? segments : para;

        return (
            <div
                key={paraIndex}
                ref={el => { if (el) paraRefs.current[paraIndex] = el as HTMLParagraphElement; }}
                className={`mb-4 p-4 rounded-xl transition-all duration-300 border-2 ${isRelatedToWrongQuestion
                    ? 'bg-amber-50/50 border-amber-300 shadow-sm'
                    : isFocused
                        ? 'bg-blue-50/50 border-blue-200'
                        : isBlur
                            ? 'border-transparent opacity-40'
                            : 'border-transparent'
                    } ${coachingTaskType === 'highlight' && coachingTaskReceived && !isBlur ? 'cursor-text select-text' : ''}`}
            >
                {/* 错题相关段落标记 */}
                {isRelatedToWrongQuestion && (
                    <div className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        错题相关段落
                    </div>
                )}
                <p className={`text-lg leading-relaxed font-serif transition-colors ${isRelatedToWrongQuestion
                    ? 'text-slate-800'
                    : isFocused
                        ? 'text-slate-900 font-medium'
                        : isBlur
                            ? 'text-slate-400'
                            : 'text-slate-700'
                    }`}>
                    {content}
                </p>
            </div>
        );
    };

    const renderQuestionOptions = (quiz: typeof fullQuizOptions[0], analysis: typeof quizAnalysis[0]) => {
        return (
            <div className="mt-3 space-y-2">
                {quiz.options.map(opt => {
                    const isStudentAnswer = opt.id === quiz.studentAnswer;
                    const isCorrect = opt.id === quiz.correctAnswer;

                    return (
                        <div
                            key={opt.id}
                            className={`p-3 rounded-lg border flex justify-between items-center text-sm ${isStudentAnswer && !isCorrect
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : isCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                        >
                            <div className="flex gap-2">
                                <span className="font-bold">{opt.id}.</span>
                                <span className="font-serif">{opt.text}</span>
                            </div>
                            {isStudentAnswer && !isCorrect && (
                                <span className="text-xs font-bold text-rose-500">我的选择</span>
                            )}
                            {isCorrect && (
                                <span className="text-xs font-bold text-emerald-600">正确答案</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-gray-50 p-6 gap-6 overflow-hidden">
            {/* 任务接收弹窗 */}
            <AnimatePresence>
                {showTaskModal && coachingTaskType && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white text-slate-900 px-8 py-6 rounded-3xl shadow-2xl max-w-md"
                            style={{ border: '1px solid rgba(0, 180, 238, 0.3)' }}
                        >
                            <div className="flex items-start gap-5 mb-6">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50">
                                    {getTaskIcon(coachingTaskType)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-1">新任务</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        {getTaskDescription(coachingTaskType)}
                                    </p>
                                    {currentPhaseConfig && (
                                        <div className="mt-2 text-xs text-[#00B4EE] font-medium">
                                            阶段 {coachingPhase}/6: {currentPhaseConfig.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleReceiveTask}
                                className="w-full py-3 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}
                            >
                                ✓ 接收任务
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GPS卡片弹窗 */}
            <AnimatePresence>
                {showGpsCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-8 py-8 rounded-3xl shadow-2xl max-w-sm text-center"
                        >
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Navigation size={40} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">GPS 定位卡</h3>
                            <p className="text-cyan-100 text-sm mb-6 leading-relaxed">
                                三步定位法：<br />
                                <strong>1. 圈路标</strong> → <strong>2. 搜原句</strong> → <strong>3. 锁答案</strong>
                            </p>
                            <button
                                onClick={handleReceiveGps}
                                className="w-full py-3 bg-white text-cyan-600 font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
                            >
                                ✓ 装备卡片
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 画线确认浮窗 */}
            <AnimatePresence>
                {selectionInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ top: selectionInfo.top, left: selectionInfo.left }}
                        className="fixed z-50 -translate-x-1/2 bg-amber-500 text-white rounded-full shadow-xl px-4 py-2 flex items-center gap-2"
                    >
                        <Highlighter size={16} />
                        <button onClick={confirmHighlightAndSubmit} className="font-bold text-sm">
                            确认画线并提交
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 左侧 70% */}
            <div className="flex-[7] bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col"
                style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}>

                <div className="h-14 border-b border-slate-100 flex items-center px-6 bg-white gap-2 shrink-0">
                    <button
                        onClick={() => setActiveTab('article')}
                        className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all border ${activeTab === 'article'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <BookOpen size={16} />
                        原文
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all border ${activeTab === 'analysis'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <BarChart3 size={16} />
                        题目分析
                    </button>

                    {highlights.length > 0 && (
                        <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            我的 {highlights.length} 处标记
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6" onMouseUp={handleStudentTextSelection}>
                    {activeTab === 'article' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
                            <h2 className={`text-2xl font-bold text-slate-800 mb-6 font-serif transition-opacity ${focusParagraphIndex !== null ? 'opacity-30' : 'opacity-100'
                                }`}>
                                {articleData.title}
                            </h2>
                            {articleData.paragraphs.map((para, i) => renderParagraphWithHighlights(para, i))}
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">我的做题分析</h2>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1.5 text-emerald-600">
                                        <CheckCircle2 size={16} /> 正确 {quizAnalysis.filter(q => q.status === 'correct').length}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-rose-600">
                                        <X size={16} /> 错误 {quizAnalysis.filter(q => q.status === 'wrong').length}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-amber-600">
                                        <HelpCircle size={16} /> 蒙对 {quizAnalysis.filter(q => q.status === 'guessed').length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {quizAnalysis.map((item, idx) => {
                                    const fullQuiz = fullQuizOptions[idx];
                                    if (!fullQuiz) return null;

                                    // 检查是否是当前正在纠错的目标题目
                                    const isTargetQuestion = currentWrongQuestion?.id === item.questionId;
                                    const isReselecting = coachingTaskType === 'select' && coachingTaskReceived && isTargetQuestion;
                                    const isExpanded = expandedQuestion === item.questionId || isReselecting;

                                    return (
                                        <div
                                            key={item.questionId}
                                            className={`rounded-2xl border-2 transition-all overflow-hidden ${item.status === 'wrong'
                                                ? 'bg-rose-50/50 border-rose-200'
                                                : item.status === 'guessed'
                                                    ? 'bg-amber-50/50 border-amber-200'
                                                    : 'bg-emerald-50/30 border-emerald-200'
                                                }`}
                                        >
                                            <div
                                                className="p-4 cursor-pointer hover:bg-white/30 transition-colors"
                                                onClick={(e) => {
                                                    // 如果用户正在选择文本，不触发展开/收缩
                                                    const selection = window.getSelection();
                                                    if (selection && selection.toString().trim().length > 0) {
                                                        return;
                                                    }
                                                    setExpandedQuestion(isExpanded ? null : item.questionId);
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-slate-600 border border-slate-200 shadow-sm">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-700 font-serif">
                                                            {item.question}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'wrong'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : item.status === 'guessed'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                            {item.status === 'wrong' ? '错误' : item.status === 'guessed' ? '蒙对' : '正确'}
                                                        </div>
                                                        <ChevronDown
                                                            size={16}
                                                            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                        />
                                                    </div>
                                                </div>

                                                {!isReselecting && (
                                                    <div className="flex items-center gap-4 text-sm mt-2 ml-11">
                                                        <span className="text-slate-500">
                                                            我的答案: <span className={item.isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{item.studentAnswer}</span>
                                                        </span>
                                                        {!item.isCorrect && (
                                                            <span className="text-slate-500">
                                                                正确答案: <span className="text-emerald-600 font-bold">{item.correctAnswer}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-slate-200/50"
                                                    >
                                                        <div className="p-4 pt-3">
                                                            {isReselecting ? (
                                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                                    <div className="text-sm font-bold text-[#00B4EE] mb-3 flex items-center gap-2">
                                                                        <MousePointer2 size={16} />
                                                                        请重新选择正确答案
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {fullQuiz.options.map(opt => {
                                                                            const isSelected = selectedAnswer === opt.id;
                                                                            const isCorrectOption = opt.id === fullQuiz.correctAnswer;
                                                                            const isCorrectlySelected = isSelected && isCorrectOption;

                                                                            return (
                                                                                <button
                                                                                    key={opt.id}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleSelectAnswer(opt.id);
                                                                                    }}
                                                                                    disabled={coachingTaskCompleted}
                                                                                    className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all text-sm ${isCorrectlySelected
                                                                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                                                                        : isSelected && !isCorrectOption
                                                                                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                                                            : 'bg-white border-slate-200 text-slate-700 hover:border-[#00B4EE] hover:bg-blue-50/50'
                                                                                        } ${coachingTaskCompleted ? 'cursor-default' : 'cursor-pointer'}`}
                                                                                >
                                                                                    <div className="flex gap-3">
                                                                                        <span className="font-bold">{opt.id}.</span>
                                                                                        <span className="font-medium font-serif">{opt.text}</span>
                                                                                    </div>
                                                                                    {isCorrectlySelected && <CheckCircle2 size={18} className="text-emerald-600" />}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {renderQuestionOptions(fullQuiz, item)}

                                                                    {item.status === 'wrong' && coachingPhase > 0 && (
                                                                        <div className="mt-4 p-3 bg-rose-100/50 rounded-lg border border-rose-200">
                                                                            <div className="text-sm font-bold text-rose-700 mb-1">
                                                                                正在纠正中...
                                                                            </div>
                                                                            <div className="text-sm text-rose-600/80">
                                                                                阶段 {coachingPhase}/6: {currentPhaseConfig?.name}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>



                            {/* 复盘总结 */}
                            {coachingTaskType === 'review' && coachingTaskReceived && (
                                <div className="mt-8">
                                    <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Trophy size={24} className="text-amber-600" />
                                            <h3 className="text-lg font-bold text-amber-800">GPS 解题路径</h3>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 py-4">
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-2">
                                                    <span className="text-xl">1</span>
                                                </div>
                                                <div className="text-sm font-bold text-slate-700">圈 Why</div>
                                            </div>
                                            <div className="text-2xl text-slate-300">→</div>
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                                                    <span className="text-xl">2</span>
                                                </div>
                                                <div className="text-sm font-bold text-slate-700">找 Because</div>
                                            </div>
                                            <div className="text-2xl text-slate-300">→</div>
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                                                    <span className="text-xl">3</span>
                                                </div>
                                                <div className="text-sm font-bold text-slate-700">选 on sale</div>
                                            </div>
                                        </div>
                                        {!coachingTaskCompleted && (
                                            <button
                                                onClick={() => completeCoachingTask()}
                                                className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all"
                                            >
                                                ✓ 我学会了！
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 右侧 30% - 重新设计布局 */}
            <div className="flex-[3] flex flex-col h-full overflow-hidden">

                {/* 上方可滚动区域 */}
                <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pb-2">
                    {/* 视频窗口 - 支持跨阶段平滑动画 */}
                    <VideoWindow
                        layoutId="student-video"
                        className="relative w-full shrink-0 rounded-xl shadow-md"
                        placeholderText="老师视频连线中..."
                        style={{ border: '1px solid rgba(0, 180, 238, 0.4)' }}
                        videoStream={remoteStream}
                    />

                    {/* 任务区域 */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm"
                        style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}>
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                当前任务
                            </span>
                            {coachingPhase > 0 && (
                                <span className="text-xs font-bold text-[#00B4EE]">
                                    阶段 {coachingPhase}/6
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            {coachingPhase === 0 ? (
                                <div className="text-center py-4 text-slate-400 text-sm">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse mx-auto mb-2" />
                                    等待老师开始带练...
                                </div>
                            ) : !coachingTaskType ? (
                                <div className="text-center py-4 text-slate-400 text-sm">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse mx-auto mb-2" />
                                    等待老师发布任务...
                                </div>
                            ) : coachingTaskCompleted ? (
                                <div className="flex items-center gap-3 text-emerald-600">
                                    <CheckCircle2 size={20} />
                                    <span className="font-medium">任务已完成</span>
                                </div>
                            ) : coachingTaskReceived ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTaskIcon(coachingTaskType)}
                                        <span className="font-bold text-slate-700">
                                            {currentPhaseConfig?.name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {getTaskDescription(coachingTaskType)}
                                    </p>

                                    {coachingTaskType === 'voice' && (
                                        <button
                                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                                            disabled={isTranscribing}
                                            className={`mt-4 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isTranscribing
                                                ? 'bg-slate-300 text-slate-500 cursor-wait'
                                                : isRecording
                                                    ? 'bg-rose-500 text-white scale-[1.02] animate-pulse'
                                                    : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                                }`}
                                        >
                                            <Mic size={20} />
                                            {isTranscribing ? '识别中...' : isRecording ? '✓ 提交任务' : '点击开始录音'}
                                        </button>
                                    )}

                                    {/* 划词任务：显示已划词数量和提交按钮 */}
                                    {coachingTaskType === 'highlight' && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                                已划词 {studentHighlights.length} 处
                                                {studentHighlights.length === 0 && '（请在文章中选择文字并确认）'}
                                            </div>
                                            <button
                                                onClick={submitHighlightTask}
                                                disabled={studentHighlights.length === 0}
                                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${studentHighlights.length > 0
                                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Highlighter size={18} />
                                                完成划词并提交
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-2">
                                    <div className="text-center text-amber-600 text-sm animate-pulse">
                                        有新任务，请查看弹窗
                                    </div>
                                    <button
                                        onClick={handleReceiveTask}
                                        className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-bold"
                                    >
                                        手动接收任务
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 聊天窗 - 固定高度 */}
                <div className="h-64 shrink-0 mt-2">
                    <div className="flex flex-col bg-white border rounded-2xl overflow-hidden shadow-sm h-full"
                        style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                CHAT LOG
                            </span>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                            {messages.length === 0 && !studentHighlights.length ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                    <p className="text-xs">等待互动...</p>
                                </div>
                            ) : (
                                <>
                                    {studentHighlights.map((h, idx) => (
                                        <div key={`highlight-${idx}`} className="flex justify-end">
                                            <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-amber-100 text-amber-800">
                                                <div className="text-[10px] opacity-60 mb-0.5 font-semibold">我</div>
                                                画线: "{h.text}"
                                            </div>
                                        </div>
                                    ))}

                                    {messages.slice(-5).map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'student'
                                                    ? 'bg-[#00B4EE] text-white'
                                                    : msg.role === 'jarvis'
                                                        ? 'bg-cyan-50 text-cyan-800 border border-cyan-100'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}
                                            >
                                                <div className="text-[10px] opacity-60 mb-0.5 font-semibold">
                                                    {msg.role === 'jarvis' ? 'Jarvis' :
                                                        msg.role === 'student' ? '我' : '老师'}
                                                </div>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        <div className="border-t border-slate-200 p-2 bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="向老师提问..."
                                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-[#00B4EE] transition-colors"
                                />
                                <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
