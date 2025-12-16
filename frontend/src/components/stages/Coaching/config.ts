/**
 * 带练阶段 (Coaching) - 苏格拉底式6步教学配置
 * 
 * 教学场景：学生误选A，正确答案是B
 * 题目：Why did Susan buy the scarf?
 */

import React from 'react';

// Demo 题目数据
export const COACHING_DEMO_QUESTION = {
  id: 1,
  question: "Why did Susan buy the scarf?",
  article: `Susan went to the mall last Saturday. She saw a beautiful red scarf in the window of a small shop. The color was very attractive, and she thought it would match her new coat perfectly. When she walked into the shop, she noticed the price tag. The scarf was originally $50, but it was on sale for just $25. Susan didn't hesitate and bought it immediately. She was very happy with her purchase.`,
  options: [
    { id: "A", text: "She liked the color.", isCorrect: false },
    { id: "B", text: "It was on sale.", isCorrect: true },
    { id: "C", text: "She needed it for work.", isCorrect: false },
    { id: "D", text: "It was a gift for her friend.", isCorrect: false }
  ],
  studentAnswer: "A", // 学生误选
  correctAnswer: "B",
  isUnsure: false, // 是否标记了"不确定"
  // 关键句位置（用于教学引导）
  keyPhrase: {
    text: "because it was on sale for just $25",
    paragraphIndex: 0,
    startOffset: 234,
    endOffset: 272
  }
};

// 做题分析结果类型
export interface QuizAnalysis {
  questionId: number;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isGuessed: boolean; // 蒙对：做对了但标记了不确定
  status: 'correct' | 'wrong' | 'guessed';
}

// Demo 做题分析数据（模拟3道题的结果）
export const DEMO_QUIZ_ANALYSIS: QuizAnalysis[] = [
  {
    questionId: 1,
    question: "What is the main concern about youth basketball?",
    studentAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    isGuessed: false,
    status: 'correct'
  },
  {
    questionId: 2,
    question: "Why did Susan buy the scarf?",
    studentAnswer: "A",
    correctAnswer: "B",
    isCorrect: false,
    isGuessed: false,
    status: 'wrong' // 这道是错题，需要6步教学
  },
  {
    questionId: 3,
    question: "Which word best describes the author's tone?",
    studentAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    isGuessed: true, // 标记了不确定但对了 = 蒙对
    status: 'guessed'
  }
];

// 从 store 数据生成 Quiz 分析结果
export interface GenerateQuizAnalysisParams {
  quiz: Array<{
    id: number;
    question: string;
    options: Array<{ id: string; text: string }>;
    correctOption: string;
  }>;
  quizAnswers: Array<{
    questionId: number;
    optionId: string;
    isUnsure: boolean;
  }>;
}

export function generateQuizAnalysis(params: GenerateQuizAnalysisParams): QuizAnalysis[] {
  const { quiz, quizAnswers } = params;

  return quiz.map((q) => {
    const answer = quizAnswers.find(a => a.questionId === q.id);
    const studentAnswer = answer?.optionId || '';
    const isCorrect = studentAnswer === q.correctOption;
    const isGuessed = isCorrect && (answer?.isUnsure || false);

    let status: 'correct' | 'wrong' | 'guessed' = 'wrong';
    if (isCorrect) {
      status = isGuessed ? 'guessed' : 'correct';
    }

    return {
      questionId: q.id,
      question: q.question,
      studentAnswer,
      correctAnswer: q.correctOption,
      isCorrect,
      isGuessed,
      status
    };
  });
}

// 6步教学剧本配置
export interface CoachingPhaseConfig {
  phase: number;
  name: string;
  nameEn: string;
  taskType: 'voice' | 'highlight' | 'select' | 'gps' | 'review';
  jarvisTitle: string;
  jarvisScript: string;
  jarvisAction?: string; // Jarvis建议的操作
  teacherAction?: string; // 教师需要做的操作
  studentTask?: string; // 学生需要完成的任务
}

