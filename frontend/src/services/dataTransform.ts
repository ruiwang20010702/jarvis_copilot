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

/**
 * 转换后端 chunks_visual 为前端 SentenceChunk[]
 * 并合并 structure_data 中的详细成分标签
 * 
 * 后端格式: 
 *   chunks_visual: [{ text: "The coach", type: "core" }, ...]
 *   structure_data: { components: [{ text: "The coach", label: "主语" }, ...] }
 * 前端格式: [{ id: "c1", text: "The coach", type: "core", label: "主语" }, ...]
 */
export function transformChunksVisual(
    chunksVisual: any[] | null,
    structureData?: { components?: { text: string; label: string }[] } | null
): SentenceChunk[] {
    if (!chunksVisual || !Array.isArray(chunksVisual)) return [];

    // 创建 text -> label 的映射表
    const labelMap = new Map<string, string>();
    if (structureData?.components) {
        structureData.components.forEach(comp => {
            labelMap.set(comp.text.trim(), comp.label);
        });
    }

    return chunksVisual.map((chunk, index) => ({
        id: `chunk-${index}`,
        text: chunk.text || '',
        type: chunk.type === 'modifier' ? 'modifier' : 'core',
        label: labelMap.get((chunk.text || '').trim()) || undefined,
        isRemoved: false,
    }));
}

// 移除 sortChunksByPosition，因为后端现在直接返回有序列表

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
    const chunks = transformChunksVisual(
        surgery.chunks_visual as any,
        surgery.structure_data as any
    );

    return {
        originalSentence: surgery.original_sentence,
        translation: surgery.translation,
        chunks: chunks,
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
