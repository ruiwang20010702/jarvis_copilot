# 文本字段映射表
# Text Fields Mapping Document

**版本**: v1.0  
**创建日期**: 2024-12-14  
**用途**: 前后端对接参考、国际化准备、文案统一管理

---

## 📋 目录结构

```
/src/config/texts/
├── common.ts          # 通用文本（导航、按钮、视频窗口等）
├── warmup.ts          # 热身阶段文本
├── skill.ts           # 技能阶段文本
├── battle.ts          # 实战阶段文本
├── coaching.ts        # 带练阶段文本
├── vocab.ts           # 生词阶段文本
├── surgery.ts         # 难句阶段文本
└── index.ts           # 统一导出
```

---

## 🌐 通用文本 (common.ts)

### 全局导航
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `NAV_WARMUP` | 热身 | Header导航栏 | 热身阶段导航按钮 |
| `NAV_SKILL` | 技能 | Header导航栏 | 技能阶段导航按钮 |
| `NAV_BATTLE` | 实战 | Header导航栏 | 实战阶段导航按钮 |
| `NAV_COACHING` | 带练 | Header导航栏 | 带练阶段导航按钮 |
| `NAV_VOCAB` | 生词 | Header导航栏 | 生词阶段导航按钮 |
| `NAV_SURGERY` | 难句 | Header导航栏 | 难句阶段导航按钮 |
| `NAV_END` | 结束 | Header导航栏 | 结束课程按钮 |

### 通用按钮
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `BTN_NEXT` | 下一步 | 多处 | 通用下一步按钮 |
| `BTN_PREV` | 上一步 | 多处 | 通用上一步按钮 |
| `BTN_SUBMIT` | 提交 | 多处 | 通用提交按钮 |
| `BTN_CONFIRM` | 确认 | 多处 | 通用确认按钮 |
| `BTN_CANCEL` | 取消 | 多处 | 通用取消按钮 |
| `BTN_RESET` | 重置 | 多处 | 通用重置按钮 |
| `BTN_START` | 开始 | 多处 | 通用开始按钮 |
| `BTN_COMPLETE` | 完成 | 多处 | 通用完成按钮 |

### 视频窗口
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `VIDEO_STUDENT_PLACEHOLDER` | 学生视频连线中... | 所有阶段视频窗 | 学生视频占位文字 |
| `VIDEO_TEACHER_PLACEHOLDER` | 老师视频连线中... | 所有阶段视频窗 | 老师视频占位文字 |
| `VIDEO_STATUS_ONLINE` | 在线 | 视频窗左上角 | 在线状态标签 |
| `VIDEO_STATUS_OFFLINE` | 离线 | 视频窗左上角 | 离线状态标签 |

### 聊天窗口
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `CHAT_TITLE` | 互动消息 | 聊天窗口标题栏 | 聊天窗口标题 |
| `CHAT_INPUT_PLACEHOLDER` | 输入消息... | 聊天输入框 | 学生端聊天输入占位 |
| `CHAT_MESSAGE_PLACEHOLDER` | 给学生留言... | 聊天输入框 | 教师端聊天输入占位 |

### 加载状态
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `LOADING_SYSTEM_INIT` | 系统初始化 | Loading页面 | 加载页面标题 |
| `LOADING_CONNECTING` | 正在连接课堂... | Loading页面 | 加载步骤1 |
| `LOADING_STUDENT_PROFILE` | 加载学生档案... | Loading页面 | 加载步骤2 |
| `LOADING_ANALYZING_PREFERENCE` | 分析学习偏好... | Loading页面 | 加载步骤3 |
| `LOADING_GENERATING_ARTICLE` | AI 生成个性化文章... | Loading页面 | 加载步骤4 |
| `LOADING_ENTER_CLASS` | 进入课堂 | Loading页面 | 加载完成按钮 |

---

## 🔥 热身阶段 (warmup.ts)

