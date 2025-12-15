/**
 * 技能阶段文本配置
 * Skill Stage Text Configuration
 * 
 * 位置：/src/components/stages/Skill/
 * 包含GPS定位法教学的所有文本
 */

export const SKILL_TEXTS = {
  // ==================== 学生端 - 等待界面 ====================

  /** 学生端 - 阶段标题 */
  STUDENT_STAGE_TITLE: '技能习得阶段',

  /** 学生端 - 等待提示 */
  STUDENT_WAITING_PROMPT: '等待教师推送...',

  /** 学生端 - 工具栏标题 */
  STUDENT_TOOLS_TITLE: 'TOOLS',

  // ==================== GPS卡片 ====================

  /** GPS卡片 - 标题 */
  GPS_CARD_TITLE: 'GPS 定位法',

  /** GPS卡片 - 副标题 */
  GPS_CARD_SUBTITLE: 'Reading Navigation System',

  /** GPS卡片 - 描述 */
  GPS_CARD_DESCRIPTION: '三步精准定位答案，像GPS一样快速找到目标信息！',

  /** GPS卡片 - 装备按钮 */
  GPS_CARD_BTN_EQUIP: '点击装备',

  /** GPS卡片 - 已装备状态 */
  GPS_CARD_EQUIPPED: '已装备',

  // ==================== 口诀教学 ====================

  /** 口诀 - 标题 */
  FORMULA_TITLE: 'GPS定位法',

  /** 口诀 - 内容 */
  FORMULA_CONTENT: '一圈路标，二搜原句，三锁答案。三步定位，精准找答案！',

  /** 口诀 - 步骤1名称 */
  FORMULA_STEP1_NAME: '圈路标',

  /** 口诀 - 步骤1描述 */
  FORMULA_STEP1_DESC: '找到题干关键词',

  /** 口诀 - 步骤2名称 */
  FORMULA_STEP2_NAME: '搜原句',

  /** 口诀 - 步骤2描述 */
  FORMULA_STEP2_DESC: '在文章中定位',

  /** 口诀 - 步骤3名称 */
  FORMULA_STEP3_NAME: '锁答案',

  /** 口诀 - 步骤3描述 */
  FORMULA_STEP3_DESC: '比对锁定正确选项',

  /** 口诀 - 确认按钮 */
  FORMULA_BTN_CONFIRM: '我已掌握',

  // ==================== 演示阶段 ====================

  /** 演示 - 阶段标题 */
  DEMO_STAGE_TITLE: '跟我一起练习',

  /** 演示 - 阶段描述 */
  DEMO_STAGE_DESC: '通过实际例子理解GPS定位法',

  /** 演示 - 步骤1提示 */
  DEMO_STEP1_PROMPT: '点击题干中的关键词',

  /** 演示 - 步骤2提示 */
  DEMO_STEP2_PROMPT: '扫描文章找到相关句子',

  /** 演示 - 步骤3提示 */
  DEMO_STEP3_PROMPT: '锁定正确答案',

  // ==================== 做题阶段 ====================

  /** 做题 - 阶段标题 */
  QUIZ_STAGE_TITLE: '实战练习',

  /** 做题 - 题目计数 */
  QUIZ_QUESTION_COUNT: '第 {current} / {total} 题',

  /** 做题 - 下一题按钮 */
  QUIZ_BTN_NEXT: '下一题',

  /** 做题 - 提交按钮 */
  QUIZ_BTN_SUBMIT: '提交',

  /** 做题 - 正确反馈 */
  QUIZ_FEEDBACK_CORRECT: '太棒了！',

  /** 做题 - 错误反馈 */
  QUIZ_FEEDBACK_WRONG: '再想想...',

  /** 做题 - 关键词提示 */
  QUIZ_HINT_KEYWORDS: '点击题干里的关键词 (Click Keywords to Focus)',

  // ==================== 结算页面 ====================

  /** 结算 - 标题 */
  COMPLETION_TITLE: 'GPS大师',

  /** 结算 - 副标题 */
  COMPLETION_SUBTITLE: 'GPS Master!',

  /** 结算 - 描述 */
  COMPLETION_DESC: '恭喜完成所有题目！你已经掌握了GPS定位法',

  /** 结算 - 正确题数 */
  COMPLETION_CORRECT_COUNT: '答对 {count} 题',

  // ==================== 教师端 ====================

  /** 教师端 - 开始课程按钮 */
  COACH_BTN_START: '开始课程',

  /** 教师端 - 部署解决方案按钮 */
  COACH_BTN_DEPLOY: '部署解决方案',

  /** 教师端 - 展示口诀按钮 */
  COACH_BTN_SHOW_FORMULA: '展示口诀',

  /** 教师端 - 步骤1按钮 */
  COACH_BTN_STEP1: '步骤 1: 圈路标',

  /** 教师端 - 步骤2按钮 */
  COACH_BTN_STEP2: '步骤 2: 搜原句',

  /** 教师端 - 步骤3按钮 */
  COACH_BTN_STEP3: '步骤 3: 锁答案',

  /** 教师端 - 开始练手按钮 */
  COACH_BTN_START_QUIZ: '开始练手',

  /** 教师端 - 下一阶段按钮 */
  COACH_BTN_NEXT_STAGE: '下一阶段',

  /** 教师端 - 等待学生装备提示 */
  COACH_WAITING_EQUIP: '等待学生装备...',

  /** 教师端 - 学生已完成提示 */
  COACH_STUDENT_COMPLETED: '学生已完成所有5道题目',

  // ==================== Jarvis 台词 ====================

  /** Jarvis - 开场台词 */
  JARVIS_SCRIPT_WELCOME: '欢迎同学们！今天我们学习用GPS定位法解题。',

  /** Jarvis - 部署方案台词 */
  JARVIS_SCRIPT_DEPLOY: '大意：阅读中最常见的就是细节理解题。就像是屏幕上这样密密麻麻的具体事实（比如发现了霸王龙骨头）或具体描述（比如红车有四个门）。',

  /** Jarvis - 演示口诀台词 */
  JARVIS_SCRIPT_FORMULA: 'GPS定位法核心口诀：一圈路标，二搜原句，三锁答案。三步定位，精准找答案！',

  /** Jarvis - 演示步骤1台词 */
  JARVIS_SCRIPT_DEMO1: '跟读第一步：圈关键词定位。我们要带着题干里的关键词，也就是『路标』，特别是特殊疑问词（比如Where是地点？Why是原因？）',

  /** Jarvis - 演示步骤2台词 */
  JARVIS_SCRIPT_DEMO2: '第二步：文章里定位。带着你的路标，去文章里扫描。只要早日，找到那个长得一模一样的句子，那就是它了！',

  /** Jarvis - 演示步骤3台词 */
  JARVIS_SCRIPT_DEMO3: '第三步：仔细比对。读懂那个长难句，和选项比对。意思像的那个就是答案。',

  /** Jarvis - 开始练手台词 */
  JARVIS_SCRIPT_START_QUIZ: '光说不练假把式，来做道题。',

} as const;

export type SkillTextKey = keyof typeof SKILL_TEXTS;

