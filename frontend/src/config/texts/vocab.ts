/**
 * 生词阶段文本配置
 * Vocabulary Stage Text Configuration
 * 
 * 位置：/src/components/stages/Vocab/
 * 包含生词学习C-E-O教学法的所有文本
 */

export const VOCAB_TEXTS = {
  // ==================== 通用 ====================
  
  /** 阶段标题 */
  STAGE_TITLE: '生词攻克',
  
  /** 单词计数显示 */
  WORD_COUNT: '当前 {current}/{total}',

  // ==================== 学生端 ====================
  
  /** 学生端 - 音节拼读模式提示 */
  STUDENT_SYLLABLE_MODE: '音节拼读模式',
  
  /** 学生端 - 正常模式提示 */
  STUDENT_NORMAL_MODE: '正常模式',
  
  /** 学生端 - 录音得分 */
  STUDENT_RECORDING_SCORE: '得分: {score}',
  
  /** 学生端 - AI助记标题 */
  STUDENT_AI_MNEMONIC_TITLE: 'AI助记',
  
  /** 学生端 - 例句标题 */
  STUDENT_EXAMPLE_SENTENCE_TITLE: '例句',
  
  /** 学生端 - 麦克风禁用提示 */
  STUDENT_MIC_DISABLED: '等待教师开启',

  // ==================== 教师端 ====================
  
  /** 教师端 - 单词卡片控制标题 */
  COACH_CARD_CONTROL_TITLE: '单词卡片控制',
  
  /** 教师端 - 上一个按钮 */
  COACH_BTN_PREV: '上一个',
  
  /** 教师端 - 下一个按钮 */
  COACH_BTN_NEXT: '下一个',
  
  /** 教师端 - C-E-O教学步骤标题 */
  COACH_TEACHING_STEPS_TITLE: 'C-E-O 教学步骤',
  
  /** 教师端 - 步骤1: 播放发音 */
  COACH_STEP_1_PLAY: '播放发音',
  
  /** 教师端 - 步骤2: 音节拆解 */
  COACH_STEP_2_SYLLABLE: '音节拆解',
  
  /** 教师端 - 步骤3: 跟读 */
  COACH_STEP_3_REPEAT: '跟读',
  
  /** 教师端 - 步骤4: 翻转卡片 */
  COACH_STEP_4_FLIP: '翻转卡片',
  
  /** 教师端 - 已完成标记 */
  COACH_STEP_COMPLETED: '已完成',

  // ==================== 出门测试 ====================
  
  /** 出门测试 - 标题 */
  EXIT_TEST_TITLE: '出门测试',
  
  /** 出门测试 - 说明 */
  EXIT_TEST_INSTRUCTION: '请勾选已掌握的单词',
  
  /** 出门测试 - 提交按钮 */
  EXIT_TEST_BTN_SUBMIT: '提交检查',
  
  /** 出门测试 - 全部掌握提示 */
  EXIT_TEST_ALL_MASTERED: '全部掌握！',
  
  /** 出门测试 - 需要回炉提示 */
  EXIT_TEST_NEED_REMEDIAL: '有 {count} 个单词需要重新学习',

  // ==================== 回炉重学 ====================
  
  /** 回炉 - 标题 */
  REMEDIAL_TITLE: '回炉重学',
  
  /** 回炉 - 当前进度 */
  REMEDIAL_PROGRESS: '回炉单词 {current}/{total}',

  // ==================== Jarvis 指导 ====================
  
  /** Jarvis - 步骤1指导 */
  JARVIS_STEP_1: '请点击『播放发音』让学生先听单词发音',
  
  /** Jarvis - 步骤2指导 */
  JARVIS_STEP_2: '现在点击『音节拆解』帮助学生理解单词结构',
  
  /** Jarvis - 步骤3指导 */
  JARVIS_STEP_3: '请点击『跟读』开启麦克风，让学生跟读单词',
  
  /** Jarvis - 步骤4指导 */
  JARVIS_STEP_4: '最后点击『翻转卡片』展示中文释义和例句',
  
  /** Jarvis - 完成单词指导 */
  JARVIS_COMPLETED_WORD: '这个单词已完成！点击『下一个』继续',
  
  /** Jarvis - 全部完成指导 */
  JARVIS_ALL_COMPLETED: '所有单词已学完！可以开始『出门测试』',

  // ==================== 单词状态 ====================
  
  /** 单词状态 - 学习中 */
  WORD_STATUS_LEARNING: '学习中',
  
  /** 单词状态 - 已掌握 */
  WORD_STATUS_MASTERED: '已掌握',

} as const;

export type VocabTextKey = keyof typeof VOCAB_TEXTS;