### 学生端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `STUDENT_READING_CHALLENGE_LABEL` | 阅读挑战第 | 左侧顶部标签 | 阅读挑战天数标签 |
| `STUDENT_READING_CHALLENGE_UNIT` | 天 | 左侧顶部标签 | 天数单位 |
| `STUDENT_WELCOME_TITLE` | 欢迎回来 | 左侧主标题 | 欢迎标题 |
| `STUDENT_TODAY_GOAL_LABEL` | 今日目标 | 数据卡片 | 目标标签 |
| `STUDENT_TODAY_GOAL_VALUE` | 3 篇文章 | 数据卡片 | 目标内容 |
| `STUDENT_SPECIAL_SKILL_LABEL` | 专项技能 | 数据卡片 | 技能标签 |
| `STUDENT_SPECIAL_SKILL_VALUE` | 细节理解题 | 数据卡片 | 技能内容 |
| `STUDENT_INTEREST_BASKETBALL` | 篮球 | 兴趣标签 | 兴趣1 |
| `STUDENT_INTEREST_YOUTH_SPORTS` | 青少年运动 | 兴趣标签 | 兴趣2 |
| `STUDENT_INTEREST_CAREER` | 职业发展 | 兴趣标签 | 兴趣3 |

### 教师端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `COACH_PAGE_TITLE` | 学员信息 | 左侧卡片标题 | 页面主标题 |
| `COACH_PAGE_SUBTITLE` | Student Profile | 左侧卡片副标题 | 页面副标题 |
| `COACH_VOCAB_SIZE_LABEL` | 词汇量 | 数据卡片 | 词汇量标签 |
| `COACH_CURRENT_LEVEL_LABEL` | 当前等级 | 数据卡片 | 等级标签 |
| `COACH_GRADE_LABEL` | 年级 | 标签 | 年级标签 |
| `COACH_GRADE_VALUE` | 初二 | 标签 | 年级值 |
| `COACH_LEARNING_STYLE_LABEL` | 学习风格 | 标签 | 学习风格标签 |
| `COACH_LEARNING_STYLE_VALUE` | 视觉型 | 标签 | 学习风格值 |
| `COACH_TEACHING_PREFERENCE_LABEL` | 偏好 | 标签 | 教学偏好标签 |
| `COACH_TEACHING_PREFERENCE_VALUE` | 幽默鼓励 | 标签 | 教学偏好值 |

---

## 🎯 技能阶段 (skill.ts)

### GPS定位法核心
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `GPS_CARD_TITLE` | GPS 定位法 | GPS卡片 | 卡片标题 |
| `GPS_CARD_SUBTITLE` | Reading Navigation System | GPS卡片 | 卡片副标题 |
| `GPS_CARD_DESCRIPTION` | 三步精准定位答案... | GPS卡片 | 卡片描述 |
| `GPS_CARD_BTN_EQUIP` | 点击装备 | GPS卡片按钮 | 装备按钮 |
| `GPS_CARD_EQUIPPED` | 已装备 | GPS卡片 | 已装备状态 |

### 口诀教学
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `FORMULA_TITLE` | GPS定位法 | 口诀界面 | 口诀标题 |
| `FORMULA_CONTENT` | 一圈路标，二搜原句... | 口诀界面 | 口诀内容 |
| `FORMULA_STEP1_NAME` | 圈路标 | 步骤卡片 | 步骤1名称 |
| `FORMULA_STEP1_DESC` | 找到题干关键词 | 步骤卡片 | 步骤1描述 |
| `FORMULA_STEP2_NAME` | 搜原句 | 步骤卡片 | 步骤2名称 |
| `FORMULA_STEP2_DESC` | 在文章中定位 | 步骤卡片 | 步骤2描述 |
| `FORMULA_STEP3_NAME` | 锁答案 | 步骤卡片 | 步骤3名称 |
| `FORMULA_STEP3_DESC` | 比对锁定正确选项 | 步骤卡片 | 步骤3描述 |
| `FORMULA_BTN_CONFIRM` | 我已掌握 | 确认按钮 | 口诀确认按钮 |

