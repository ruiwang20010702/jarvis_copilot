/**
 * 难句阶段文本配置
 * Surgery Stage Text Configuration
 * 
 * 位置：/src/components/stages/Surgery/
 * 包含难句拆解教学的所有文本
 */

export const SURGERY_TEXTS = {
  // ==================== 通用 ====================
  
  /** 阶段标题 */
  STAGE_TITLE: '难句拆解',
  
  /** 阶段副标题 */
  STAGE_SUBTITLE: 'Sentence Surgery',

  // ==================== 学生端 ====================
  
  /** 学生端 - 等待提示 */
  STUDENT_WAITING: '等待教师开始拆解...',
  
  /** 学生端 - 点击删除提示 */
  STUDENT_CLICK_TO_DELETE: '点击灰色部分可删除',
  
  /** 学生端 - 聊天输入框占位 */
  STUDENT_CHAT_PLACEHOLDER: '输入消息...',

  // ==================== 教师端 ====================
  
  /** 教师端 - 操作台标题 */
  COACH_CONTROL_PANEL_TITLE: '操作台',
  
  /** 教师端 - 观察模式按钮 */
  COACH_MODE_OBSERVE: '观察模式',
  
  /** 教师端 - 教师模式按钮 */
  COACH_MODE_TEACHER: '教师模式',
  
  /** 教师端 - 学生模式按钮 */
  COACH_MODE_STUDENT: '学生模式',
  
  /** 教师端 - 重置按钮 */
  COACH_BTN_RESET: '重置',
  
  /** 教师端 - 撤回按钮 */
  COACH_BTN_UNDO: '撤回',
  
  /** 教师端 - 难句卡片标题 */
  COACH_SENTENCE_CARD_TITLE: '难句内容',

  // ==================== 模式说明 ====================
  
  /** 观察模式 - 说明 */
  MODE_OBSERVE_DESC: '只观察，不操作',
  
  /** 教师模式 - 说明 */
  MODE_TEACHER_DESC: '教师演示拆解',
  
  /** 学生模式 - 说明 */
  MODE_STUDENT_DESC: '学生练习拆解',
  
  /** 重置模式 - 说明 */
  MODE_RESET_DESC: '恢复到初始状态',
  
  /** 撤回模式 - 说明 */
  MODE_UNDO_DESC: '撤销上一步操作',

  // ==================== Jarvis 指导 ====================
  
  /** Jarvis - 观察模式指导 */
  JARVIS_OBSERVE: '当前是观察模式。请选择『教师模式』开始演示难句拆解。',
  
  /** Jarvis - 教师模式初始指导 */
  JARVIS_TEACHER_START: '请点击句子中的修饰成分（灰色部分），演示如何简化长难句。',
  
  /** Jarvis - 教师模式进行中指导 */
  JARVIS_TEACHER_ONGOING: '继续点击灰色部分删除修饰语，直到剩下核心主干。提醒学生关注句子结构的变化。',
  
  /** Jarvis - 教师模式完成指导 */
  JARVIS_TEACHER_DONE: '演示完成！现在切换到『学生模式』，让学生自己练习拆解另一个句子。',
  
  /** Jarvis - 学生模式指导 */
  JARVIS_STUDENT: '学生正在练习拆解。观察学生的操作，必要时给予口头指导。',
  
  /** Jarvis - 重置后指导 */
  JARVIS_AFTER_RESET: '句子已重置。可以重新开始演示或让学生练习。',
  
  /** Jarvis - 撤回后指导 */
  JARVIS_AFTER_UNDO: '已撤回上一步操作。可以继续演示或调整教学策略。',

  // ==================== 操作反馈 ====================
  
  /** 反馈 - 删除成功 */
  FEEDBACK_DELETED: '已删除',
  
  /** 反馈 - 无法撤回 */
  FEEDBACK_CANNOT_UNDO: '没有可撤回的操作',
  
  /** 反馈 - 已重置 */
  FEEDBACK_RESET: '句子已重置',

} as const;

export type SurgeryTextKey = keyof typeof SURGERY_TEXTS;

