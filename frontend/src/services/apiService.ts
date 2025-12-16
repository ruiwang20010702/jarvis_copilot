/**
 * API Service - 与后端通信的服务层
 */

// 后端使用 HTTPS，需要匹配
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:8000';

/**
 * 通用 fetch 封装
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// ============ Types ============

export interface ApiVersion {
    id: number;
    article_id: number;
    level: string;
    title: string;
    content: string;
    questions: ApiQuestion[];
    sentence_surgeries: ApiSentenceSurgery[];
    vocab_cards: ApiVocabCard[];
}

export interface ApiQuestion {
    id: number;
    version_id: number;
    type: string;
    stem: string;
    options: string[]; // ["A. xxx", "B. xxx", ...]
    correct_answer: string;
    analysis: string;
    error_tags: string[] | null;
    trap_type: string | null;
}

export interface ApiSentenceSurgery {
    id: number;
    version_id: number;
    original_sentence: string;
    translation: string;
    analysis: string;
    chunks_visual: {
        core: string[];
        modifier: string[];
    } | null;
    core_sentence: string;
    core_audio_url: string | null;
    coach_script: Record<string, string> | null;
}

export interface ApiVocabCard {
    id: number;
    word: string;
    syllables: string[];
    phonetic: string;
    definition: string;
    context_sentence: string;
    ai_memory_hint: string;
    audio_url: string | null;
}

export interface ApiUserProfile {
    id: number;
    username: string;
    role: string;
    level: string;
    tags: string[] | null;
    total_reading_time: number;
    vocab_mastered_count: number;
    surgery_completed_count: number;
}

export interface VocabLookupResult {
    word: string;
    phonetic: string;
    definition: string;
    syllables: string[];
    example: string;
}

// ============ API Functions ============

/**
 * 获取文章版本（包含题目、难句）
 */
export async function fetchVersion(articleId: number, level: string): Promise<ApiVersion> {
    return apiFetch<ApiVersion>(`/api/articles/${articleId}/versions/${level}`);
}

/**
 * 获取文章列表
 */
export async function fetchArticles(skip = 0, limit = 10) {
    return apiFetch<any[]>(`/api/articles?skip=${skip}&limit=${limit}`);
}

/**
 * 查词接口
 */
export async function lookupWord(word: string): Promise<VocabLookupResult> {
    return apiFetch<VocabLookupResult>('/api/vocab/lookup', {
        method: 'POST',
        body: JSON.stringify({ word }),
    });
}

/**
 * 获取用户信息
 */
export async function fetchUserProfile(username: string): Promise<ApiUserProfile> {
    return apiFetch<ApiUserProfile>(`/api/users/${username}`);
}

/**
 * 创建用户
 */
export async function createUser(data: {
    username: string;
    role: 'student' | 'coach';
    level?: string;
    tags?: string[];
}): Promise<ApiUserProfile> {
    return apiFetch<ApiUserProfile>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * 保存课堂日志
 */
export async function saveSessionLog(data: {
    session_id: string;
    user_id: number;
    article_id: number;
    version_id: number;
    looked_up_words: string[];
    quiz_results: { questionId: number; correct: boolean }[];
    reading_speed?: number;
}) {
    return apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