### 做题阶段
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `QUIZ_STAGE_TITLE` | 实战练习 | 做题界面 | 阶段标题 |
| `QUIZ_BTN_NEXT` | 下一题 | 做题界面 | 下一题按钮 |
| `QUIZ_FEEDBACK_CORRECT` | 太棒了！ | 做题界面 | 正确反馈 |
| `QUIZ_FEEDBACK_WRONG` | 再想想... | 做题界面 | 错误反馈 |
| `QUIZ_HINT_KEYWORDS` | 点击题干里的关键词... | 做题界面 | 关键词提示 |

### 教师端按钮
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `COACH_BTN_START` | 开始课程 | 教师端 | 开始按钮 |
| `COACH_BTN_DEPLOY` | 部署解决方案 | 教师端 | 部署按钮 |
| `COACH_BTN_SHOW_FORMULA` | 展示口诀 | 教师端 | 展示口诀按钮 |
| `COACH_BTN_STEP1` | 步骤 1: 圈路标 | 教师端 | 步骤1按钮 |
| `COACH_BTN_STEP2` | 步骤 2: 搜原句 | 教师端 | 步骤2按钮 |
| `COACH_BTN_STEP3` | 步骤 3: 锁答案 | 教师端 | 步骤3按钮 |
| `COACH_BTN_START_QUIZ` | 开始练手 | 教师端 | 开始练手按钮 |
| `COACH_BTN_NEXT_STAGE` | 下一阶段 | 教师端 | 下一阶段按钮 |

---

## ⚔️ 实战阶段 (battle.ts)

### 学生端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `STUDENT_STAGE_TITLE` | 独立阅读挑战 | 学生端 | 阶段标题 |
| `STUDENT_TIME_LIMIT` | 建议用时: 15分钟 | 学生端 | 时间提示 |
| `STUDENT_BTN_SUBMIT` | 提交答案 | 学生端 | 提交按钮 |
| `STUDENT_HIGHLIGHT_TOOLTIP` | 标记重点 | 工具提示 | 高亮工具提示 |
| `STUDENT_LOOKUP_TOOLTIP` | 查询生词 | 工具提示 | 查词工具提示 |
| `STUDENT_MARK_UNSURE` | 不确定 | 选项标记 | 不确定标记 |

### 教师端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `COACH_ACTIVITY_TITLE` | 实时活动记录 | 教师端 | 活动记录标题 |
| `COACH_STATS_TITLE` | 实时数据 | 教师端 | 统计数据标题 |
| `COACH_STAT_PROGRESS_LABEL` | 阅读进度 | 统计卡片 | 进度标签 |
| `COACH_STAT_HIGHLIGHTS_LABEL` | 高亮次数 | 统计卡片 | 高亮标签 |
| `COACH_STAT_LOOKUPS_LABEL` | 查词次数 | 统计卡片 | 查词标签 |
| `COACH_STAT_QUIZ_PROGRESS_LABEL` | 答题进度 | 统计卡片 | 答题进度标签 |

---

## 🎓 带练阶段 (coaching.ts)

### 学生端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `STUDENT_WAITING_TASK` | 等待老师发布任务... | 学生端 | 等待提示 |
| `STUDENT_BTN_RECEIVE` | 接收 | 任务模态框 | 接收任务按钮 |
| `STUDENT_BTN_SUBMIT_TASK` | 提交任务 | 学生端 | 提交任务按钮 |
| `STUDENT_TAB_ARTICLE` | 原文 | 标签页 | 原文标签 |
| `STUDENT_TAB_ANALYSIS` | 题目分析 | 标签页 | 分析标签 |
| `STUDENT_ANALYSIS_TITLE` | 我的做题分析 | 分析页面 | 分析标题 |
| `STUDENT_CORRECTING` | 正在纠正中 | 分析页面 | 纠正中提示 |

