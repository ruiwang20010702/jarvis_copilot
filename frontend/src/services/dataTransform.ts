/**
 * Data Transform Service - 后端数据格式转换为前端格式
 */

import type {
    ApiVersion,
    ApiQuestion,
    ApiSentenceSurgery,
    ApiVocabCard,
    VocabLookupResult
} from './apiService';
import type { QuizQuestion, QuizOption, VocabItem, SentenceChunk } from '../../store';

/**
 * 转换后端 Question 为前端 QuizQuestion
 * 
 * 后端格式: options = ["A. The coach is strict.", "B. The team is strong."]
 * 前端格式: options = [{ id: "A", text: "The coach is strict." }, ...]
 */
export function transformQuestion(apiQuestion: ApiQuestion): QuizQuestion {
    return {
        id: apiQuestion.id,
        question: apiQuestion.stem,
        options: apiQuestion.options.map(parseOption),
        correctOption: apiQuestion.correct_answer,
        relatedParagraphIndices: apiQuestion.related_paragraph_indices || [],
    };
}

/**
 * 解析选项字符串 "A. The coach is strict." -> { id: "A", text: "The coach is strict." }
 */
function parseOption(optionStr: string): QuizOption {
    const match = optionStr.match(/^([A-D])\.\s*(.+)$/);
    if (match) {
        return { id: match[1], text: match[2] };
    }
    // Fallback: 如果格式不匹配，使用第一个字符作为 id
    return { id: optionStr.charAt(0), text: optionStr };
}

// ============ Version Transform ============

/**
 * 转换后端 Version 为前端 articleData
 */
export function transformVersion(apiVersion: ApiVersion): {
    versionId: number;
    title: string;
    paragraphs: string[];
    quiz: QuizQuestion[];
} {
    return {
        versionId: apiVersion.id,
        title: apiVersion.title || '',
        paragraphs: splitParagraphs(apiVersion.content),
        quiz: apiVersion.questions.map(transformQuestion),
    };
}

/**
 * 按段落拆分文章内容
 */
function splitParagraphs(content: string): string[] {
    return content
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(Boolean);
}

// ============ Surgery Transform ============

/**
 * 转换后端 chunks_visual 为前端 SentenceChunk[]
 * 
 * 后端格式: { core: ["The coach", "won"], modifier: ["that trained..."] }
 * 前端格式: [{ id: "c1", text: "The coach", type: "core" }, ...]
 */
export function transformChunksVisual(
    chunksVisual: { core: string[]; modifier: string[] } | null
): SentenceChunk[] {
    if (!chunksVisual) return [];

    const result: SentenceChunk[] = [];

    // 转换 core 部分
    chunksVisual.core.forEach((text, index) => {
        result.push({
            id: `c${index + 1}`,
            text,
            type: 'core',
            isRemoved: false,
        });
    });

    // 转换 modifier 部分
    chunksVisual.modifier.forEach((text, index) => {
        result.push({
            id: `m${index + 1}`,
            text,
            type: 'modifier',
            isRemoved: false,
        });
    });

    return result;
}

/**
 * 按原句顺序排列 chunks
 * 需要根据文本在原句中的位置排序
 */
export function sortChunksByPosition(
    chunks: SentenceChunk[],
    originalSentence: string
): SentenceChunk[] {
    return [...chunks].sort((a, b) => {
        const posA = originalSentence.indexOf(a.text);
        const posB = originalSentence.indexOf(b.text);
        return posA - posB;
    });
}

/**
 * 完整转换难句数据
 */
export function transformSentenceSurgery(surgery: ApiSentenceSurgery): {
    originalSentence: string;
    translation: string;
    chunks: SentenceChunk[];
    coreSentence: string;
    coachScript: Record<string, string> | null;
} {
    const chunks = transformChunksVisual(surgery.chunks_visual);
    const sortedChunks = sortChunksByPosition(chunks, surgery.original_sentence);

    return {
        originalSentence: surgery.original_sentence,
        translation: surgery.translation,
        chunks: sortedChunks,
        coreSentence: surgery.core_sentence,
        coachScript: surgery.coach_script,
    };
}

// ============ Vocab Transform ============

/**
 * 转换后端 VocabCard 为前端 VocabItem
 */
export function transformVocabCard(apiCard: ApiVocabCard): VocabItem {
    return {
        word: apiCard.word,
        syllables: apiCard.syllables || [],
        definition: apiCard.definition,
        contextSentence: apiCard.context_sentence,
        mnemonic: apiCard.ai_memory_hint || '',
        audioSrc: apiCard.audio_url || '',
        phonetic: apiCard.phonetic,
    };
}

/**
 * 从查词结果转换为 VocabItem
 */
export function transformLookupResult(result: VocabLookupResult): VocabItem {
    return {
        word: result.word,
        syllables: result.syllables || [],
        definition: result.definition,
        contextSentence: result.example || '',
        mnemonic: result.ai_memory_hint || '',
        audioSrc: result.audio_url || '',
        phonetic: result.phonetic,
    };
}
