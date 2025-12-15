/**
 * 实战阶段文本配置
 * Battle Stage Text Configuration
 * 
 * 位置：/src/components/stages/Battle/
 * 包含学生独立阅读做题的所有文本
 */

export const BATTLE_TEXTS = {
  // ==================== 学生端 ====================
  
  /** 学生端 - 阶段标题（如有） */
  STUDENT_STAGE_TITLE: '独立阅读挑战',
  
  /** 学生端 - 时间限制提示 */
  STUDENT_TIME_LIMIT: '建议用时: 15分钟',
  
  /** 学生端 - 提交按钮 */
  STUDENT_BTN_SUBMIT: '提交答案',
  
  /** 学生端 - 高亮工具提示 */
  STUDENT_HIGHLIGHT_TOOLTIP: '标记重点',
  
  /** 学生端 - 查词工具提示 */
  STUDENT_LOOKUP_TOOLTIP: '查询生词',
  
  /** 学生端 - 不确定选项标记 */
  STUDENT_MARK_UNSURE: '不确定',

  // ==================== 教师端 ====================
  
  /** 教师端 - 实时活动标题 */
  COACH_ACTIVITY_TITLE: '实时活动记录',
  
  /** 教师端 - 活动类型：高亮 */
  COACH_ACTIVITY_TYPE_HIGHLIGHT: '高亮',
  
  /** 教师端 - 活动类型：查词 */
  COACH_ACTIVITY_TYPE_LOOKUP: '查词',
  
  /** 教师端 - 活动类型：答题 */
  COACH_ACTIVITY_TYPE_ANSWER: '答题',
  
  /** 教师端 - 统计标题 */
  COACH_STATS_TITLE: '实时数据',
  
  /** 教师端 - 阅读进度标签 */
  COACH_STAT_PROGRESS_LABEL: '阅读进度',
  
  /** 教师端 - 高亮次数标签 */
  COACH_STAT_HIGHLIGHTS_LABEL: '高亮次数',
  
  /** 教师端 - 查词次数标签 */
  COACH_STAT_LOOKUPS_LABEL: '查词次数',
  
  /** 教师端 - 答题进度标签 */
  COACH_STAT_QUIZ_PROGRESS_LABEL: '答题进度',
  
  /** 教师端 - Jarvis建议标题 */
  COACH_JARVIS_TITLE: 'Jarvis 实时建议',
  
  /** 教师端 - Jarvis建议内容示例 */
  COACH_JARVIS_SUGGESTION: '学生正在积极标记重点，阅读理解能力良好。建议继续观察做题情况。',

  // ==================== 题目相关 ====================
  
  /** 题目 - 单选题标签 */
  QUESTION_TYPE_SINGLE: '单选题',
  
  /** 题目 - 多选题标签 */
  QUESTION_TYPE_MULTIPLE: '多选题',
  
  /** 题目 - 选项标签 */
  QUESTION_OPTION_PREFIX: '选项',

} as const;

export type BattleTextKey = keyof typeof BATTLE_TEXTS;

