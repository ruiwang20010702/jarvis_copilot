import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { VideoWindow } from '../../shared/VideoWindow';
import {
    Search, Highlighter, CheckCircle2, AlertCircle, X
} from 'lucide-react';

/**
 * 学生端实战阶段组件
 * StudentBattleView - 阅读文章、高亮标记、查词、答题
 */
export const StudentBattleView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const {
        remoteStream, // Get from store
        articleData,
        highlights,
        addHighlight,
        removeHighlight,
        lookups,
        addLookup,
        lookupLimit,
        quizAnswers,
        setQuizAnswer,
        setScrollProgress,
        setStage,
        vocabList  // 添加 vocabList 以响应状态变化
    } = useGameStore();

    const [selectionRect, setSelectionRect] = useState<{ top: number, left: number } | null>(null);
    const [selectedText, setSelectedText] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<{ paragraphIndex: number, startOffset: number, endOffset: number } | null>(null);
    const [lookupWord, setLookupWord] = useState<string | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [pendingAnswer, setPendingAnswer] = useState<{ questionId: number, optionId: string } | null>(null);
    const [clickedWord, setClickedWord] = useState<{ word: string, rect: DOMRect, paragraphIndex: number, startOffset: number } | null>(null);
    const articleRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭气泡
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPendingAnswer(null);
            }
        };

        if (pendingAnswer) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [pendingAnswer]);

    // 点击外部关闭单词工具栏
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-word-clickable]') && clickedWord) {
                setClickedWord(null);
            }
        };

        if (clickedWord) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [clickedWord]);

    const handleScroll = () => {
        if (articleRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = articleRef.current;
            const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setScrollProgress(progress);
        }
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setSelectionRect(null);
            setSelectedLocation(null);
            return;
        }

        const text = selection.toString().trim();
        if (text.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            let container = range.commonAncestorContainer;
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentElement!;
            }
            const paragraphElement = (container as Element).closest('[data-paragraph-index]');

            if (paragraphElement) {
                const paragraphIndex = parseInt(paragraphElement.getAttribute('data-paragraph-index') || '0');
                const paragraphText = articleData.paragraphs[paragraphIndex];

                let startOffset = 0;
                let endOffset = 0;

                try {
                    const paragraphRange = document.createRange();
                    paragraphRange.selectNodeContents(paragraphElement);
                    paragraphRange.setEnd(range.startContainer, range.startOffset);
                    startOffset = paragraphRange.toString().length;
                    endOffset = startOffset + text.length;
                } catch (e) {
                    startOffset = paragraphText.indexOf(text);
                    endOffset = startOffset + text.length;
                }

                setSelectionRect({
                    top: rect.top - 60,
                    left: rect.left + (rect.width / 2)
                });
                setSelectedText(text);
                setSelectedLocation({ paragraphIndex, startOffset, endOffset });
            }
        }
    };

    const confirmHighlight = () => {
        if (selectedText && selectedLocation) {
            const { paragraphIndex, startOffset, endOffset } = selectedLocation;
            // Check if there's an existing highlight at the exact same position
            const existingHighlight = highlights.find(h =>
                h.paragraphIndex === paragraphIndex &&
                h.startOffset === startOffset &&
                h.text.length === selectedText.length
            );

            if (existingHighlight) {
                // Toggle off - remove the highlight
                removeHighlight(existingHighlight.id);
            } else {
                // Check for overlapping highlights and handle them
                const overlappingHighlights = highlights.filter(h =>
                    h.paragraphIndex === paragraphIndex &&
                    !(h.startOffset + h.text.length <= startOffset || h.startOffset >= endOffset)
                );

                // Remove overlapping highlights
                overlappingHighlights.forEach(h => removeHighlight(h.id));

                // Add new highlight with precise position
                addHighlight(selectedText, paragraphIndex, startOffset);
            }
            setSelectionRect(null);
            setSelectedLocation(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    const confirmLookup = async () => {
        if (selectedText && lookups.length < lookupLimit && selectedLocation) {
            setIsLookingUp(true);
            setLookupWord(selectedText);
            // 获取包含该单词的段落作为上下文
            const context = articleData.paragraphs[selectedLocation.paragraphIndex] || '';
            await addLookup(selectedText, context, articleData.versionId);
            setIsLookingUp(false);
            setSelectionRect(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    const handleWordClick = (word: string, event: React.MouseEvent<HTMLSpanElement>, paragraphIndex: number, startOffset: number) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setClickedWord({ word, rect, paragraphIndex, startOffset });
    };

    const handleWordLookup = async () => {
        if (clickedWord && lookups.length < lookupLimit) {
            setIsLookingUp(true);
            setLookupWord(clickedWord.word);
            // 获取包含该单词的段落作为上下文
            const context = articleData.paragraphs[clickedWord.paragraphIndex] || '';
            await addLookup(clickedWord.word, context, articleData.versionId);
            setIsLookingUp(false);
            setClickedWord(null);
        }
    };

    const handleWordHighlight = () => {
        if (clickedWord) {
            // 检查高亮时同时比较 paragraphIndex 和 startOffset
            const existingHighlight = highlights.find(h =>
                h.paragraphIndex === clickedWord.paragraphIndex &&
                h.startOffset === clickedWord.startOffset &&
                h.text.length === clickedWord.word.length
            );

            if (existingHighlight) {
                removeHighlight(existingHighlight.id);
            } else {
                addHighlight(clickedWord.word, clickedWord.paragraphIndex, clickedWord.startOffset);
            }
            setClickedWord(null);
        }
    };

    const renderParagraph = (text: string, paragraphIndex: number) => {
        // 获取当前段落的高亮，按 startOffset 排序
        const paragraphHighlights = highlights
            .filter(h => h.paragraphIndex === paragraphIndex)
            .sort((a, b) => a.startOffset - b.startOffset);

        // 基于位置构建文本片段
        const segments: Array<{ text: string, isHighlight: boolean, startOffset: number }> = [];
        let currentOffset = 0;

        paragraphHighlights.forEach(h => {
            // 添加高亮前的普通文本
            if (h.startOffset > currentOffset) {
                segments.push({
                    text: text.slice(currentOffset, h.startOffset),
                    isHighlight: false,
                    startOffset: currentOffset
                });
            }
            // 添加高亮文本
            const endOffset = h.startOffset + h.text.length;
            segments.push({
                text: text.slice(h.startOffset, endOffset),
                isHighlight: true,
                startOffset: h.startOffset
            });
            currentOffset = endOffset;
        });

        // 添加最后一段普通文本
        if (currentOffset < text.length) {
            segments.push({
                text: text.slice(currentOffset),
                isHighlight: false,
                startOffset: currentOffset
            });
        }

        // 如果没有高亮，整段都是普通文本
        if (segments.length === 0) {
            segments.push({ text, isHighlight: false, startOffset: 0 });
        }

        // Helper to render tokens within a segment (for click-to-lookup)
        const renderTokens = (segmentText: string, isSegmentHighlighted: boolean, segmentStartOffset: number) => {
            const tokens: Array<{ text: string, isWord: boolean, offset: number }> = [];
            const regex = /([a-zA-Z'-]+)|([^a-zA-Z'-]+)/g;
            let match;
            let localOffset = 0;

            while ((match = regex.exec(segmentText)) !== null) {
                const [fullMatch, word, nonWord] = match;
                if (word) {
                    tokens.push({ text: word, isWord: true, offset: segmentStartOffset + localOffset });
                } else if (nonWord) {
                    tokens.push({ text: nonWord, isWord: false, offset: segmentStartOffset + localOffset });
                }
                localOffset += fullMatch.length;
            }

            return tokens.map((token, idx) => {
                if (token.isWord) {
                    return (
                        <span
                            key={idx}
                            data-word-clickable="true"
                            onClick={(e) => handleWordClick(token.text, e, paragraphIndex, token.offset)}
                            className={`cursor-pointer rounded px-0.5 transition-colors inline-block ${isSegmentHighlighted ? 'hover:bg-yellow-300' : 'hover:bg-[#00B4EE]/10'
                                }`}
                            title={isSegmentHighlighted ? '已高亮 - 点击操作' : '点击查词或高亮'}
                        >
                            {token.text}
                        </span>
                    );
                } else {
                    return <span key={idx}>{token.text}</span>;
                }
            });
        };

        return (
            <p data-paragraph-index={paragraphIndex} className="mb-8 text-lg leading-loose text-slate-700 font-serif">
                {segments.map((segment, i) => (
                    <span
                        key={i}
                        className={segment.isHighlight ? "bg-yellow-200 rounded px-0.5 transition-colors" : ""}
                    >
                        {renderTokens(segment.text, segment.isHighlight, segment.startOffset)}
                    </span>
                ))}
            </p>
        );
    };

    return (
        <div className="flex h-full w-full bg-white">
            {/* 点击单词后的浮动工具栏 */}
            <AnimatePresence>
                {clickedWord && (() => {
                    // Check if the clicked word has an existing highlight at the exact position
                    const existingHighlight = highlights.find(h =>
                        h.paragraphIndex === clickedWord.paragraphIndex &&
                        h.startOffset === clickedWord.startOffset &&
                        h.text.length === clickedWord.word.length
                    );

                    const isHighlighted = !!existingHighlight;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed z-[100] -translate-x-1/2 bg-slate-900 text-white rounded-full shadow-2xl flex items-center p-1.5 gap-1"
                            style={{
                                left: `${clickedWord.rect.left + clickedWord.rect.width / 2}px`,
                                top: `${clickedWord.rect.top - 60}px`
                            }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isHighlighted && existingHighlight) {
                                        removeHighlight(existingHighlight.id);
                                    } else {
                                        addHighlight(clickedWord.word, clickedWord.paragraphIndex, clickedWord.startOffset);
                                    }
                                    setClickedWord(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 rounded-full transition-colors text-xs font-bold"
                            >
                                {isHighlighted ? (
                                    <>
                                        <X size={14} className="text-red-400" />
                                        取消高亮
                                    </>
                                ) : (
                                    <>
                                        <Highlighter size={14} className="text-yellow-400" />
                                        高亮
                                    </>
                                )}
                            </button>

                            <div className="w-px h-4 bg-white/20" />

                            <button
                                onClick={handleWordLookup}
                                disabled={lookups.length >= lookupLimit}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-bold ${lookups.length >= lookupLimit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                                    }`}
                            >
                                <Search size={14} className="text-cyan-400" />
                                释义
                            </button>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            <AnimatePresence>
                {selectionRect && selectedLocation && (() => {
                    // Check if there's an existing highlight at the exact position
                    const existingHighlight = highlights.find(h =>
                        h.paragraphIndex === selectedLocation.paragraphIndex &&
                        h.startOffset === selectedLocation.startOffset &&
                        h.text.length === selectedText.length
                    );
                    const isHighlighted = !!existingHighlight;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ top: selectionRect.top, left: selectionRect.left }}
                            className="fixed z-[100] -translate-x-1/2 bg-slate-900 text-white rounded-full shadow-2xl flex items-center p-1.5 gap-1"
                        >
                            <button
                                onClick={confirmHighlight}
                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 rounded-full transition-colors text-xs font-bold"
                            >
                                {isHighlighted ? (
                                    <>
                                        <X size={14} className="text-red-400" />
                                        取消高亮
                                    </>
                                ) : (
                                    <>
                                        <Highlighter size={14} className="text-yellow-400" />
                                        高亮
                                    </>
                                )}
                            </button>
                            <div className="w-px h-4 bg-white/20" />
                            <button
                                onClick={confirmLookup}
                                disabled={lookups.length >= lookupLimit}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-bold ${lookups.length >= lookupLimit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                                    }`}
                            >
                                <Search size={14} className="text-cyan-400" />
                                释义
                            </button>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            <div className="flex-1 h-full overflow-y-auto bg-white relative flex flex-col">
                <div
                    ref={articleRef}
                    onScroll={handleScroll}
                    onMouseUp={handleMouseUp}
                    className="flex-1 px-8 py-12"
                >
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl font-bold text-slate-900 mb-10 font-serif leading-tight">{articleData.title}</h1>
                        {articleData.paragraphs.map((para, i) => (
                            <div key={i}>{renderParagraph(para, i)}</div>
                        ))}
                        <div className="h-32" />
                    </div>
                </div>
            </div>

            {/* 右侧边栏 */}
            <div className="w-[420px] h-full border-l border-slate-100 bg-gradient-to-b from-slate-50/30 to-white flex flex-col shrink-0 p-6">
                {/* 视频窗口 - 支持跨阶段平滑动画 */}
                <VideoWindow
                    layoutId="student-video"
                    className="relative w-full shrink-0 mb-6 rounded-xl shadow-md"
                    placeholderText="老师视频连线中..."
                    videoStream={remoteStream}
                />
                {/* 答题卡区域 */}
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
                    <div className="h-12 px-5 flex items-center justify-between shrink-0 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">答题进度</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: '#00B4EE', backgroundColor: 'rgba(0, 180, 238, 0.1)', borderColor: '#00B4EE' }}>
                            {quizAnswers.length}/{articleData.quiz.length} 已答
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {articleData.quiz.map((q, idx) => {
                            const answer = quizAnswers.find(a => a.questionId === q.id);
                            return (
                                <div key={q.id} className="group">
                                    <div className="flex gap-4 mb-4">
                                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-200 shadow-sm">
                                            {idx + 1}
                                        </span>
                                        <p className="text-sm font-semibold text-slate-700 leading-relaxed pt-1 font-serif">{q.question}</p>
                                    </div>
                                    <div className="space-y-2.5 pl-11">
                                        {q.options.map(opt => {
                                            const isSelected = answer?.optionId === opt.id;
                                            const isPending = pendingAnswer?.questionId === q.id && pendingAnswer?.optionId === opt.id;
                                            const isConfirmed = isSelected && !isPending;

                                            return (
                                                <div key={opt.id} className="relative" style={{ zIndex: isPending ? 9999 : 'auto' }}>
                                                    <button
                                                        data-option-id={opt.id}
                                                        onClick={() => setPendingAnswer({ questionId: q.id, optionId: opt.id })}
                                                        className={`w-full text-left text-sm py-3 px-4 rounded-xl border transition-all shadow-sm ${isConfirmed ? 'text-white' : isPending ? 'text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                                                            }`}
                                                        style={isConfirmed ? {
                                                            borderColor: '#00B4EE',
                                                            backgroundColor: '#00B4EE',
                                                            boxShadow: '0 4px 6px rgba(0, 180, 238, 0.2)'
                                                        } : isPending ? {
                                                            borderColor: '#00B4EE',
                                                            backgroundColor: 'rgba(0, 180, 238, 0.1)',
                                                            boxShadow: '0 2px 4px rgba(0, 180, 238, 0.1)'
                                                        } : {}}
                                                    >
                                                        <span className={`font-bold mr-3 ${isConfirmed ? 'text-white' : isPending ? '' : 'text-slate-400'}`} style={isPending && !isConfirmed ? { color: '#00B4EE' } : {}}>{opt.id}</span>
                                                        <span className="font-serif">{opt.text}</span>
                                                    </button>

                                                    {isPending && (
                                                        <motion.div
                                                            ref={popoverRef}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute left-0 bottom-full mb-2 w-full"
                                                            style={{ zIndex: 9999 }}
                                                        >
                                                            <div className="rounded-lg shadow-lg p-1.5 flex gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setQuizAnswer(q.id, opt.id, false);
                                                                        setPendingAnswer(null);
                                                                    }}
                                                                    className="flex-1 py-1.5 px-2.5 text-white rounded-md font-bold text-xs hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                                                                    style={{ backgroundColor: '#00B4EE' }}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                    确定
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setQuizAnswer(q.id, opt.id, true);
                                                                        setPendingAnswer(null);
                                                                    }}
                                                                    className="flex-1 py-1.5 px-2.5 rounded-md font-bold text-xs hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                                                                    style={{ backgroundColor: '#FDE700', color: '#1A1A1A' }}
                                                                >
                                                                    <AlertCircle size={14} />
                                                                    不确定
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {isConfirmed && answer?.isUnsure && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full shadow-lg flex items-center gap-1"
                                                            style={{ backgroundColor: '#FDE700', color: '#1A1A1A' }}
                                                        >
                                                            <AlertCircle size={12} />
                                                            不确定
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                        <button
                            onClick={() => setShowSubmitConfirm(true)}
                            className="w-full py-3.5 bg-gradient-to-r from-[#00C3FF] to-[#0088FF] text-white rounded-full font-bold text-sm hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all"
                        >
                            提交答案
                        </button>
                    </div>
                </div>
            </div>

            {/* 单词定义弹窗 */}
            <AnimatePresence>
                {lookupWord && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-[500px]"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ borderWidth: '2px', borderColor: '#00B4EE' }}>
                            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(to right, #00B4EE, #0088CC)' }}>
                                <div className="flex items-center gap-3">
                                    <Search className="text-white" size={20} />
                                    <h3 className="text-white font-bold text-lg">单词释义</h3>
                                </div>

                                <motion.div
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}
                                >
                                    <div className="flex gap-1">
                                        {Array.from({ length: lookupLimit }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: i < lookups.length ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF' }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-white text-xs font-bold">{lookupLimit - lookups.length}/{lookupLimit}</span>
                                </motion.div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">单词</div>
                                    <div className="text-2xl font-bold text-slate-900">{lookupWord}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">释义</div>
                                    <div className="text-slate-700 leading-relaxed">
                                        {isLookingUp ? (
                                            <div className="flex items-center gap-2 text-cyan-600 font-medium">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Search size={16} />
                                                </motion.div>
                                                Jarvis 正在分析单词...
                                            </div>
                                        ) : (
                                            (() => {
                                                const vocabItem = vocabList.find(v => v.word.toLowerCase() === lookupWord.toLowerCase());
                                                if (vocabItem) {
                                                    return (
                                                        <div className="space-y-2">
                                                            <div className="text-lg font-medium text-slate-800">{vocabItem.definition}</div>
                                                            {vocabItem.phonetic && (
                                                                <div className="text-sm text-slate-500 font-serif">{vocabItem.phonetic}</div>
                                                            )}
                                                            {vocabItem.mnemonic && (
                                                                <div className="mt-3 p-3 bg-amber-50 rounded-xl text-sm text-amber-800 border border-amber-100 italic">
                                                                    {vocabItem.mnemonic}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return `"${lookupWord}" 的定义加载中...`;
                                            })()
                                        )}
                                    </div>
                                </div>

                                {lookupLimit - lookups.length <= 1 && (
                                    <div
                                        className="flex items-center gap-2 p-3 rounded-xl"
                                        style={{ backgroundColor: lookupLimit - lookups.length === 0 ? 'rgba(148, 163, 184, 0.1)' : 'rgba(253, 231, 0, 0.15)' }}
                                    >
                                        <AlertCircle size={18} style={{ color: lookupLimit - lookups.length === 0 ? '#94A3B8' : '#B39B00' }} />
                                        <span className="text-xs font-bold" style={{ color: lookupLimit - lookups.length === 0 ? '#64748B' : '#B39B00' }}>
                                            {lookupLimit - lookups.length === 0 ? '查词次数已用完，请谨慎作答' : '最后 1 次查词机会！请珍惜使用'}
                                        </span>
                                    </div>
                                )}

                                <button
                                    onClick={() => setLookupWord(null)}
                                    className="w-full py-3 text-white rounded-full font-bold hover:shadow-lg active:scale-[0.98] transition-all"
                                    style={{ background: 'linear-gradient(to right, #00B4EE, #0088CC)', boxShadow: '0 4px 14px rgba(0, 180, 238, 0.2)' }}
                                >
                                    确认
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 提交答案二次确认弹窗 */}
            <AnimatePresence>
                {showSubmitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center"
                        onClick={() => setShowSubmitConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-[380px]"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                                <div className="p-6 text-center">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#00A0E9] to-[#0088CC] rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="text-white" size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">确认提交答案？</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                        提交后将进入带练环节，老师会为你详细讲解错题和重点内容。
                                    </p>

                                    <div className="bg-slate-50 rounded-xl p-3 mb-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-slate-600">答题情况</span>
                                            <span className="text-sm font-bold text-slate-900">
                                                {quizAnswers.length}/{articleData.quiz.length} 题
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600">不确定的题目</span>
                                            <span className="text-sm font-bold text-orange-600">
                                                {quizAnswers.filter(a => a.isUnsure).length} 题
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowSubmitConfirm(false)}
                                            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-full text-sm font-bold hover:bg-slate-200 active:scale-[0.98] transition-all"
                                        >
                                            再检查一下
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowSubmitConfirm(false);
                                                setStage('coaching');
                                            }}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-[#00A0E9] to-[#0088CC] text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/30 active:scale-[0.98] transition-all"
                                        >
                                            确认提交
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

