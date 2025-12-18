import { create } from 'zustand';
import { fetchVersion, lookupWord } from './src/services/apiService';
import { transformVersion, transformLookupResult, transformSentenceSurgery } from './src/services/dataTransform';

export type UserRole = 'student' | 'coach' | null;

export type Stage = 'warm-up' | 'skill' | 'battle' | 'coaching' | 'vocab' | 'surgery' | 'review';

export type ViewMode = 'student' | 'coach' | 'split';

export interface Message {
  id: string;
  role: 'jarvis' | 'student' | 'coach';
  text: string;
  time: string;
}

// --- Battle Mode Types ---
export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  correctOption: string;
  relatedParagraphIndices?: number[];  // 相关段落索引，用于 Coaching 阶段高亮
}

export interface Highlight {
  id: string;
  text: string; // Selected text content
  color: string;
}

export interface QuizAnswer {
  questionId: number;
  optionId: string;
  isUnsure: boolean;
}

// --- Vocab Mode Types ---
export interface VocabItem {
  word: string;
  syllables: string[];
  definition: string;
  contextSentence: string;
  mnemonic: string;
  audioSrc: string;
  phonetic?: string;
}

export type VocabStep = 'flashcards' | 'exitpass';
export type ExitPassStep = 'check' | 'remedial' | 'done';

// --- Surgery Mode Types (Phase 5) ---
export type SentenceChunk = {
  id: string;
  text: string;
  type: 'core' | 'modifier'; // core=主干(不可切), modifier=修饰(可切)
  isRemoved: boolean; // true=被切除(隐藏)
  shake?: boolean; // true=触发错误抖动动画
};

export type SurgeryMode = 'observation' | 'teacher' | 'student';

interface GameStore {
  userRole: UserRole;
  currentStage: Stage;
  viewMode: ViewMode;
  messages: Message[];
  quickReplies: string[];

  // Battle State
  lookupLimit: number;
  lookups: { word: string; context: string; versionId?: number }[];
  highlights: Highlight[];
  quizAnswers: QuizAnswer[];
  scrollProgress: number; // 0-100
  articleData: {
    versionId?: number;
    title: string;
    paragraphs: string[];
    quiz: QuizQuestion[];
  };

  // Coaching State (Phase 3) - 苏格拉底式6步教学
  focusParagraphIndex: number | null;
  isRecording: boolean;
  currentCorrectionQuestionId: number | null;
  coachingStep: 1 | 2;
  activeTask: 'highlight' | 'speak' | null;
  stuckCount: number;

  // 6步教学阶段状态
  coachingPhase: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=未开始, 1-6=6个阶段
  coachingTaskType: 'highlight' | 'voice' | 'select' | 'gps' | 'review' | null; // 当前任务类型
  coachingTaskTarget: 'article' | 'question' | null; // 任务目标区域（主要用于划词）
  coachingTaskReceived: boolean; // 学生是否已接收任务
  coachingTaskCompleted: boolean; // 学生是否已完成任务
  teacherHighlights: { paragraphIndex: number; startOffset: number; endOffset: number; text: string }[]; // 教师红色画线
  studentHighlights: { paragraphIndex: number; startOffset: number; endOffset: number; text: string }[]; // 学生黄色画线（做题痕迹）
  gpsCardReceived: boolean; // 学生是否接收了GPS卡
  studentVoiceAnswer: string | null; // 学生语音回答内容
  coachingReselectedAnswer: string | null; // 学生重新选择的答案 (Phase 5)

  // Vocab State (Phase 4)
  vocabList: VocabItem[];
  vocabStatus: Record<string, 'unseen' | 'learning' | 'mastered'>;
  currentVocabIndex: number;
  phase4Step: VocabStep;
  exitPassStep: ExitPassStep;
  remedialQueue: string[];
  remedialIndex: number;
  vocabCardFlipped: boolean;
  reviewingVocabWord: string | null;
  isSyllableMode: boolean;
  isPlayingAudio: 'none' | 'student' | 'standard';
  vocabSpeakEnabled: boolean; // 老师是否已启动跟读阶段
  vocabRecordingScore: number | null; // 学生的发音评分
  studentRecordingState: 'idle' | 'recording' | 'assessing' | 'finished'; // 学生录音状态

  // Surgery State (Phase 5)
  surgeryMode: SurgeryMode;
  surgeryChunks: SentenceChunk[];

