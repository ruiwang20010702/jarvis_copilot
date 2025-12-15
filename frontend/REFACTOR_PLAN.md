# 📋 S9 Reading Project - 阶段重构总体规划

## 🎯 目标

将 `Classroom.tsx` (5781 行) 按照 6 个教学阶段拆分成独立的模块化组件。

## 📁 新的目录结构

```
src/components/stages/
├── Warmup/          # 阶段1: 热身
│   ├── index.tsx
│   ├── StudentWarmupView.tsx
│   ├── CoachWarmupView.tsx
│   └── components.tsx
├── Skill/           # 阶段2: 技能习得
│   ├── index.tsx
│   ├── StudentSkillView.tsx      ✅ 已完成
│   ├── CoachSkillView.tsx        ⏳ 待完成
│   ├── config.ts                 ✅ 已完成
│   └── components.tsx            ✅ 已完成
├── Battle/          # 阶段3: 实战
│   ├── index.tsx
│   ├── StudentBattleView.tsx
│   ├── CoachBattleView.tsx
│   └── components.tsx
├── Coaching/        # 阶段4: 带练
│   ├── index.tsx
│   ├── StudentCoachingView.tsx
│   ├── CoachCoachingView.tsx
│   └── components.tsx
├── Vocab/           # 阶段5: 生词
│   ├── index.tsx
│   ├── StudentVocabView.tsx
│   ├── CoachVocabView.tsx
│   └── components.tsx
└── Surgery/         # 阶段6: 难句
    ├── index.tsx
    ├── StudentSurgeryView.tsx
    ├── CoachSurgeryView.tsx
    └── components.tsx
```

## 📊 代码分布统计 (Classroom.tsx)

| 阶段 | 组件名 | 起始行 | 结束行 | 代码量 | 状态 |
|------|--------|--------|--------|--------|------|
| **热身** | StudentWarmupView | ~1257 | ~1673 | ~400行 | ⏳ 待拆分 |
| **热身** | CoachWarmupView | ~3929 | ~4146 | ~220行 | ⏳ 待拆分 |
| **技能** | StudentSkillView | ~693 | ~1255 | ~560行 | ✅ 已拆分 |
| **技能** | CoachSkillView | ~3355 | ~3927 | ~570行 | ⏳ 待拆分 |
| **实战** | StudentBattleView | ~1674 | ~2367 | ~690行 | ⏳ 待拆分 |
| **实战** | CoachBattleView | ~4148 | ~4656 | ~510行 | ⏳ 待拆分 |
| **带练** | StudentCoachingView | ~2368 | ~3030 | ~660行 | ⏳ 待拆分 |
| **带练** | CoachCoachingView | ~4658 | ~5214 | ~560行 | ⏳ 待拆分 |
| **生词** | StudentVocabView | ~3031 | ~3172 | ~140行 | ⏳ 待拆分 |
| **生词** | CoachVocabView | ~5215 | ~5495 | ~280行 | ⏳ 待拆分 |
| **难句** | StudentSurgeryView | ~3173 | ~3285 | ~110行 | ⏳ 待拆分 |
| **难句** | CoachSurgeryView | ~5496 | ~5781 | ~285行 | ⏳ 待拆分 |
| **公共** | Header, StageNavbar, DevControls | ~36 | ~240 | ~200行 | ⚠️ 保留 |

**总计**: 约 5200 行需要拆分

## ✅ 拆分原则

1. **零破坏**: 不改变任何业务逻辑
2. **保留接口**: Props 和状态管理接口保持不变
3. **独立运行**: 每个阶段可以独立测试
4. **统一导出**: 通过 index.tsx 统一导出

## 🔄 重构步骤

### Step 1: 创建目录结构 ✅
```bash
mkdir -p src/components/stages/{Warmup,Skill,Battle,Coaching,Vocab,Surgery}
```

### Step 2: 逐个阶段拆分

#### 优先级排序:
1. ✅ **Skill (技能)** - 学生端已完成
2. ⏳ **Skill (技能)** - 教师端待完成
3. ⏳ **Battle (实战)** - 代码量最大，功能最复杂
4. ⏳ **Coaching (带练)** - 交互逻辑复杂
5. ⏳ **Warmup (热身)** - 相对简单
6. ⏳ **Vocab (生词)** - 简单
7. ⏳ **Surgery (难句)** - 简单

### Step 3: 更新主文件引用
```typescript
// components/Classroom.tsx (重构后)

import { StudentWarmupView, CoachWarmupView } from '../src/components/stages/Warmup';
import { StudentSkillView, CoachSkillView } from '../src/components/stages/Skill';
import { StudentBattleView, CoachBattleView } from '../src/components/stages/Battle';
import { StudentCoachingView, CoachCoachingView } from '../src/components/stages/Coaching';
import { StudentVocabView, CoachVocabView } from '../src/components/stages/Vocab';
import { StudentSurgeryView, CoachSurgeryView } from '../src/components/stages/Surgery';
import { StudentReviewView, CoachReviewView } from './Phase6_Review';

// 保留约 500 行 (Header + 路由逻辑)
```

### Step 4: 测试验证
- [ ] 所有阶段切换正常
- [ ] 学生端和教师端渲染正常
- [ ] Split 模式显示正常
- [ ] 状态同步正常

## 📦 每个阶段的标准文件结构

```
阶段名/
├── index.tsx                    # 统一导出
├── Student[阶段名]View.tsx      # 学生端主组件
├── Coach[阶段名]View.tsx        # 教师端主组件
├── components.tsx               # 通用子组件 (可选)
├── config.ts                    # 配置和常量 (可选)
└── README.md                    # 说明文档 (可选)
```

## 🎯 预期收益

- ✅ **可维护性**: 每个文件 < 500 行
- ✅ **可读性**: 职责清晰，逻辑独立
- ✅ **可测试性**: 每个阶段可独立测试
- ✅ **协作友好**: 多人可并行开发不同阶段
- ✅ **性能优化**: 可按需加载(Code Splitting)

## 📅 预计时间

- **Skill 阶段**: 1 小时 ✅ (学生端完成)
- **其他 5 个阶段**: 3-4 小时
- **总计**: 约 4-5 小时

## 🚀 当前进度

- [x] 创建目录结构
- [x] Skill 学生端组件拆分
- [ ] Skill 教师端组件拆分 (当前任务)
- [ ] Battle 阶段拆分
- [ ] Coaching 阶段拆分
- [ ] Warmup 阶段拆分
- [ ] Vocab 阶段拆分
- [ ] Surgery 阶段拆分
- [ ] 更新主文件引用
- [ ] 全量测试

---

**下一步行动**: 继续完成 Skill 教师端，然后按优先级逐个拆分其他阶段。