### 教师端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `COACH_BTN_START` | 开始精准带练 | 教师端 | 开始按钮 |
| `COACH_BTN_PUBLISH_TASK` | 发布任务 | 教师端 | 发布任务按钮 |
| `COACH_BTN_NEXT_PHASE` | 进入下一阶段 | 教师端 | 下一阶段按钮 |
| `COACH_BTN_CONFIRM_HIGHLIGHT` | 确认画线（红色） | 教师端 | 确认画线按钮 |
| `COACH_TASK_STATUS_ONGOING` | 进行中... | 任务状态 | 进行中状态 |
| `COACH_TASK_STATUS_COMPLETED` | 已完成 | 任务状态 | 完成状态 |
| `COACH_ANALYSIS_TITLE` | 做题分析报告 | 分析页面 | 分析标题 |

### 六步教学法
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `PHASE_0_NAME` | 准备阶段 | 教学流程 | 阶段0名称 |
| `PHASE_1_NAME` | 归因诊断 | 教学流程 | 阶段1名称 |
| `PHASE_2_NAME` | 技能召回 | 教学流程 | 阶段2名称 |
| `PHASE_3_NAME` | 路标定位 | 教学流程 | 阶段3名称 |
| `PHASE_4_NAME` | 搜原句 | 教学流程 | 阶段4名称 |
| `PHASE_5_NAME` | 纠编锁定 | 教学流程 | 阶段5名称 |
| `PHASE_6_NAME` | 技巧复盘 | 教学流程 | 阶段6名称 |

### 做题分析
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `ANALYSIS_LABEL_CORRECT` | 正确 | 分析报告 | 正确标签 |
| `ANALYSIS_LABEL_WRONG` | 错误 | 分析报告 | 错误标签 |
| `ANALYSIS_LABEL_GUESSED` | 蒙对 | 分析报告 | 蒙对标签 |
| `ANALYSIS_STUDENT_ANSWER` | 你的答案 | 分析报告 | 学生答案标签 |
| `ANALYSIS_CORRECT_ANSWER` | 正确答案 | 分析报告 | 正确答案标签 |

---

## 📚 生词阶段 (vocab.ts)

### 学生端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `STUDENT_SYLLABLE_MODE` | 音节拼读模式 | 卡片界面 | 音节模式提示 |
| `STUDENT_NORMAL_MODE` | 正常模式 | 卡片界面 | 正常模式提示 |
| `STUDENT_AI_MNEMONIC_TITLE` | AI助记 | 卡片背面 | AI助记标题 |
| `STUDENT_EXAMPLE_SENTENCE_TITLE` | 例句 | 卡片背面 | 例句标题 |
| `STUDENT_MIC_DISABLED` | 等待教师开启 | 麦克风按钮 | 禁用提示 |

### 教师端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `COACH_CARD_CONTROL_TITLE` | 单词卡片控制 | 教师端 | 控制区标题 |
| `COACH_BTN_PREV` | 上一个 | 教师端 | 上一个按钮 |
| `COACH_BTN_NEXT` | 下一个 | 教师端 | 下一个按钮 |
| `COACH_TEACHING_STEPS_TITLE` | C-E-O 教学步骤 | 教师端 | 步骤标题 |
| `COACH_STEP_1_PLAY` | 播放发音 | 教学步骤 | 步骤1 |
| `COACH_STEP_2_SYLLABLE` | 音节拆解 | 教学步骤 | 步骤2 |
| `COACH_STEP_3_REPEAT` | 跟读 | 教学步骤 | 步骤3 |
| `COACH_STEP_4_FLIP` | 翻转卡片 | 教学步骤 | 步骤4 |

### 出门测试
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `EXIT_TEST_TITLE` | 出门测试 | 测试界面 | 测试标题 |
| `EXIT_TEST_INSTRUCTION` | 请勾选已掌握的单词 | 测试界面 | 测试说明 |
| `EXIT_TEST_BTN_SUBMIT` | 提交检查 | 测试界面 | 提交按钮 |
| `EXIT_TEST_ALL_MASTERED` | 全部掌握！ | 测试结果 | 全部掌握提示 |

### 回炉重学
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `REMEDIAL_TITLE` | 回炉重学 | 回炉界面 | 回炉标题 |
| `REMEDIAL_PROGRESS` | 回炉单词 {current}/{total} | 回炉界面 | 进度显示 |

---

## ✂️ 难句阶段 (surgery.ts)