  // Skill State (Phase 2 - The Armory)
  skillNode: number; // 0=waiting, 1=concept, 2=metaphor, 3=action, 4=verify, 5=complete
  studentHasEquipped: boolean;
  studentConfirmedFormula: boolean; // 学生是否确认了口诀
  studentDemoStep: number; // 学生完成的演示步骤 (0=未开始, 1=完成圈路标, 2=完成搜原句, 3=完成锁答案)

  // Skill Quiz State (Verify Phase - 5 questions)
  skillQuizHighlightedWords: string[];
  skillQuizSelectedAnswer: string | null;
  skillQuizAnswerCorrect: boolean | null;
  skillQuizStartTime: number | null;
  currentQuizIndex: number; // 当前题目索引 (0-4)
  quizResults: boolean[]; // 每道题的答题结果
  quizCompleted: boolean; // 是否完成所有5题
  skillQuizWrongAttempt: { questionId: number; optionId: string } | null; // 错误尝试追踪
  demoTeacherStep: number; // 老师推进的演示步骤 (0=未开始, 1=推进圈路标, 2=推进搜原句, 3=推进锁答案)

  // Actions
  setUserRole: (role: UserRole) => void;
  setStage: (stage: Stage) => void;
  setViewMode: (mode: ViewMode) => void;
  addMessage: (message: Omit<Message, 'id' | 'time'>) => void;
  setQuickReplies: (replies: string[]) => void;

  // Battle Actions
  addLookup: (word: string, context?: string, versionId?: number) => void;
  addHighlight: (text: string) => void;
  removeHighlight: (id: string) => void;
  setQuizAnswer: (qId: number, oId: string, isUnsure: boolean) => void;
  setScrollProgress: (progress: number) => void;

  // Data Loading Actions
  isLoading: boolean;
  loadVersion: (articleId: number, level: string) => Promise<void>;
  loadVocabFromLookups: () => Promise<void>;

