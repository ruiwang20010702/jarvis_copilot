/**
 * 通用文本配置
 * Common Text Configuration
 * 
 * 包含全局通用的文本、按钮、状态提示等
 */

export const COMMON_TEXTS = {
  // ==================== 全局导航 ====================
  /** 导航栏 - 热身阶段按钮文字 */
  NAV_WARMUP: '热身',
  
  /** 导航栏 - 技能阶段按钮文字 */
  NAV_SKILL: '技能',
  
  /** 导航栏 - 实战阶段按钮文字 */
  NAV_BATTLE: '实战',
  
  /** 导航栏 - 带练阶段按钮文字 */
  NAV_COACHING: '带练',
  
  /** 导航栏 - 生词阶段按钮文字 */
  NAV_VOCAB: '生词',
  
  /** 导航栏 - 难句阶段按钮文字 */
  NAV_SURGERY: '难句',
  
  /** 导航栏 - 结束按钮文字 */
  NAV_END: '结束',

  // ==================== 通用按钮 ====================
  /** 通用按钮 - 下一步 */
  BTN_NEXT: '下一步',
  
  /** 通用按钮 - 上一步 */
  BTN_PREV: '上一步',
  
  /** 通用按钮 - 提交 */
  BTN_SUBMIT: '提交',
  
  /** 通用按钮 - 确认 */
  BTN_CONFIRM: '确认',
  
  /** 通用按钮 - 取消 */
  BTN_CANCEL: '取消',
  
  /** 通用按钮 - 重置 */
  BTN_RESET: '重置',
  
  /** 通用按钮 - 开始 */
  BTN_START: '开始',
  
  /** 通用按钮 - 完成 */
  BTN_COMPLETE: '完成',

  // ==================== 视频窗口 ====================
  /** 视频窗口 - 学生视频占位文字 */
  VIDEO_STUDENT_PLACEHOLDER: '学生视频连线中...',
  
  /** 视频窗口 - 老师视频占位文字 */
  VIDEO_TEACHER_PLACEHOLDER: '老师视频连线中...',
  
  /** 视频窗口 - 在线状态文字 */
  VIDEO_STATUS_ONLINE: '在线',
  
  /** 视频窗口 - 离线状态文字 */
  VIDEO_STATUS_OFFLINE: '离线',

  // ==================== 聊天窗口 ====================
  /** 聊天窗口 - 标题 */
  CHAT_TITLE: '互动消息',
  
  /** 聊天窗口 - 输入框占位文字 */
  CHAT_INPUT_PLACEHOLDER: '输入消息...',
  
  /** 聊天窗口 - 留言占位文字 */
  CHAT_MESSAGE_PLACEHOLDER: '给学生留言...',

  // ==================== 加载状态 ====================
  /** 加载提示 - 系统初始化 */
  LOADING_SYSTEM_INIT: '系统初始化',
  
  /** 加载提示 - 正在连接课堂 */
  LOADING_CONNECTING: '正在连接课堂...',
  
  /** 加载提示 - 加载学生档案 */
  LOADING_STUDENT_PROFILE: '加载学生档案...',
  
  /** 加载提示 - 分析学习偏好 */
  LOADING_ANALYZING_PREFERENCE: '分析学习偏好...',
  
  /** 加载提示 - AI生成个性化文章 */
  LOADING_GENERATING_ARTICLE: 'AI 生成个性化文章...',
  
  /** 加载完成 - 进入课堂按钮 */
  LOADING_ENTER_CLASS: '进入课堂',

  // ==================== 角色身份 ====================
  /** 角色 - 学生 */
  ROLE_STUDENT: '学生',
  
  /** 角色 - 教师/教练 */
  ROLE_COACH: '教练',
  
  /** 身份标签 - 学生 */
  ROLE_LABEL_STUDENT: 'STUDENT',

  // ==================== 视图切换 ====================
  /** 视图切换 - 学生视图 */
  VIEW_STUDENT: 'Student View',
  
  /** 视图切换 - 教师视图 */
  VIEW_COACH: 'Coach View',
  
  /** 视图切换 - 分屏视图 */
  VIEW_SPLIT: 'Split View',

  // ==================== 通用提示 ====================
  /** 等待提示 - 等待教师 */
  WAITING_TEACHER: '等待教师推送...',
  
  /** 等待提示 - 监控中 */
  MONITORING: '监控中...',
  
  /** 完成提示 - 已完成 */
  COMPLETED: '已完成',
  
  /** 进行中提示 */
  IN_PROGRESS: '进行中...',

  // ==================== Jarvis 助教 ====================
  /** Jarvis - 助教标题 */
  JARVIS_TITLE: 'Jarvis 助教',
  
  /** Jarvis - 建议标题 */
  JARVIS_ADVICE: 'Jarvis 建议',
  
  /** Jarvis - 台词标题 */
  JARVIS_SCRIPT: '台词',
  
  /** Jarvis - 操作指引标题 */
  JARVIS_ACTION: '操作指引',

} as const;

export type CommonTextKey = keyof typeof COMMON_TEXTS;

