/**
 * 热身阶段文本配置
 * Warmup Stage Text Configuration
 * 
 * 位置：/src/components/stages/Warmup/
 * 包含学生端和教师端热身阶段的所有文本
 */

export const WARMUP_TEXTS = {
  // ==================== 学生端 ====================

  /** 学生端 - 阅读挑战天数标签 */
  STUDENT_READING_CHALLENGE_LABEL: '阅读挑战第',

  /** 学生端 - 天数单位 */
  STUDENT_READING_CHALLENGE_UNIT: '天',

  /** 学生端 - 欢迎标题 */
  STUDENT_WELCOME_TITLE: '欢迎回来',

  /** 学生端 - 今日目标标签 */
  STUDENT_TODAY_GOAL_LABEL: '今日目标',

  /** 学生端 - 今日目标内容 */
  STUDENT_TODAY_GOAL_VALUE: '3 篇文章',

  /** 学生端 - 专项技能标签 */
  STUDENT_SPECIAL_SKILL_LABEL: '专项技能',

  /** 学生端 - 专项技能内容 */
  STUDENT_SPECIAL_SKILL_VALUE: '细节理解题',

  /** 学生端 - 兴趣标签1 */
  STUDENT_INTEREST_ROBOT: '机器人',

  /** 学生端 - 兴趣标签2 */
  STUDENT_INTEREST_YOUTH_SPORTS: '青少年运动',

  /** 学生端 - 兴趣标签3 */
  STUDENT_INTEREST_CAREER: '职业发展',

  // ==================== 教师端 ====================

  /** 教师端 - 页面标题 */
  COACH_PAGE_TITLE: '学员信息',

  /** 教师端 - 页面副标题 */
  COACH_PAGE_SUBTITLE: 'Student Profile',

  /** 教师端 - 阅读挑战标题 */
  COACH_READING_CHALLENGE_TITLE: '阅读挑战第',

  /** 教师端 - 阅读挑战天数单位 */
  COACH_READING_CHALLENGE_DAYS: 'DAYS',

  /** 教师端 - 词汇量标签 */
  COACH_VOCAB_SIZE_LABEL: '词汇量',

  /** 教师端 - 当前等级标签 */
  COACH_CURRENT_LEVEL_LABEL: '当前等级',

  /** 教师端 - 今日目标标签 */
  COACH_TODAY_GOAL_LABEL: '今日目标',

  /** 教师端 - 专项技能标签 */
  COACH_SPECIAL_SKILL_LABEL: '专项技能',

  /** 教师端 - 年级标签 */
  COACH_GRADE_LABEL: '年级',

  /** 教师端 - 年级值 */
  COACH_GRADE_VALUE: '初二',

  /** 教师端 - 学习风格标签 */
  COACH_LEARNING_STYLE_LABEL: '学习风格',

  /** 教师端 - 学习风格值 */
  COACH_LEARNING_STYLE_VALUE: '视觉型',

  /** 教师端 - 教师偏好标签 */
  COACH_TEACHING_PREFERENCE_LABEL: '偏好',

  /** 教师端 - 教师偏好值 */
  COACH_TEACHING_PREFERENCE_VALUE: '幽默鼓励',

  /** 教师端 - Jarvis建议内容 */
  COACH_JARVIS_SUGGESTION: '发送开场白: "Hi Alex! 我注意到你喜欢机器人，今天准备好读一篇机器人相关的文章了吗？"',

  // ==================== 学员画像标签 ====================

  /** 学员画像 - 兴趣：机器人 */
  PROFILE_INTEREST_ROBOT: '机器人',

  /** 学员画像 - 兴趣：滑雪 */
  PROFILE_INTEREST_SKIING: '滑雪',

  /** 学员画像 - 兴趣：音乐 */
  PROFILE_INTEREST_MUSIC: '音乐',

} as const;

export type WarmupTextKey = keyof typeof WARMUP_TEXTS;