  // Coaching Actions
  setFocusParagraph: (index: number | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setCurrentCorrectionQuestionId: (id: number | null) => void;
  pushTask: (task: 'highlight' | 'speak') => void;
  resolveTask: () => void;
  incrementStuck: () => void;
  forceNextStep: () => void;

  // 6步教学 Actions
  advanceCoachingPhase: () => void; // 教师推进到下一阶段
  setCoachingPhase: (phase: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
  publishCoachingTask: (type: 'highlight' | 'voice' | 'select' | 'gps' | 'review', target?: 'article' | 'question') => void; // 教师发布任务
  receiveCoachingTask: () => void; // 学生接收任务
  completeCoachingTask: () => void; // 学生完成任务
  addTeacherHighlight: (highlight: { paragraphIndex: number; startOffset: number; endOffset: number; text: string }) => void;
  addStudentHighlight: (highlight: { paragraphIndex: number; startOffset: number; endOffset: number; text: string }) => void;
  receiveGpsCard: () => void;
  setStudentVoiceAnswer: (answer: string | null) => void;
  setCoachingReselectedAnswer: (answer: string | null) => void;
  resetCoachingState: () => void;

  // Vocab Actions
  initVocabSession: () => void;
  nextVocabCard: () => void;
  setVocabCardFlipped: (flipped: boolean) => void;
  toggleSyllableMode: () => void;
  playStandardAudio: () => void;
  toggleVocabCheck: (word: string) => void;
  submitExitPass: () => void;
  completeRemedialWord: () => void;
  setReviewingVocabWord: (word: string | null) => void;

  // Surgery Actions
  setSurgeryMode: (mode: SurgeryMode) => void;
  removeChunk: (id: string) => void;
  restoreChunk: (id: string) => void;
  restoreSentence: () => void;
  triggerChunkShake: (id: string) => void;

  // Skill Actions
  advanceSkillNode: () => void;
  setStudentEquipped: (equipped: boolean) => void;
  setStudentConfirmedFormula: (confirmed: boolean) => void;
  setStudentDemoStep: (step: number) => void;
  resetSkillState: () => void;

  // Skill Quiz Actions
  toggleSkillQuizWord: (word: string) => void;
  setSkillQuizAnswer: (answerId: string, isCorrect: boolean) => void;
  startSkillQuiz: () => void;
  nextQuizQuestion: () => void; // 进入下一题
  completeQuiz: () => void; // 完成所有答题
  resetQuiz: () => void; // 重置答题状态
  setSkillQuizWrongAttempt: (attempt: { questionId: number; optionId: string } | null) => void; // 设置错误尝试
  setDemoTeacherStep: (step: number) => void; // 老师推进演示步骤

  // Video State
  remoteStream: MediaStream | null;
  setRemoteStream: (stream: MediaStream | null) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;

  reset: () => void;
}

// Mock Data
const MOCK_ARTICLE = {
  title: "The Rise of Youth Basketball",
  paragraphs: [
    "In recent years, the landscape of youth basketball has undergone a seismic shift. What was once a seasonal recreational activity has morphed into a year-round, high-stakes industry. Families pour significant resources into travel teams, private coaching, and specialized training camps, driven by the elusive dream of college scholarships or professional contracts.",
    "However, this professionalization of youth sports comes at a cost. Orthopedic surgeons are reporting a sharp rise in overuse injuries among adolescents, a phenomenon rarely seen a generation ago. The pressure to specialize early often leads to burnout, robbing young athletes of the simple joy of play. Moreover, the financial barrier to entry has widened, creating a disparity where elite training is accessible only to the affluent.",
    "Despite these challenges, the benefits of team sports remain undeniable. Basketball teaches resilience, teamwork, and discipline. The key lies in finding a balance—fostering development without sacrificing the physical and mental well-being of the child. Coaches and parents must navigate this delicate line to ensure the game remains a positive force in young lives."
  ],
  quiz: [
    {
      id: 1,
      question: "What is the main concern raised about the modern youth basketball industry?",
      options: [
        { id: "A", text: "It lacks qualified coaches." },
        { id: "B", text: "It leads to overuse injuries and burnout." },
        { id: "C", text: "It focuses too much on school grades." },
        { id: "D", text: "It has become too easy to get scholarships." }
      ],
      correctOption: "B"
    },
    {
      id: 2,
      question: "The author implies that early specialization:",
      options: [
        { id: "A", text: "Is necessary for professional success." },
        { id: "B", text: "Reduces the financial burden on parents." },
        { id: "C", text: "Can negatively impact a child's enjoyment." },
        { id: "D", text: "Prevents physical injuries." }
      ],
      correctOption: "C"
    },
    {
      id: 3,
      question: "Which word best describes the author's tone regarding the benefits of sports?",
      options: [
        { id: "A", text: "Skeptical" },
        { id: "B", text: "Affirmative" },
        { id: "C", text: "Indifferent" },
        { id: "D", text: "Hostile" }
      ],
      correctOption: "B"
    }
  ]
};

// Vocab Mock Data Helpers
const REQUIRED_VOCAB = ['obsessed', 'unprecedented', 'determination', 'perseverance', 'comprehensive'];

const MOCK_VOCAB_DB: Record<string, VocabItem> = {
  'obsessed': {
    word: 'obsessed',
    syllables: ['ob', 'sessed'],
    definition: 'adj. 着迷的；无法摆脱的',
    contextSentence: 'He became obsessed with winning every game.',
    mnemonic: '💡 巧记：Ob (Oh) + sessed (Possessed) -> "Oh, possessed by the idea!" 被念头附身了 -> 着迷。',
    audioSrc: ''
  },
  'unprecedented': {
    word: 'unprecedented',
    syllables: ['un', 'prec', 'e', 'dent', 'ed'],
    definition: 'adj. 前所未有的',
    contextSentence: 'The team faced unprecedented challenges this season.',
    mnemonic: '💡 巧记：Un (不) + Precedent (先例) = 没有先例的 = 史无前例。',
    audioSrc: ''
  },
  'determination': {
    word: 'determination',
    syllables: ['de', 'ter', 'mi', 'na', 'tion'],
    definition: 'n. 决心；果断',
    contextSentence: 'Her determination to improve impressed the coach.',
    mnemonic: '💡 巧记：De-ter-mi-na-tion, 每个音节都铿锵有力，代表着不可动摇的"决心"！',
    audioSrc: ''
  },
  'perseverance': {
    word: 'perseverance',
    syllables: ['per', 'se', 'ver', 'ance'],
    definition: 'n. 毅力；不屈不挠',
    contextSentence: 'Success requires patience and perseverance.',
    mnemonic: '💡 巧记：Per (始终) + severe (严厉) -> 始终对自己要求严厉 -> 毅力。',
    audioSrc: ''
  },
  'comprehensive': {
    word: 'comprehensive',
    syllables: ['com', 'pre', 'hen', 'sive'],
    definition: 'adj. 全面的；综合的',
    contextSentence: 'They offer a comprehensive training program.',
    mnemonic: '💡 巧记：Com (共同) + prehend (抓住/理解) -> 把所有的方面都抓住了 -> 全面的。',
    audioSrc: ''
  },
  'default': {
    word: 'Unknown',
    syllables: ['un', 'known'],
    definition: 'n. 未知词汇 (Mock Data)',
    contextSentence: 'This word was looked up during the session.',
    mnemonic: '💡 Jarvis is analyzing this word for you...',
    audioSrc: ''
  }
};

const INITIAL_SURGERY_CHUNKS: SentenceChunk[] = [
  { id: 'c1', text: 'The coach', type: 'core', isRemoved: false },
  { id: 'm1', text: 'that trained our team for three years', type: 'modifier', isRemoved: false },
  { id: 'c2', text: 'won', type: 'core', isRemoved: false },
  { id: 'm2', text: 'many national', type: 'modifier', isRemoved: false },
  { id: 'c3', text: 'awards.', type: 'core', isRemoved: false }
];

const generateVocabItem = (word: string): VocabItem => {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');
  if (MOCK_VOCAB_DB[lower]) return MOCK_VOCAB_DB[lower];

  return {
    word: word,
    syllables: [word.substring(0, Math.ceil(word.length / 2)), word.substring(Math.ceil(word.length / 2))],
    definition: `n. ${word} 的中文释义 (Mock)`,
    contextSentence: `Here is a context sentence containing the word ${word}.`,
    mnemonic: `💡 Jarvis smart mnemonic for ${word}...`,
    audioSrc: ''
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  userRole: null,
  currentStage: 'warm-up',
  viewMode: 'student',
  messages: [],
  quickReplies: [],

  // Battle Defaults
  lookupLimit: 3,
  lookups: [],
  highlights: [],
  quizAnswers: [],
  scrollProgress: 0,
  articleData: MOCK_ARTICLE,

  // Coaching Defaults
  focusParagraphIndex: null,
  isRecording: false,
  currentCorrectionQuestionId: null,
  coachingStep: 1,
  activeTask: null,
  stuckCount: 0,

  // 6步教学默认值
  coachingPhase: 0,
  coachingTaskType: null,
  coachingTaskTarget: null,
  coachingTaskReceived: false,
  coachingTaskCompleted: false,
  teacherHighlights: [],
  studentHighlights: [],
  gpsCardReceived: false,
  studentVoiceAnswer: null,
  coachingReselectedAnswer: null,

  // Vocab Defaults
  vocabList: [],
  vocabStatus: {},
  currentVocabIndex: 0,
  phase4Step: 'flashcards',
  exitPassStep: 'check',
  remedialQueue: [],
  remedialIndex: 0,
  vocabCardFlipped: false,
  reviewingVocabWord: null,
  isSyllableMode: false,
  isPlayingAudio: 'none',
  vocabSpeakEnabled: false,
  vocabRecordingScore: null,
  studentRecordingState: 'idle',

  // Surgery Defaults
  surgeryMode: 'observation',
  surgeryChunks: INITIAL_SURGERY_CHUNKS,

  // Skill Defaults
  skillNode: 0,
  studentHasEquipped: false,
  studentConfirmedFormula: false,
  studentDemoStep: 0,
  skillQuizHighlightedWords: [],
  skillQuizSelectedAnswer: null,
  skillQuizAnswerCorrect: null,
  skillQuizStartTime: null,
  currentQuizIndex: 0,
  quizResults: [],
  quizCompleted: false,
  skillQuizWrongAttempt: null,
  demoTeacherStep: 0,

  setUserRole: (role) => set({ userRole: role, viewMode: role === 'coach' ? 'coach' : 'student' }),
  setStage: (stage) => {
    set({ currentStage: stage });
    if (stage === 'vocab') {
      get().initVocabSession();
    }
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, {
      ...msg,
      id: Math.random().toString(36).substring(7),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }]
  })),
  setQuickReplies: (replies) => set({ quickReplies: replies }),

