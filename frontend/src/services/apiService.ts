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

// ============ AI Coaching Types ============

export interface CoachingScriptRequest {
    question_id: number;
    student_answer: string;
    phase: number; // 1-6
    student_level?: string;
    student_name?: string;
    question_index?: number; // 题目序号（第几题）
}

export interface CoachingScriptResponse {
    phase: number;
    phase_name: string;
    script: string;
    suggested_action: string;
    next_phase: number | null;
    question_index: number; // 题目序号
    question_stem: string; // 题干内容
}

/**
 * 生成 AI Coaching 教学话术
 */
export async function generateCoachingScript(
    params: CoachingScriptRequest
): Promise<CoachingScriptResponse> {
    return apiFetch<CoachingScriptResponse>('/api/ai/coaching/generate', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}


// ============ Jarvis Agent API (Stateful) ============

/**
 * Agent 动作类型
 */
export type AgentActionType =
    | 'SEND_MESSAGE'
    | 'PUBLISH_TASK'
    | 'ADVANCE_PHASE'
    | 'START_REVIEW'
    | 'SHOW_GPS_CARD'
    | 'SHOW_WORD_CARD'
    | 'SHOW_CHUNKS'
    | 'PLAY_AUDIO'
    | 'COMPLETE';

/**
 * Agent 动作
 */
export interface AgentAction {
    type: AgentActionType;
    payload: {
        text?: string;
        require_task?: boolean;
        task_type?: 'voice' | 'highlight' | 'select' | 'gps' | 'review';
        phase?: number;
        phase_name?: string;
        is_correct?: boolean;
        forced_review?: boolean;
        wrong_count?: number;
        remaining_attempts?: number;
        [key: string]: any;
    };
}

/**
 * Agent 会话状态
 */
export interface AgentState {
    session_id: string;
    module_type: string;
    current_phase: number;
    wrong_count: number;
    created_at: string;
    updated_at: string;
}

/**
 * 初始化 Agent 请求
 */
export interface AgentInitRequest {
    module_type: 'coaching' | 'skill' | 'vocab' | 'surgery';
    context: {
        question_id?: number;
        student_answer?: string;
        correct_answer?: string;
        student_name?: string;
        student_level?: string;
        question_index?: number;
        question_stem?: string;
        [key: string]: any;
    };
}

/**
 * 初始化 Agent 响应
 */
export interface AgentInitResponse {
    session_id: string;
    initial_action: AgentAction;
    state: AgentState;
}

/**
 * 处理学生输入请求
 */
export interface AgentInputRequest {
    session_id: string;
    input_type: 'voice_response' | 'highlight' | 'select_option' | 'task_completed' | 'word_click';
    input_data: {
        transcript?: string;
        text?: string;
        paragraph_index?: number;
        option_id?: string;
        word?: string;
        [key: string]: any;
    };
}

/**
 * 处理学生输入响应
 */
export interface AgentInputResponse {
    action: AgentAction;
    state: AgentState;
}

/**
 * 初始化 Jarvis Agent 会话
 */
export async function initAgent(params: AgentInitRequest): Promise<AgentInitResponse> {
    return apiFetch<AgentInitResponse>('/api/ai/agent/init', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * 处理学生输入，获取 Agent 下一步动作
 */
export async function agentInput(params: AgentInputRequest): Promise<AgentInputResponse> {
    return apiFetch<AgentInputResponse>('/api/ai/agent/input', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * 获取 Agent 会话状态
 */
export async function getAgentState(sessionId: string): Promise<AgentState> {
    return apiFetch<AgentState>(`/api/ai/agent/state/${sessionId}`);
}

/**
 * 重置 Agent 会话
 */
export async function resetAgent(sessionId: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/api/ai/agent/reset/${sessionId}`, {
        method: 'POST',
    });
}

/**
 * 删除 Agent 会话
 */
export async function deleteAgent(sessionId: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/api/ai/agent/${sessionId}`, {
        method: 'DELETE',
    });
}

// ============ STT (Speech-to-Text) API ============

export interface TranscribeResponse {
    success: boolean;
    transcript?: string;
    error?: string;
}

/**
 * 语音转文字 (Groq Whisper)
 * @param audioBlob 录音数据
 * @param language 语言代码 (默认 zh=中文)
 */
export async function transcribeAudio(audioBlob: Blob, language: string = 'zh'): Promise<TranscribeResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);

    const response = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
        method: 'POST',
        body: formData, // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
    });

    if (!response.ok) {
        return { success: false, error: `API Error: ${response.status}` };
    }

    return response.json();
}
