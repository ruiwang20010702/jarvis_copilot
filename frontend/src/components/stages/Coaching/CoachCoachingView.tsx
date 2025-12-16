import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    BookOpen, X, CheckCircle2, Sparkles,
    Send, Mic, Highlighter, MousePointer2,
    Navigation, Trophy, ChevronRight, BarChart3, HelpCircle, ChevronDown
} from 'lucide-react';
import {
    COACHING_DEMO_QUESTION,
    DEMO_QUIZ_ANALYSIS,
    getPhaseConfig,
    generateQuizAnalysis,
    QuizAnalysis
} from './config';

export const CoachCoachingView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const {
        articleData,
        quizAnswers,
        focusParagraphIndex,
        setFocusParagraph,
        coachingPhase,
        coachingTaskType,
        coachingTaskReceived,
        coachingTaskCompleted,
        teacherHighlights,
        publishCoachingTask,
        advanceCoachingPhase,
        addTeacherHighlight,
        setCoachingPhase,
        studentHighlights,
        highlights, // 实战阶段的做题痕迹
        addMessage,
        messages,
        remoteStream
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<'article' | 'analysis'>('analysis');
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [selectionInfo, setSelectionInfo] = useState<{ top: number; left: number } | null>(null);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const [jarvisAnalysis, setJarvisAnalysis] = useState<string | null>(null);

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
        // Fallback 到 demo 数据（用于开发预览）
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
        // Fallback - 保持原有兼容性
        return [];
    }, [articleData.quiz, quizAnswers]);

    // 当前阶段配置
    const currentPhaseConfig = getPhaseConfig(coachingPhase);

    // AI 生成的话术
    const [aiScript, setAiScript] = useState<string | null>(null);
    const [aiScriptLoading, setAiScriptLoading] = useState(false);

    // 获取当前错题信息和序号
    const { currentWrongQuestion, questionIndex } = useMemo(() => {
        const wrongItem = quizAnalysis.find(q => q.status === 'wrong');
        if (wrongItem) {
            const quiz = articleData.quiz.find(q => q.id === wrongItem.questionId);
            const index = articleData.quiz.findIndex(q => q.id === wrongItem.questionId) + 1;
            return {
                currentWrongQuestion: quiz ? { ...quiz, studentAnswer: wrongItem.studentAnswer } : null,
                questionIndex: index
            };
        }
        return { currentWrongQuestion: null, questionIndex: 0 };
    }, [quizAnalysis, articleData.quiz]);

    // 加载 AI 话术（当 phase 变化或进入 coaching 时）
    useEffect(() => {
        const loadAiScript = async () => {
            if (!currentWrongQuestion || coachingPhase < 1) {
                setAiScript(null);
                return;
            }

            setAiScriptLoading(true);
            try {
                const { generateCoachingScript } = await import('../../../../src/services/apiService');
                const result = await generateCoachingScript({
                    question_id: currentWrongQuestion.id,
                    student_answer: currentWrongQuestion.studentAnswer,
                    phase: coachingPhase,
                    student_level: 'L0',
                    student_name: 'Alex',
                    question_index: questionIndex
                });
                setAiScript(result.script);
            } catch (error) {
                console.error('[Coaching] Failed to load AI script:', error);
                // Fallback 到配置中的固定话术
                setAiScript(null);
            } finally {
                setAiScriptLoading(false);
            }
        };

        loadAiScript();
    }, [coachingPhase, currentWrongQuestion, questionIndex]);

    // 判断是否可以发布任务
    const canPublishTask = coachingPhase > 0 && !coachingTaskType;

    // 监听任务完成，触发Jarvis分析
    useEffect(() => {
        if (coachingTaskCompleted && coachingTaskType) {
            // Mock Jarvis分析
            if (coachingTaskType === 'highlight') {
                setJarvisAnalysis("Alex 画线正确！他找到了关键句 'it was on sale'。\n\n建议话术：「很好！你找到了重点，这就是答案的依据。」");
            } else if (coachingTaskType === 'voice') {
                setJarvisAnalysis("Alex 回答：「我选A是因为原文说了beautiful...」\n\n分析：学生被干扰项迷惑了。建议引导他关注逻辑词 Why → Because。");
            } else if (coachingTaskType === 'gps') {
                setJarvisAnalysis("Alex 已装备GPS卡！\n\n建议话术：「很好，现在让我们用三步法来解决这道题。」");
            } else if (coachingTaskType === 'select') {
                setJarvisAnalysis("Alex 改选了正确答案 B！\n\n建议话术：「太棒了！你看，只要找到Because，答案就藏在后面。」");
            }
        }
    }, [coachingTaskCompleted, coachingTaskType]);

    // 处理教师画线
    const handleTeacherTextSelection = () => {
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

    // 确认画线
    const confirmHighlight = () => {
        if (selectedText) {
            addTeacherHighlight({
                paragraphIndex: focusParagraphIndex || 0,
                startOffset: 0,
                endOffset: selectedText.length,
                text: selectedText
            });
        }
        setSelectionInfo(null);
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
    };

    // 处理任务发布
    const handlePublishTask = () => {
        if (currentPhaseConfig) {
            publishCoachingTask(currentPhaseConfig.taskType);
            setJarvisAnalysis(null); // 清除之前的分析
        }
    };

    // 处理进入下一阶段
    const handleNextPhase = () => {
        if (coachingPhase === 0) {
            setCoachingPhase(1);
        } else if (coachingPhase < 6) {
            advanceCoachingPhase();
        }
        setJarvisAnalysis(null);
    };

    // 获取任务类型图标
    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'voice': return <Mic size={16} />;
            case 'highlight': return <Highlighter size={16} />;
            case 'select': return <MousePointer2 size={16} />;
            case 'gps': return <Navigation size={16} />;
            case 'review': return <Trophy size={16} />;
            default: return <Send size={16} />;
        }
    };

    // 渲染文章段落（带高亮 - 包括实战阶段痕迹）
    const renderParagraphWithHighlights = (para: string, paraIndex: number) => {
        const isFocused = focusParagraphIndex === paraIndex;

        let content: React.ReactNode = para;

        // 1. 先渲染实战阶段的黄色高亮（做题痕迹）
        highlights.forEach(h => {
            if (para.includes(h.text)) {
                const parts = para.split(h.text);
                content = (
                    <>
                        {parts[0]}
                        <span className="bg-yellow-200/60 text-yellow-900 px-0.5 rounded" title="实战阶段标记">
                            {h.text}
                        </span>
                        {parts.slice(1).join(h.text)}
                    </>
                );
            }
        });

        // 2. 渲染教师红色画线
        teacherHighlights.forEach(h => {
            if (h.paragraphIndex === paraIndex && para.includes(h.text)) {
                const parts = para.split(h.text);
                content = (
                    <>
                        {parts[0]}
                        <span className="bg-red-200 text-red-900 px-0.5 rounded underline decoration-red-500 decoration-2">
                            {h.text}
                        </span>
                        {parts.slice(1).join(h.text)}
                    </>
                );
            }
        });

        // 3. 渲染学生带练阶段的画线
        studentHighlights.forEach(h => {
            if (h.paragraphIndex === paraIndex && para.includes(h.text)) {
                const parts = para.split(h.text);
                content = (
                    <>
                        {parts[0]}
                        <span className="bg-amber-300 text-amber-900 px-0.5 rounded font-medium">
                            {h.text}
                        </span>
                        {parts.slice(1).join(h.text)}
                    </>
                );
            }
        });

        return (
            <div
                key={paraIndex}
                onClick={() => setFocusParagraph(isFocused ? null : paraIndex)}
                className={`mb-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border ${isFocused
                    ? 'bg-blue-50/50 border-[#00B4EE]/30 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-50'
                    }`}
            >
                <p className={`text-base leading-relaxed font-serif transition-colors ${isFocused ? 'text-slate-800 font-medium' : 'text-slate-500'
                    }`}>
                    {content}
                </p>
            </div>
        );
    };

    // 渲染题目选项
    const renderQuestionOptions = (quiz: typeof fullQuizOptions[0], analysis: typeof quizAnalysis[0]) => {
        return (
            <div className="mt-3 space-y-2">
                {quiz.options.map(opt => {
                    const isStudentAnswer = opt.id === quiz.studentAnswer;
                    const isCorrect = opt.id === quiz.correctAnswer;
                    const optionIsCorrect = 'isCorrect' in opt ? opt.isCorrect : (opt.id === quiz.correctAnswer);

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
                                <span className="text-xs font-bold text-rose-500">你的选择</span>
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
        <main className="h-full w-full flex bg-gray-50 p-6 gap-6 overflow-hidden">
            {/* 左侧 70% - 文章 + 题目分析 */}
            <div className="flex-[7] bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col"
                style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}>

                {/* 顶部Tab切换 */}
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

                    {/* 实战痕迹提示 */}
                    {highlights.length > 0 && (
                        <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            有 {highlights.length} 处实战标记
                        </span>
                    )}
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-6" onMouseUp={handleTeacherTextSelection}>
                    {activeTab === 'article' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-serif">
                                {articleData.title}
                            </h2>
                            {articleData.paragraphs.map((para, i) => renderParagraphWithHighlights(para, i))}

                            {/* Demo题目对应的文章内容 */}
                            <div className="mt-8 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                <div className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider">
                                    错题相关段落 (Demo)
                                </div>
                                <p className="text-base leading-relaxed font-serif text-slate-700">
                                    {COACHING_DEMO_QUESTION.article}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
                            {/* 做题分析标题 */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">做题分析报告</h2>
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

                            {/* 题目列表（可展开，显示完整选项） */}
                            <div className="space-y-4">
                                {quizAnalysis.map((item, idx) => {
                                    const fullQuiz = fullQuizOptions[idx];
                                    if (!fullQuiz) return null; // 安全检查
                                    const isExpanded = expandedQuestion === item.questionId;

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
                                            {/* 题目头部 - 可点击展开 */}
                                            <div
                                                className="p-4 cursor-pointer hover:bg-white/30 transition-colors"
                                                onClick={() => setExpandedQuestion(isExpanded ? null : item.questionId)}
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

                                                {/* 简要答案对比 */}
                                                <div className="flex items-center gap-4 text-sm mt-2 ml-11">
                                                    <span className="text-slate-500">
                                                        你的答案: <span className={item.isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{item.studentAnswer}</span>
                                                    </span>
                                                    {!item.isCorrect && (
                                                        <span className="text-slate-500">
                                                            正确答案: <span className="text-emerald-600 font-bold">{item.correctAnswer}</span>
                                                        </span>
                                                    )}
                                                    {item.isGuessed && (
                                                        <span className="text-amber-600 text-xs">(标记了不确定)</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 展开的选项详情 */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-slate-200/50"
                                                    >
                                                        <div className="p-4 pt-3">
                                                            {renderQuestionOptions(fullQuiz, item)}

                                                            {/* 错题纠正状态 */}
                                                            {item.status === 'wrong' && (
                                                                <div className="mt-4 p-3 bg-rose-100/50 rounded-lg border border-rose-200">
                                                                    <div className="text-sm font-bold text-rose-700 mb-1">
                                                                        当前正在精准纠错
                                                                    </div>
                                                                    <div className="text-sm text-rose-600/80">
                                                                        阶段 {coachingPhase}/6: {currentPhaseConfig?.name || '准备开始'}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 画线确认浮窗 */}
            <AnimatePresence>
                {selectionInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ top: selectionInfo.top, left: selectionInfo.left }}
                        className="fixed z-50 -translate-x-1/2 bg-red-600 text-white rounded-full shadow-xl px-4 py-2 flex items-center gap-2"
                    >
                        <Highlighter size={16} />
                        <button onClick={confirmHighlight} className="font-bold text-sm">
                            确认画线（红色）
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 右侧 30% - 重新设计布局：上方可滚动，聊天窗固定 */}
            <div className="flex-[3] flex flex-col h-full overflow-hidden">

                {/* 上方可滚动区域 */}
                <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pb-2">
                    {/* 视频窗口 - 支持跨阶段平滑动画 */}
                    <VideoWindow
                        layoutId="coach-video"
                        className="relative w-full shrink-0 rounded-xl shadow-md"
                        style={{ border: '1px solid rgba(0, 180, 238, 0.4)' }}
                        videoStream={remoteStream}
                    />

                    {/* Jarvis 助教 */}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl overflow-hidden shadow-sm"
                        style={{ border: '1px solid rgba(0, 180, 238, 0.25)' }}>
                        <div className="px-4 py-3 border-b border-cyan-100 bg-white/50 flex items-center gap-2">
                            <Sparkles size={16} className="text-[#00B4EE]" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Jarvis 助教
                            </span>
                            {coachingPhase > 0 && (
                                <span className="ml-auto text-xs font-bold text-[#00B4EE]">
                                    {coachingPhase}/6
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            {coachingPhase === 0 ? (
                                <div className="text-sm text-slate-600">
                                    <div className="font-bold text-slate-800 mb-2">准备开始精准带练</div>
                                    <p className="text-slate-500 leading-relaxed">
                                        Alex 有 1 道错题需要纠正。点击下方按钮开始6步苏格拉底式教学。
                                    </p>
                                </div>
                            ) : (
                                <div className="text-sm space-y-3">
                                    {/* 当前阶段指导 */}
                                    {currentPhaseConfig && (
                                        <div>
                                            <div className="font-bold text-[#00B4EE] mb-2">
                                                {currentPhaseConfig.jarvisTitle}
                                            </div>
                                            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                                                {aiScriptLoading ? (
                                                    <span className="text-slate-400">✨ Jarvis 正在思考...</span>
                                                ) : (
                                                    aiScript || currentPhaseConfig.jarvisScript
                                                )}
                                            </p>
                                            {currentPhaseConfig.jarvisAction && !jarvisAnalysis && (
                                                <div className="text-xs text-slate-500 bg-white/50 rounded-lg p-2 mt-2">
                                                    {currentPhaseConfig.jarvisAction}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Jarvis 分析反馈 */}
                                    {jarvisAnalysis && (
                                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <div className="text-xs font-bold text-emerald-700 mb-1">📊 学生反馈分析</div>
                                            <p className="text-sm text-emerald-800 whitespace-pre-line">
                                                {jarvisAnalysis}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 任务发布按钮 */}
                    <div className="space-y-2">
                        {coachingPhase === 0 ? (
                            <button
                                onClick={handleNextPhase}
                                className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}
                            >
                                <ChevronRight size={20} />
                                开始精准带练
                            </button>
                        ) : (
                            <>
                                {!coachingTaskType && (
                                    <button
                                        onClick={handlePublishTask}
                                        disabled={!canPublishTask}
                                        className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: 'linear-gradient(135deg, #00B4EE 0%, #0088CC 100%)' }}
                                    >
                                        {currentPhaseConfig && getTaskIcon(currentPhaseConfig.taskType)}
                                        发布任务: {currentPhaseConfig?.name}
                                    </button>
                                )}

                                {coachingTaskType && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm">
                                                {getTaskIcon(coachingTaskType)}
                                                <span className="font-medium text-slate-700">
                                                    {currentPhaseConfig?.name}
                                                </span>
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${coachingTaskCompleted
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : coachingTaskReceived
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {coachingTaskCompleted
                                                    ? '✓ 已完成'
                                                    : coachingTaskReceived
                                                        ? '进行中...'
                                                        : '等待接收'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {coachingTaskCompleted && coachingPhase < 6 && (
                                    <button
                                        onClick={handleNextPhase}
                                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <ChevronRight size={18} />
                                        进入下一阶段
                                    </button>
                                )}

                                {coachingPhase === 6 && coachingTaskCompleted && (
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                                        <Trophy size={24} className="text-emerald-600 mx-auto mb-2" />
                                        <div className="font-bold text-emerald-700">6步教学完成！</div>
                                        <div className="text-sm text-emerald-600">Alex 已掌握正确解题方法</div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* 阶段进度指示器 */}
                        {coachingPhase > 0 && (
                            <div className="flex justify-center gap-1.5 pt-2">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-all ${i < coachingPhase
                                            ? 'bg-emerald-500'
                                            : i === coachingPhase
                                                ? 'bg-[#00B4EE] scale-125'
                                                : 'bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
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
                                    <p className="text-xs">等待学生互动...</p>
                                </div>
                            ) : (
                                <>
                                    {/* 显示学生画线内容（学生是对方，显示在左侧） */}
                                    {studentHighlights.map((h, idx) => (
                                        <div key={`highlight-${idx}`} className="flex justify-start">
                                            <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-amber-100 text-amber-800">
                                                <div className="text-[10px] opacity-60 mb-0.5 font-semibold">Alex 画线</div>
                                                "{h.text}"
                                            </div>
                                        </div>
                                    ))}

                                    {/* 普通消息 */}
                                    {messages.slice(-5).map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.role === 'coach' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'coach'
                                                    ? 'bg-[#00B4EE] text-white'
                                                    : msg.role === 'jarvis'
                                                        ? 'bg-cyan-50 text-cyan-800 border border-cyan-100'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}
                                            >
                                                <div className="text-[10px] opacity-60 mb-0.5 font-semibold">
                                                    {msg.role === 'jarvis' ? 'Jarvis' :
                                                        msg.role === 'coach' ? 'You' : 'Alex'}
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
                                    placeholder="给学生留言..."
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
        </main>
    );
};