  addLookup: (word: string, context?: string, versionId?: number) => set((state) => {
    if (state.currentStage !== 'coaching' && (state.lookups.length >= state.lookupLimit || state.lookups.some(l => l.word === word))) {
      return state;
    }
    return { lookups: [...state.lookups, { word, context: context || '', versionId }] };
  }),
  addHighlight: (text) => set((state) => ({
    highlights: [...state.highlights, { id: Math.random().toString(36).substring(7), text, color: 'yellow' }]
  })),
  removeHighlight: (id) => set((state) => ({
    highlights: state.highlights.filter(h => h.id !== id)
  })),
  setQuizAnswer: (qId, oId, isUnsure) => set((state) => {
    const existing = state.quizAnswers.find(a => a.questionId === qId);
    if (existing) {
      return {
        quizAnswers: state.quizAnswers.map(a => a.questionId === qId ? { ...a, optionId: oId, isUnsure } : a)
      };
    }
    return { quizAnswers: [...state.quizAnswers, { questionId: qId, optionId: oId, isUnsure }] };
  }),
  setScrollProgress: (p) => set({ scrollProgress: p }),

  // Data Loading Actions
  isLoading: false,

  loadVersion: async (articleId: number, level: string) => {
    set({ isLoading: true });
    try {
      const apiVersion = await fetchVersion(articleId, level);
      const articleData = transformVersion(apiVersion);

      // 转换难句数据（取第一个难句作为默认）
      let surgeryChunks = INITIAL_SURGERY_CHUNKS;
      if (apiVersion.sentence_surgeries && apiVersion.sentence_surgeries.length > 0) {
        const firstSurgery = transformSentenceSurgery(apiVersion.sentence_surgeries[0]);
        surgeryChunks = firstSurgery.chunks;
        console.log('[Store] Loaded surgery chunks:', surgeryChunks);
      }

      set({ articleData, surgeryChunks, isLoading: false });
      console.log('[Store] Loaded version:', articleId, level, articleData);
    } catch (error) {
      console.error('[Store] Failed to load version:', error);
      set({ isLoading: false });
    }
  },

