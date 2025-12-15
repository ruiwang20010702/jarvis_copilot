# 文本配置使用指南

## 📖 简介

本目录包含项目中所有的文本字段配置，统一管理界面文案，方便维护和国际化。

## 📁 文件结构

```
/src/config/texts/
├── README.md           # 本文件
├── index.ts            # 统一导出
├── common.ts           # 通用文本（导航、按钮、视频、聊天等）
├── warmup.ts           # 热身阶段文本
├── skill.ts            # 技能阶段文本（GPS定位法）
├── battle.ts           # 实战阶段文本
├── coaching.ts         # 带练阶段文本（苏格拉底式教学）
├── vocab.ts            # 生词阶段文本（C-E-O教学法）
└── surgery.ts          # 难句阶段文本
```

## 🚀 快速开始

### 1. 导入文本配置

```typescript
// 导入单个模块
import { COMMON_TEXTS } from '@/config/texts';
import { SKILL_TEXTS } from '@/config/texts';

// 或者导入多个
import { 
  COMMON_TEXTS, 
  WARMUP_TEXTS,
  SKILL_TEXTS 
} from '@/config/texts';
```

### 2. 在组件中使用

```typescript
function MyComponent() {
  return (
    <div>
      {/* 使用通用文本 */}
      <button>{COMMON_TEXTS.BTN_NEXT}</button>
      
      {/* 使用技能阶段文本 */}
      <h1>{SKILL_TEXTS.GPS_CARD_TITLE}</h1>
      
      {/* 使用视频窗口文本 */}
      <p>{COMMON_TEXTS.VIDEO_STUDENT_PLACEHOLDER}</p>
    </div>
  );
}
```

### 3. 动态文本（带变量）

某些文本包含占位符 `{variable}`，需要手动替换：

```typescript
// 例如：WORD_COUNT: '当前 {current}/{total}'
const displayText = VOCAB_TEXTS.WORD_COUNT
  .replace('{current}', String(currentIndex + 1))
  .replace('{total}', String(totalWords));

// 或使用工具函数（可自行实现）
const displayText = formatText(VOCAB_TEXTS.WORD_COUNT, {
  current: currentIndex + 1,
  total: totalWords
});
```

## 📋 命名规范

### 字段命名约定

- **格式**：`SCREAMING_SNAKE_CASE`
- **前缀**：根据使用场景添加前缀
  - `STUDENT_` - 学生端专用
  - `COACH_` - 教师端专用
  - `BTN_` - 按钮文字
  - `JARVIS_` - Jarvis助教相关
  - 无前缀 - 通用或标题类

### 示例

```typescript
export const VOCAB_TEXTS = {
  // ✅ 好的命名
  STUDENT_MIC_DISABLED: '等待教师开启',
  COACH_BTN_NEXT: '下一个',
  EXIT_TEST_TITLE: '出门测试',
  
  // ❌ 不好的命名
  micDisabled: '...',        // 应使用大写
  button1: '...',            // 名称不语义化
  text_1: '...',             // 名称无意义
};
```

## 🔍 查找文本

### 方法1：按模块查找

根据功能模块选择对应文件：

- 需要导航/按钮/视频相关 → `common.ts`
- 热身阶段相关 → `warmup.ts`
- GPS定位法相关 → `skill.ts`
- 生词学习相关 → `vocab.ts`
- 等等...

### 方法2：全局搜索

在代码编辑器中全局搜索文本内容，例如搜索 `"播放发音"` 可找到：

```typescript
// vocab.ts
COACH_STEP_1_PLAY: '播放发音',
```

### 方法3：查看文档

参考 `/docs/TEXT_FIELDS_MAP.md` 获取完整字段列表和使用位置。

## ✏️ 添加新文本

### 步骤

1. **确定模块**：判断文本属于哪个阶段/功能模块
2. **添加字段**：在对应的 `.ts` 文件中添加新字段
3. **写注释**：添加 JSDoc 注释说明用途和位置
4. **更新文档**：在 `/docs/TEXT_FIELDS_MAP.md` 中添加新字段

### 示例

```typescript
// src/config/texts/skill.ts

export const SKILL_TEXTS = {
  // ... 现有字段
  
  /** 新增 - 错误提示 - 显示在做题界面底部 */
  QUIZ_ERROR_HINT: '请先选择一个选项',
  
} as const;
```

## 🔄 修改现有文本

### 步骤

1. 找到对应的配置文件和字段
2. 修改值（**不要修改键名**）
3. 保存文件，更改会立即生效

### 示例

```typescript
// 修改前
BTN_NEXT: '下一步',

// 修改后
BTN_NEXT: '继续',
```

### ⚠️ 注意

- **不要修改字段的键名**，因为代码中已有引用
- 如果必须修改键名，需要全局搜索替换所有引用

## 🌍 国际化准备

当前配置为纯中文，但结构已为国际化做好准备。

### 未来扩展为多语言

```typescript
// src/config/texts/common.ts (当前)
export const COMMON_TEXTS = {
  BTN_NEXT: '下一步',
};

// 未来可扩展为：
// src/config/texts/zh-CN/common.ts
export const COMMON_TEXTS_ZH = {
  BTN_NEXT: '下一步',
};

// src/config/texts/en-US/common.ts
export const COMMON_TEXTS_EN = {
  BTN_NEXT: 'Next',
};
```

## 📊 字段统计

| 模块 | 字段数 | 主要内容 |
|-----|--------|---------|
| common.ts | 40+ | 全局通用 |
| warmup.ts | 20+ | 热身阶段 |
| skill.ts | 50+ | GPS定位法 |
| battle.ts | 15+ | 独立阅读 |
| coaching.ts | 40+ | 苏格拉底教学 |
| vocab.ts | 35+ | 生词学习 |
| surgery.ts | 25+ | 难句拆解 |
| **总计** | **225+** | **7个模块** |

## 🛠️ 最佳实践

### ✅ 推荐做法

1. **统一使用配置**：所有文本都从配置文件导入，不要硬编码
2. **命名语义化**：字段名要清晰表达用途
3. **添加注释**：每个字段都写清楚在哪里使用
4. **保持同步**：修改后同步更新文档

### ❌ 避免做法

1. **不要硬编码**：❌ `<button>下一步</button>`
2. **不要缩写过度**：❌ `BTN_N` (应该是 `BTN_NEXT`)
3. **不要重复定义**：如果已有通用字段，不要在其他模块重复定义
4. **不要删除引用字段**：删除前先全局搜索是否有代码引用

## 📞 联系方式

如有疑问或需要新增字段，请联系前端团队。

---

**Happy Coding! 🎉**