export const COACHING_PHASES: CoachingPhaseConfig[] = [
  {
    phase: 1,
    name: "归因诊断",
    nameEn: "Diagnosis",
    taskType: "voice",
    jarvisTitle: "元认知干预",
    jarvisScript: `"哎呀 Alex，这道题掉坑里了。\n\n你选了 A（喜欢颜色），能悄悄告诉 Jarvis 为什么选它吗？\n是不是觉得 beautiful 这个词很眼熟？"`,
    jarvisAction: "点击【发布任务】让学生语音回答",
    teacherAction: "引导学生暴露思维过程",
    studentTask: "语音回答：为什么选择A"
  },
  {
    phase: 2,
    name: "技能召回",
    nameEn: "Recall",
    taskType: "gps",
    jarvisTitle: "激活旧知",
    jarvisScript: `"有道理，原文确实说了 beautiful。\n但别急，拿出我们的 GPS 卡！\n\n第一步是啥来着？圈路标！\n来，题干里哪两个词最重要？特别是那个特殊疑问词。"`,
    jarvisAction: "点击【发布任务】发送GPS卡片",
    teacherAction: "提示学生调用Part 1学过的知识",
    studentTask: "点击接收GPS卡片"
  },
  {
    phase: 3,
    name: "路标定位",
    nameEn: "Guide",
    taskType: "highlight",
    jarvisTitle: "注意力聚焦",
    jarvisScript: `"Bingo！路标找得很准。\n\n特别是这个 Why，它问的是'原因'。\n现在，我们要去文章里找'原因'的替身了。"`,
    jarvisAction: "让学生在题干中圈出 'Why' 和 'Susan'",
    teacherAction: "画线题干中的关键词：Why",
    studentTask: "在题干中画线标记 Why 和 Susan"
  },
  {
    phase: 4,
    name: "搜原句",
    nameEn: "Locate",
    taskType: "highlight",
    jarvisTitle: "引导式发现",
    jarvisScript: `"带着路标去扫一扫。\n找到那句提到 Susan 买围巾的话了吗？\n\n尤其注意，谁是 Why 的好朋友？\n对，就是 Because！它后面藏着大秘密。"`,
    jarvisAction: "引导学生在文章中找 'Because' 相关句子",
    teacherAction: "画线文章中的关键句：it was on sale",
    studentTask: "在文章中画线标记 Because 所在的句子"
  },
  {
    phase: 5,
    name: "纠偏锁定",
    nameEn: "Match",
    taskType: "select",
    jarvisTitle: "逻辑辨析",
    jarvisScript: `"真相大白了。原文说是'打折'(on sale)。\n\n再看你刚才选的 A，虽然是事实，但它不是原因。\n\n再给你一次机会，现在你会选哪个？"`,
    jarvisAction: "展示选项对比，引导学生改选",
    teacherAction: "解释A是事实但不是原因",
    studentTask: "重新选择正确答案 B"
  },
  {
    phase: 6,
    name: "技巧复盘",
    nameEn: "Review",
    taskType: "review",
    jarvisTitle: "行为主义强化",
    jarvisScript: `"太棒了 Alex！\n\n你看，只要按 GPS 卡的套路出牌：\n1. 圈 Why → 2. 找 Because → 3. 选 on sale\n\n就能避开干扰项。下次遇到 Why，还用这招！"`,
    jarvisAction: "展示GPS路径图，总结方法论",
    teacherAction: "强化正确的解题路径",
    studentTask: "查看复盘总结"
  }
];

// 获取当前阶段配置
export const getPhaseConfig = (phase: number): CoachingPhaseConfig | undefined => {
  return COACHING_PHASES.find(p => p.phase === phase);
};

// 任务类型对应的图标和颜色
export const TASK_TYPE_STYLES = {
  voice: { icon: 'Mic', color: 'rose', label: '语音回答' },
  highlight: { icon: 'Highlighter', color: 'yellow', label: '画线任务' },
  select: { icon: 'MousePointer2', color: 'blue', label: '选择答案' },
  gps: { icon: 'Navigation', color: 'cyan', label: '接收GPS卡' },
  review: { icon: 'Trophy', color: 'amber', label: '查看复盘' }
};

