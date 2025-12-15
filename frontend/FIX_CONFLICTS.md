# ⚠️ 紧急修复：删除 Classroom.tsx 中的旧组件定义

## 错误原因

Classroom.tsx 中有 **8 个命名冲突错误**：

```
导入声明与"StudentWarmupView"的局部声明冲突
导入声明与"CoachWarmupView"的局部声明冲突
导入声明与"StudentSkillView"的局部声明冲突
导入声明与"CoachSkillView"的局部声明冲突
导入声明与"StudentVocabView"的局部声明冲突
导入声明与"CoachVocabView"的局部声明冲突
导入声明与"StudentSurgeryView"的局部声明冲突
导入声明与"CoachSurgeryView"的局部声明冲突
```

## 原因

这些组件既被导入（从新模块），又在 Classroom.tsx 内部定义（旧代码），产生冲突。

## 解决方案

### 方案 A：手动删除（推荐，最安全）

打开 `components/Classroom.tsx`，搜索并删除以下内容：

#### 1. 删除 Skill 相关代码块（约 970 行）

**搜索**: `// 文字雨单词配置`
**删除范围**: 从 `const TEXT_RAIN_WORDS = [` 到 `StudentSkillView` 组件结束
**大约**: 第 284-1263 行

#### 2. 删除 StudentWarmupView（约 208 行）

**搜索**: `const StudentWarmupView: React.FC = () => {`
**删除范围**: 整个组件定义
**大约**: 第 1265-1472 行

#### 3. 删除 StudentSurgeryView（约 113 行）

**搜索**: `const StudentSurgeryView: React.FC`
**删除范围**: 整个组件定义
**大约**: 第 3181-3293 行

#### 4. 删除 CoachSkillView（约 575 行）

**搜索**: `const CoachSkillView: React.FC`
**删除范围**: 整个组件定义
**大约**: 第 3363-3937 行

#### 5. 删除 CoachWarmupView（约 216 行）

**搜索**: `const CoachWarmupView: React.FC`
**删除范围**: 整个组件定义
**大约**: 第 3939-4154 行

#### 6. 删除 CoachVocabView（约 373 行）

**搜索**: `const CoachVocabView: React.FC`
**删除范围**: 整个组件定义
**大约**: 第 5012-5384 行

#### 7. 删除 CoachSurgeryView（约 395 行）

**搜索**: `const CoachSurgeryView: React.FC`
**删除范围**: 整个组件定义
**大约**: 第 5390-5784 行

### 快速定位技巧

在 VSCode 中：
1. 按 `Cmd+F` (Mac) 或 `Ctrl+F` (Windows)
2. 搜索组件名，如 `const StudentWarmupView:`
3. 找到后，向下滚动找到组件结束的 `};`
4. 选中整个组件（包括前面的注释）
5. 删除
6. 保存文件

### 验证

删除后，应该看到：
- ✅ Linter 错误消失
- ✅ Classroom.tsx 减少约 2850 行
- ✅ 从 5790 行 → 约 2940 行

### 保留的组件

**不要删除**以下组件（它们还没有被提取）：
- ❌ `StudentBattleView`
- ❌ `CoachBattleView`
- ❌ `StudentCoachingView`
- ❌ `CoachCoachingView`
- ❌ `ChatPanel`

## 方案 B：使用 Git（如果你有版本控制）

```bash
# 1. 提交当前更改
git add .
git commit -m "Add modular stage components"

# 2. 如果出问题，可以回滚
git reset --hard HEAD
```

## 删除清单

删除时，请按此清单逐一确认：

- [ ] TEXT_RAIN_WORDS 常量
- [ ] TextRainParticle 组件
- [ ] GPSEquipCard 组件
- [ ] InteractiveDemo 组件
- [ ] StudentToolbar 组件
- [ ] SKILL_QUIZ_DATA 常量
- [ ] StudentSkillView 组件
- [ ] StudentWarmupView 组件
- [ ] StudentSurgeryView 组件
- [ ] CoachSkillView 组件
- [ ] CoachWarmupView 组件
- [ ] CoachVocabView 组件
- [ ] CoachSurgeryView 组件

完成后，所有冲突错误将自动消失！🎉

