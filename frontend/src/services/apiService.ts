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
    related_paragraph_indices: number[] | null; // 相关段落索引，用于 Coaching 阶段定位原文
}

export interface ApiSentenceSurgery {
    id: number;
    version_id: number;
    original_sentence: string;
    translation: string;
    analysis: string;
    structure_data: {
        components?: { text: string; label: string }[];
    } | null;
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
    audio_url?: string;
    ai_memory_hint?: string;
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
 * 查词接口 - 增强版
 * @param word 要查询的单词
 * @param contextSentence 学生划词时的原句（用于语境翻译）
 */
export async function lookupWord(word: string, contextSentence?: string, versionId?: number): Promise<VocabLookupResult> {
    return apiFetch<VocabLookupResult>('/api/vocab/lookup', {
        method: 'POST',
        body: JSON.stringify({ word, context_sentence: contextSentence, version_id: versionId }),
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

/**
 * 发音评估接口
 * @param audioBlob 录音文件 Blob
 * @param text 参考文本
 */
export async function assessPronunciation(audioBlob: Blob, text: string): Promise<{
    accuracy: number;
    fluency: number;
    completeness: number;
    overall: number;
    error?: string;
}> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('text', text);

    const response = await fetch(`${API_BASE_URL}/api/ai/pronunciation`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
}

// ============ Streaming Chat API (流式对话) ============

/**
 * 聊天消息
 */
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * 聊天上下文
 */
export interface ChatContext {
    student_name?: string;
    student_level?: string;
    article_title?: string;
    article_content?: string;
    question_stem?: string;
    options?: Array<{ id: string; text: string }>;
    correct_answer?: string;
    student_answer?: string;
    question_type?: string;
    wrong_count?: number;
    question_index?: number;
    module_type?: 'coaching' | 'surgery';
    current_sentence?: string;
    surgery_chunks?: any[];
}

/**
 * 流式事件类型
 */
export interface ChatStreamEvent {
    type: 'text' | 'tool_call' | 'error' | 'done' | 'thinking_start' | 'thinking_end';
    content: string | object;
    tool_calls?: Array<{
        name: string;
        arguments: Record<string, any>;
    }>;
}

/**
 * 初始化聊天会话
 */
export async function initChatSession(context: ChatContext): Promise<{
    session_id: string;
    greeting: string;
    suggested_task: {
        type: string;
        instruction: string;
    };
}> {
    return apiFetch('/api/ai/chat/init', {
        method: 'POST',
        body: JSON.stringify({
            session_id: '',
            messages: [],
            context,
        }),
    });
}

/**
 * 流式聊天 - 返回 AsyncGenerator
 * 
 * 使用示例:
 * ```
 * for await (const event of chatStream(sessionId, messages, context)) {
 *     if (event.type === 'text') {
 *         console.log('收到文本:', event.content);
 *     } else if (event.type === 'tool_call') {
 *         console.log('工具调用:', event.content);
 *     }
 * }
 * ```
 */
export async function* chatStream(
    sessionId: string,
    messages: ChatMessage[],
    context?: ChatContext
): AsyncGenerator<ChatStreamEvent, void, unknown> {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            messages,
            context,
        }),
    });

    if (!response.ok) {
        yield {
            type: 'error',
            content: `API Error: ${response.status} ${response.statusText}`,
        };
        return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
        yield { type: 'error', content: 'No response body' };
        return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // 解析 SSE 事件
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留未完成的行

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data) {
                        try {
                            const event = JSON.parse(data) as ChatStreamEvent;
                            yield event;
                        } catch (e) {
                            console.warn('[chatStream] Failed to parse event:', data);
                        }
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * 获取聊天历史
 */
export async function getChatHistory(sessionId: string): Promise<{
    session_id: string;
    messages: ChatMessage[];
    context: ChatContext;
}> {
    return apiFetch(`/api/ai/chat/history/${sessionId}`);
}

/**
 * 删除聊天会话
 */
export async function deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    return apiFetch(`/api/ai/chat/${sessionId}`, {
        method: 'DELETE',
    });
}

/**
 * 流式初始化聊天 - 返回 AsyncGenerator
 * 逐字输出问候语
 */
export interface InitStreamEvent {
    type: 'session' | 'text' | 'tool_call' | 'done' | 'error';
    session_id?: string;
    content?: string;
    greeting?: string;
    suggested_task?: {
        type: string;
        instruction: string;
        target?: string;
    };
    tool_calls?: unknown[];
}

export async function* initChatStream(
    context: ChatContext
): AsyncGenerator<InitStreamEvent, void, unknown> {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat/init-stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: '',
            messages: [],
            context,
        }),
    });

    if (!response.ok) {
        yield {
            type: 'error',
            content: `API Error: ${response.status} ${response.statusText}`,
        };
        return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
        yield { type: 'error', content: 'No response body' };
        return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data) {
                        try {
                            const event = JSON.parse(data) as InitStreamEvent;
                            yield event;
                        } catch (e) {
                            console.warn('[initChatStream] Failed to parse event:', data);
                        }
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}
