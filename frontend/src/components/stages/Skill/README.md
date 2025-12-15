# 技能阶段组件重构文档

## 📋 概览

本文档说明技能阶段 (Skill Acquisition) 组件的重构方案。

## 🎯 重构目标

- **模块化**: 将技能阶段代码从 `Classroom.tsx` (5700+ 行) 中独立出来
- **可维护性**: 按功能拆分为多个小文件，方便维护和调试
- **零破坏**: 不改变任何业务逻辑，保持功能完全一致

## 📁 新文件结构

```
src/components/stages/Skill/
├── index.tsx                 # 模块入口，导出所有组件
├── StudentSkillView.tsx      # 学生端主组件 (约 400 行)
├── CoachSkillView.tsx        # 教师端主组件 (约 350 行) - 待完成
├── config.ts                 # 配置常量和类型定义
└── components.tsx            # 通用子组件集合
```

## 🔧 组件说明

### 1. StudentSkillView (学生端)

**功能**:
- 完全由教师端驱动的沉浸式学习体验
- 包含 6 个状态: waiting → overload → equip → demo → verify → complete

**状态机逻辑**:
```
skillNode (全局状态, 由教师控制)
  0 = waiting    (等待开始)
  1 = overload   (文字雨/痛点唤醒)
  2 = equip      (GPS 卡片装备)
  3 = demo       (圈-搜-锁演示)
  4 = verify     (Mini-Quiz 验证)
  5 = complete   (完成)
```

**使用的子组件**:
- `TextRainParticle`: 文字雨粒子动画
- `GPSEquipCard`: GPS 定位卡装备界面
- `InteractiveDemo`: 三步法交互演示
- `StudentToolbar`: 底部工具栏

### 2. CoachSkillView (教师端) - 待创建

**功能**:
- 2x2 网格布局控制台
- 实时监控学生状态
- C-M-A-V 流程控制面板
- Jarvis 智能提示系统

### 3. config.ts (配置文件)

包含:
- `TEXT_RAIN_WORDS`: 文字雨词汇表
- `SKILL_QUIZ_DATA`: Mini-Quiz 题目数据
- `SkillNode`: 技能节点类型定义

### 4. components.tsx (子组件)

包含所有可复用的 UI 组件:
- `TextRainParticle`
- `GPSEquipCard`
- `InteractiveDemo`
- `StudentToolbar`

## 📝 如何在主文件中使用

### 在 Classroom.tsx 中引入

```typescript
// 删除原有的 StudentSkillView 定义 (约 line 693-1255)
// 删除原有的辅助组件 (TextRainParticle, GPSEquipCard, etc.)

// 新增导入
import { StudentSkillView } from '../src/components/stages/Skill';

// StudentView 路由保持不变
const StudentView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const { currentStage } = useGameStore();
    
    // ... 其他路由逻辑不变
    
    return (
        <div className="w-full h-full bg-white relative">
            {currentStage === 'warm-up' && <StudentWarmupView />}
            {currentStage === 'skill' && <StudentSkillView />}  {/* 使用新导入的组件 */}
        </div>
    );
};
```

## ✅ 验证清单

重构完成后需要验证:

- [ ] 学生端：等待状态显示正常
- [ ] 学生端：文字雨特效正常播放
- [ ] 学生端：GPS 卡片可以正常装备
- [ ] 学生端：圈-搜-锁演示流程完整
- [ ] 学生端：Mini-Quiz 可以正常答题
- [ ] 学生端：答对后显示成功动画
- [ ] 教师端：时间轴节点状态正确
- [ ] 教师端：学生状态监控数据实时更新
- [ ] 教师端：Jarvis 提示内容正确
- [ ] 教师端：可以通过按钮推进流程
- [ ] 全局：学生和教师端状态同步

## 🚀 下一步计划

1. ✅ 创建 `StudentSkillView.tsx`
2. ✅ 创建 `config.ts`
3. ✅ 创建 `components.tsx`
4. ✅ 创建 `CoachSkillView.tsx`
5. ⏳ 更新 `Classroom.tsx` 中的导入
6. ⏳ 删除 `Classroom.tsx` 中的旧代码
7. ⏳ 测试所有功能

## 💡 注意事项

- **不要修改 store.ts**: 所有状态管理逻辑保持不变
- **保持接口一致**: 组件对外暴露的 Props 接口不变
- **渐进式重构**: 先完成技能阶段,再逐步重构其他阶段
- **保留注释**: 关键业务逻辑的注释要迁移到新文件

## 📚 相关文件

- `/store.ts` - 全局状态管理
- `/components/Classroom.tsx` - 主容器组件
- `/components/Phase6_Review.tsx` - 参考的其他阶段组件

