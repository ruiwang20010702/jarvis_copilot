/**
 * 技能阶段配置文件
 * 包含常量、数据结构定义等
 */

import React from 'react';

// 文字雨单词配置
export const TEXT_RAIN_WORDS = [
    'Facts', 'Dates', 'Names', 'Numbers', 'Statistics', 'Formulas', 'Theories',
    'Concepts', 'Definitions', 'Vocabulary', 'Equations', 'Principles', 'Rules',
    'Data', 'Evidence', 'Citations', 'References', 'Quotations', 'Figures',
    'Methods', 'Results', 'Conclusions', 'Analysis', 'Synthesis', 'Arguments',
    '1842', '2.71828', '3.14159', 'GDP', 'DNA', 'RNA', 'H2O', 'CO2',
    'Einstein', 'Newton', 'Darwin', 'Shakespeare', 'Aristotle', 'Plato'
];

// Mini-Quiz 数据
export const SKILL_QUIZ_DATA = {
    question: 'What time did Tom go to the park?',
    contextText: 'Tom went to the park at 3 p.m. yesterday. He played basketball with his friends for two hours. After that, they had dinner together at a nearby restaurant.',
    keywords: ['Tom', 'park', '3 p.m.'],
    options: [
        { id: 'A', text: 'At 2 p.m.', isCorrect: false },
        { id: 'B', text: 'At 3 p.m.', isCorrect: true },
        { id: 'C', text: 'At 4 p.m.', isCorrect: false },
        { id: 'D', text: 'At 5 p.m.', isCorrect: false }
    ]
};

// 技能节点类型定义
export type SkillNodeStatus = 'pending' | 'active' | 'completed';

export interface SkillNode {
    id: number;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    status: SkillNodeStatus;
    jarvisPrompt: string;
    jarvisAction: string;
}