  loadVocabFromLookups: async () => {
    const lookups = get().lookups;
    if (lookups.length === 0) {
      console.log('[Store] No lookups to load vocab from');
      return;
    }

    set({ isLoading: true });
    const vocabItems: VocabItem[] = [];
    const vocabStatus: Record<string, 'unseen' | 'learning' | 'mastered'> = {};

    for (const lookup of lookups) {
      try {
        const result = await lookupWord(lookup.word, lookup.context, lookup.versionId);
        vocabItems.push(transformLookupResult(result));
        vocabStatus[lookup.word] = 'unseen';
      } catch (error) {
        console.error('[Store] Failed to lookup word:', lookup.word, error);
        // Fallback to basic vocab item
        vocabItems.push({
          word: lookup.word,
          syllables: [lookup.word],
          definition: `Definition for '${lookup.word}' not available`,
          contextSentence: '',
          mnemonic: '',
          audioSrc: '',
        });
        vocabStatus[lookup.word] = 'unseen';
      }
    }

    set({
      vocabList: vocabItems,
      vocabStatus,
      currentVocabIndex: 0,
      phase4Step: 'flashcards',
      isLoading: false,
    });
    console.log('[Store] Loaded vocab from lookups:', vocabItems.length, 'words');
  },

  setFocusParagraph: (index) => set({ focusParagraphIndex: index }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setCurrentCorrectionQuestionId: (id) => set({ currentCorrectionQuestionId: id }),

  pushTask: (task) => set({ activeTask: task }),
  resolveTask: () => set((state) => ({ activeTask: null, coachingStep: state.coachingStep === 1 ? 2 : state.coachingStep })),
  incrementStuck: () => set((state) => ({ stuckCount: state.stuckCount + 1 })),
  forceNextStep: () => set((state) => ({
    stuckCount: 0,
    activeTask: null,
    coachingStep: state.coachingStep === 1 ? 2 : state.coachingStep
  })),

  // 6步教学 Actions
  advanceCoachingPhase: () => set((state) => ({
    coachingPhase: Math.min(state.coachingPhase + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    coachingTaskType: null,
    coachingTaskTarget: null,
    coachingTaskReceived: false,
    coachingTaskCompleted: false
  })),
  setCoachingPhase: (phase) => set({
    coachingPhase: phase,
    coachingTaskType: null,
    coachingTaskTarget: null,
    coachingTaskReceived: false,
    coachingTaskCompleted: false
  }),
  publishCoachingTask: (type, target) => set({
    coachingTaskType: type,
    coachingTaskTarget: target || null,
    coachingTaskReceived: false,
    coachingTaskCompleted: false,
    studentHighlights: [] // 重置学生之前的划词
  }),
  receiveCoachingTask: () => set({ coachingTaskReceived: true }),
  completeCoachingTask: () => set({ coachingTaskCompleted: true }),
  addTeacherHighlight: (highlight) => set((state) => ({
    teacherHighlights: [...state.teacherHighlights, highlight]
  })),
  addStudentHighlight: (highlight) => set((state) => ({
    studentHighlights: [...state.studentHighlights, highlight]
  })),
  receiveGpsCard: () => set({ gpsCardReceived: true }),
  setStudentVoiceAnswer: (answer) => set({ studentVoiceAnswer: answer }),
  setCoachingReselectedAnswer: (answer) => set({ coachingReselectedAnswer: answer }),
  resetCoachingState: () => set({
    coachingPhase: 0,
    coachingTaskType: null,
    coachingTaskTarget: null,
    coachingTaskReceived: false,
    coachingTaskCompleted: false,
    teacherHighlights: [],
    gpsCardReceived: false,
    studentVoiceAnswer: null,
    coachingReselectedAnswer: null,
    focusParagraphIndex: null
  }),

  // Vocab Actions
  initVocabSession: () => {
    // 如果有查词记录，使用真实数据
    const lookups = get().lookups;
    if (lookups.length > 0) {
      // 调用异步加载（不阻塞）
      get().loadVocabFromLookups();
    } else {
      // 没有查词记录，使用默认词汇（保持向后兼容）
      const allWords = REQUIRED_VOCAB;
      const vocabList = allWords.map(generateVocabItem);
      const vocabStatus: Record<string, 'unseen' | 'learning' | 'mastered'> = {};
      vocabList.forEach(v => vocabStatus[v.word] = 'unseen');

      set({
        vocabList,
        vocabStatus,
        currentVocabIndex: 0,
        phase4Step: 'flashcards',
        exitPassStep: 'check',
        remedialQueue: [],
        remedialIndex: 0,
        vocabCardFlipped: false,
        isSyllableMode: false,
        isPlayingAudio: 'none',
        vocabSpeakEnabled: false
      });
    }
  },
  nextVocabCard: () => set((state) => {
    const nextIndex = state.currentVocabIndex + 1;
    if (nextIndex >= state.vocabList.length) {
      // Transition to Exit Pass Step 1: Check
      return {
        phase4Step: 'exitpass',
        exitPassStep: 'check',
        vocabCardFlipped: false,
        isSyllableMode: false,
        isPlayingAudio: 'none',
        vocabSpeakEnabled: false
      };
    }
    return {
      currentVocabIndex: nextIndex,
      vocabCardFlipped: false,
      isSyllableMode: false,
      isPlayingAudio: 'none',
      vocabSpeakEnabled: false
    };
  }),
  setVocabCardFlipped: (flipped) => set({ vocabCardFlipped: flipped }),
  toggleSyllableMode: () => set((state) => ({ isSyllableMode: !state.isSyllableMode })),
  playStandardAudio: () => {
    const state = get();
    const currentCard = state.vocabList[state.currentVocabIndex];

    console.log('[Audio] Playing for:', currentCard?.word, 'audioSrc:', currentCard?.audioSrc);

    if (currentCard?.audioSrc && currentCard.audioSrc.length > 0) {
      set({ isPlayingAudio: 'standard' });

      // 使用 API 基础 URL 构建完整路径
      const audioUrl = currentCard.audioSrc.startsWith('http')
        ? currentCard.audioSrc
        : `${import.meta.env.VITE_API_URL || 'https://localhost:8000'}${currentCard.audioSrc}`;

      console.log('[Audio] Playing file:', audioUrl);
      const audio = new Audio(audioUrl);
      audio.play().then(() => {
        audio.onended = () => {
          set({ isPlayingAudio: 'none' });
        };
      }).catch((error) => {
        console.error('[Audio] File playback failed, fallback to TTS:', error);
        // 文件播放失败，回退到 TTS
        speakWord(currentCard.word);
      });
    } else if (currentCard?.word) {
      // 没有音频文件，使用浏览器 TTS
      console.log('[Audio] No audio file, using browser TTS');
      speakWord(currentCard.word);
    } else {
      console.warn('[Audio] No word to play');
    }

    function speakWord(word: string) {
      set({ isPlayingAudio: 'standard' });
      if ('speechSynthesis' in window) {
        // Chrome 需要先取消之前的语音
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => set({ isPlayingAudio: 'none' });
        utterance.onerror = (e) => {
          console.error('[Audio] TTS error:', e);
          set({ isPlayingAudio: 'none' });
        };

        // Chrome workaround: 延迟执行
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 100);

        console.log('[Audio] TTS speaking:', word);
      } else {
        console.warn('[Audio] speechSynthesis not supported');
        setTimeout(() => set({ isPlayingAudio: 'none' }), 1000);
      }
    }
  },

  toggleVocabCheck: (word) => set((state) => {
    const current = state.vocabStatus[word];
    const next = current === 'mastered' ? 'learning' : 'mastered';
    return { vocabStatus: { ...state.vocabStatus, [word]: next } };
  }),

  submitExitPass: () => set((state) => {
    const unmastered = state.vocabList.filter(v => state.vocabStatus[v.word] !== 'mastered');

    if (unmastered.length === 0) {
      // 全部掌握，直接跳转到难句阶段
      return { currentStage: 'surgery', exitPassStep: 'check', phase4Step: 'flashcards' };
    } else {
      return {
        exitPassStep: 'remedial',
        remedialQueue: unmastered.map(v => v.word),
        remedialIndex: 0,
        vocabCardFlipped: false,
        isSyllableMode: false
      };
    }
  }),

  completeRemedialWord: () => set((state) => {
    const currentWord = state.remedialQueue[state.remedialIndex];
    // Mark as mastered
    const newStatus: Record<string, 'unseen' | 'learning' | 'mastered'> = { ...state.vocabStatus, [currentWord]: 'mastered' };

    const nextIndex = state.remedialIndex + 1;
    if (nextIndex >= state.remedialQueue.length) {
      // 回炉学习全部完成，直接跳转到难句阶段
      return {
        vocabStatus: newStatus,
        currentStage: 'surgery',
        exitPassStep: 'check',
        phase4Step: 'flashcards',
        remedialQueue: []
      };
    } else {
      // Next remedial card
      return { vocabStatus: newStatus, remedialIndex: nextIndex, vocabCardFlipped: false, isSyllableMode: false };
    }
  }),

  setReviewingVocabWord: (word) => set({ reviewingVocabWord: word }),

  // Surgery Actions
  setSurgeryMode: (mode) => set({ surgeryMode: mode }),

  removeChunk: (id) => set((state) => ({
    surgeryChunks: state.surgeryChunks.map(c =>
      c.id === id ? { ...c, isRemoved: true } : c
    )
  })),

  restoreChunk: (id) => set((state) => ({
    surgeryChunks: state.surgeryChunks.map(c =>
      c.id === id ? { ...c, isRemoved: false } : c
    )
  })),

  restoreSentence: () => set((state) => ({
    surgeryChunks: state.surgeryChunks.map(c => ({ ...c, isRemoved: false }))
  })),

  triggerChunkShake: (id) => {
    set((state) => ({
      surgeryChunks: state.surgeryChunks.map(c =>
        c.id === id ? { ...c, shake: true } : c
      )
    }));
    setTimeout(() => {
      set((state) => ({
        surgeryChunks: state.surgeryChunks.map(c =>
          c.id === id ? { ...c, shake: false } : c
        )
      }));
    }, 500);
  },

  // Skill Actions
  advanceSkillNode: () => set((state) => ({
    skillNode: Math.min(state.skillNode + 1, 5)
  })),
  setStudentEquipped: (equipped) => set({ studentHasEquipped: equipped }),
  setStudentConfirmedFormula: (confirmed) => set({ studentConfirmedFormula: confirmed }),
  setStudentDemoStep: (step) => set({ studentDemoStep: step }),
  resetSkillState: () => set({
    skillNode: 0,
    studentHasEquipped: false,
    studentConfirmedFormula: false,
    studentDemoStep: 0,
    skillQuizHighlightedWords: [],
    skillQuizSelectedAnswer: null,
    skillQuizAnswerCorrect: null,
    skillQuizStartTime: null,
    currentQuizIndex: 0,
    quizResults: [],
    quizCompleted: false,
    skillQuizWrongAttempt: null,
    demoTeacherStep: 0
  }),

  // Skill Quiz Actions
  toggleSkillQuizWord: (word) => set((state) => {
    const words = state.skillQuizHighlightedWords;
    if (words.includes(word)) {
      return { skillQuizHighlightedWords: words.filter(w => w !== word) };
    }
    return { skillQuizHighlightedWords: [...words, word] };
  }),
  setSkillQuizAnswer: (answerId, isCorrect) => set({
    skillQuizSelectedAnswer: answerId,
    skillQuizAnswerCorrect: isCorrect
  }),
  startSkillQuiz: () => set({
    skillQuizStartTime: Date.now(),
    skillQuizHighlightedWords: [],
    skillQuizSelectedAnswer: null,
    skillQuizAnswerCorrect: null,
    currentQuizIndex: 0,
    quizResults: [],
    quizCompleted: false
  }),
  nextQuizQuestion: () => set((state) => {
    const newResults = [...state.quizResults, state.skillQuizAnswerCorrect === true];
    const newIndex = state.currentQuizIndex + 1;
    // 如果完成了5题，标记为完成
    if (newIndex >= 5) {
      return {
        quizResults: newResults,
        quizCompleted: true,
        skillQuizHighlightedWords: [],
        skillQuizSelectedAnswer: null,
        skillQuizAnswerCorrect: null
      };
    }
    return {
      currentQuizIndex: newIndex,
      quizResults: newResults,
      skillQuizHighlightedWords: [],
      skillQuizSelectedAnswer: null,
      skillQuizAnswerCorrect: null
    };
  }),
  completeQuiz: () => set({ quizCompleted: true }),
  resetQuiz: () => set({
    currentQuizIndex: 0,
    quizResults: [],
    quizCompleted: false,
    skillQuizHighlightedWords: [],
    skillQuizSelectedAnswer: null,
    skillQuizAnswerCorrect: null,
    skillQuizStartTime: null,
    skillQuizWrongAttempt: null
  }),
  setSkillQuizWrongAttempt: (attempt) => set({ skillQuizWrongAttempt: attempt }),
  setDemoTeacherStep: (step) => set({ demoTeacherStep: step }),

  reset: () => set({
    userRole: null,
    currentStage: 'warm-up',
    messages: [],
    quickReplies: [],
    lookups: [],
    highlights: [],
    quizAnswers: [],
    scrollProgress: 0,
    focusParagraphIndex: null,
    isRecording: false,
    currentCorrectionQuestionId: null,
    coachingStep: 1,
    activeTask: null,
    stuckCount: 0,
    coachingPhase: 0,
    coachingTaskType: null,
    coachingTaskReceived: false,
    coachingTaskCompleted: false,
    teacherHighlights: [],
    studentHighlights: [],
    gpsCardReceived: false,
    studentVoiceAnswer: null,
    vocabList: [],
    vocabStatus: {},
    currentVocabIndex: 0,
    phase4Step: 'flashcards',
    exitPassStep: 'check',
    remedialQueue: [],
    remedialIndex: 0,
    vocabCardFlipped: false,
    reviewingVocabWord: null,
    isSyllableMode: false,
    isPlayingAudio: 'none',
    surgeryMode: 'observation',
    surgeryChunks: INITIAL_SURGERY_CHUNKS,
    skillNode: 0,
    studentHasEquipped: false,
    studentConfirmedFormula: false,
    studentDemoStep: 0,
    skillQuizHighlightedWords: [],
    skillQuizSelectedAnswer: null,
    skillQuizAnswerCorrect: null,
    skillQuizStartTime: null,
    currentQuizIndex: 0,
    quizResults: [],
    quizCompleted: false,
    skillQuizWrongAttempt: null,
    demoTeacherStep: 0,
    remoteStream: null,
  }),

  // Video Actions
  remoteStream: null,
  setRemoteStream: (stream) => {
    console.log('[Store] setRemoteStream called:', stream ? 'MediaStream with ' + stream.getTracks().length + ' tracks' : 'null');
    set({ remoteStream: stream });
  },
  isMuted: false,
  setIsMuted: (muted) => set({ isMuted: muted }),
}));