### 学生端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `STUDENT_WAITING` | 等待教师开始拆解... | 学生端 | 等待提示 |
| `STUDENT_CLICK_TO_DELETE` | 点击灰色部分可删除 | 学生端 | 操作提示 |
| `STUDENT_CHAT_PLACEHOLDER` | 输入消息... | 聊天输入框 | 输入占位 |

### 教师端
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `COACH_CONTROL_PANEL_TITLE` | 操作台 | 教师端 | 控制台标题 |
| `COACH_MODE_OBSERVE` | 观察模式 | 模式按钮 | 观察模式 |
| `COACH_MODE_TEACHER` | 教师模式 | 模式按钮 | 教师模式 |
| `COACH_MODE_STUDENT` | 学生模式 | 模式按钮 | 学生模式 |
| `COACH_BTN_RESET` | 重置 | 功能按钮 | 重置按钮 |
| `COACH_BTN_UNDO` | 撤回 | 功能按钮 | 撤回按钮 |

### Jarvis指导
| 字段名 | 文本内容 | 出现位置 | 用途说明 |
|-------|---------|---------|---------|
| `JARVIS_OBSERVE` | 当前是观察模式。请选择... | Jarvis卡片 | 观察模式指导 |
| `JARVIS_TEACHER_START` | 请点击句子中的修饰成分... | Jarvis卡片 | 教师模式开始 |
| `JARVIS_TEACHER_ONGOING` | 继续点击灰色部分删除... | Jarvis卡片 | 教师模式进行中 |
| `JARVIS_TEACHER_DONE` | 演示完成！现在切换到... | Jarvis卡片 | 教师模式完成 |
| `JARVIS_STUDENT` | 学生正在练习拆解... | Jarvis卡片 | 学生模式指导 |
| `JARVIS_AFTER_RESET` | 句子已重置... | Jarvis卡片 | 重置后指导 |
| `JARVIS_AFTER_UNDO` | 已撤回上一步操作... | Jarvis卡片 | 撤回后指导 |

---

## 📊 字段统计

| 文件 | 字段数量 | 主要类别 |
|-----|---------|---------|
| common.ts | 40+ | 导航、按钮、视频、聊天、加载 |
| warmup.ts | 20+ | 学员信息、兴趣标签、数据卡片 |
| skill.ts | 50+ | GPS定位法、口诀、演示、做题 |
| battle.ts | 15+ | 独立阅读、实时监控、统计 |
| coaching.ts | 40+ | 六步教学法、任务系统、分析报告 |
| vocab.ts | 35+ | C-E-O教学法、出门测试、回炉 |
| surgery.ts | 25+ | 难句拆解、模式切换、Jarvis指导 |
| **总计** | **225+** | **7个模块** |

---

## 🔄 使用方式

### 在组件中使用

```typescript
// 导入所需的文本配置
import { COMMON_TEXTS, SKILL_TEXTS } from '@/config/texts';

// 在组件中使用
function MyComponent() {
  return (
    <div>
      <h1>{SKILL_TEXTS.GPS_CARD_TITLE}</h1>
      <button>{COMMON_TEXTS.BTN_NEXT}</button>
    </div>
  );
}
```

### TypeScript 类型支持

```typescript
import { CommonTextKey, SkillTextKey } from '@/config/texts';

// 类型安全的字段引用
const buttonText: CommonTextKey = 'BTN_NEXT';
```

---

## 📝 维护说明

1. **新增文本**：在对应的 `.ts` 文件中添加，并更新此文档
2. **修改文本**：修改 `.ts` 文件中的值，保持键名不变
3. **删除文本**：先确认无引用，然后删除键并更新文档
4. **国际化准备**：所有字段已结构化，可直接对接 i18n 系统

---

## ⚠️ 注意事项

1. **不要直接在组件中硬编码文本**，统一使用配置文件
2. **字段命名遵循 SCREAMING_SNAKE_CASE** 约定
3. **每个字段必须有注释**，说明用途和位置
4. **保持配置文件和此文档同步**更新

---

**文档结束** | 如有疑问请联系前端团队

