/**
 * 带练阶段文本配置
 * Coaching Stage Text Configuration
 * 
 * 位置：/src/components/stages/Coaching/
 * 包含苏格拉底式分流教学的所有文本
 */

export const COACHING_TEXTS = {
  // ==================== 通用 ====================
  
  /** 阶段标题 */
  STAGE_TITLE: '精准带练',
  
  /** 阶段副标题 */
  STAGE_SUBTITLE: 'Socratic Coaching',

  // ==================== 学生端 ====================
  
  /** 学生端 - 等待任务提示 */
  STUDENT_WAITING_TASK: '等待老师发布任务...',
  
  /** 学生端 - 接收任务按钮 */
  STUDENT_BTN_RECEIVE: '接收',
  
  /** 学生端 - 提交任务按钮 */
  STUDENT_BTN_SUBMIT_TASK: '提交任务',
  
  /** 学生端 - 原文标签页 */
  STUDENT_TAB_ARTICLE: '原文',
  
  /** 学生端 - 题目分析标签页 */
  STUDENT_TAB_ANALYSIS: '题目分析',
  
  /** 学生端 - 做题分析标题 */
  STUDENT_ANALYSIS_TITLE: '我的做题分析',
  
  /** 学生端 - 正在纠正提示 */
  STUDENT_CORRECTING: '正在纠正中',

  // ==================== 教师端 ====================
  
  /** 教师端 - 开始带练按钮 */
  COACH_BTN_START: '开始精准带练',
  
  /** 教师端 - 发布任务按钮 */
  COACH_BTN_PUBLISH_TASK: '发布任务',
  
  /** 教师端 - 下一阶段按钮 */
  COACH_BTN_NEXT_PHASE: '进入下一阶段',
  
  /** 教师端 - 确认画线按钮 */
  COACH_BTN_CONFIRM_HIGHLIGHT: '确认画线（红色）',
  
  /** 教师端 - 任务状态：进行中 */
  COACH_TASK_STATUS_ONGOING: '进行中...',
  
  /** 教师端 - 任务状态：已完成 */
  COACH_TASK_STATUS_COMPLETED: '已完成',
  
  /** 教师端 - 原文标签页 */
  COACH_TAB_ARTICLE: '原文',
  
  /** 教师端 - 题目分析标签页 */
  COACH_TAB_ANALYSIS: '题目分析',
  
  /** 教师端 - 做题分析标题 */
  COACH_ANALYSIS_TITLE: '做题分析报告',
  
  /** 教师端 - 当前正在纠错提示 */
  COACH_CORRECTING: '当前正在精准纠错',

  // ==================== 六步教学法 ====================
  
  /** 教学阶段0 - 名称 */
  PHASE_0_NAME: '准备阶段',
  
  /** 教学阶段1 - 名称 */
  PHASE_1_NAME: '归因诊断',
  
  /** 教学阶段2 - 名称 */
  PHASE_2_NAME: '技能召回',
  
  /** 教学阶段3 - 名称 */
  PHASE_3_NAME: '路标定位',
  
  /** 教学阶段4 - 名称 */
  PHASE_4_NAME: '搜原句',
  
  /** 教学阶段5 - 名称 */
  PHASE_5_NAME: '纠编锁定',
  
  /** 教学阶段6 - 名称 */
  PHASE_6_NAME: '技巧复盘',

  // ==================== 做题分析 ====================
  
  /** 分析报告 - 正确题目标签 */
  ANALYSIS_LABEL_CORRECT: '正确',
  
  /** 分析报告 - 错误题目标签 */
  ANALYSIS_LABEL_WRONG: '错误',
  
  /** 分析报告 - 蒙对题目标签 */
  ANALYSIS_LABEL_GUESSED: '蒙对',
  
  /** 分析报告 - 学生答案 */
  ANALYSIS_STUDENT_ANSWER: '你的答案',
  
  /** 分析报告 - 正确答案 */
  ANALYSIS_CORRECT_ANSWER: '正确答案',
  
  /** 分析报告 - 题目编号 */
  ANALYSIS_QUESTION_NUM: '题目 {num}',

  // ==================== 任务类型 ====================
  
  /** 任务类型 - 画线 */
  TASK_TYPE_HIGHLIGHT: '画线任务',
  
  /** 任务类型 - 语音 */
  TASK_TYPE_VOICE: '语音回答',
  
  /** 任务类型 - 选择 */
  TASK_TYPE_SELECT: '选择题',

} as const;

export type CoachingTextKey = keyof typeof COACHING_TEXTS;

