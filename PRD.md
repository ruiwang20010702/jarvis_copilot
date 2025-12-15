# S9 课堂交互与 Jarvis Copilot 系统 PRD v1.0

> **作者**: 范针、王睿  
> **最后修改**: 昨天

---

## 文档属性

| 文档属性 | 详细信息 |
|---------|---------|
| 项目名称 | S9 前端课堂交互系统 (Front-end Interaction) |
| 版本号 | v1.0 |
| 核心场景 | L0-L3 分层阅读课堂 (TTT 模式) |
| 核心逻辑 | 预制数据驱动 + 实时干预触发 + 视觉降维体验 |
| 涉及端 | 学生端 (Web/Pad - 沉浸层), 教练端 (Admin/Pad - 控制层) |
| 目标 | 让普通教练拥有"名师大脑"，让每个级别学生拥有"开挂体验"。 |

---

## 1. 业务背景与核心价值 (Context & Value)

### 1.1 核心痛点：拒绝"一刀切"

传统大班课面临两难：照顾差生则优生"吃不饱"，照顾优生则差生"跟不上"。同时，普通教练难以在课堂上同时满足这两种截然不同的需求。

### 1.2 产品解决方案：千人千面

我们通过系统配置，将同一堂课裂变为两种核心体验，解决**"两头"**的问题：

#### 针对基础薄弱生 —— 核心策略：强支架 (Strong Scaffold)

- **痛点**：生词多、句子长、读不下去，容易产生畏难情绪。
- **解法**：系统主动提供"拐杖"。提供查词额度、长难句自动切分、视觉降维。
- **价值**：保信心。让他们"读得懂、坐得住"。

#### 针对高分/进阶生 —— 核心策略：撤支架 (Remove Scaffold)

- **痛点**：题目太简单，缺乏实战压力，逻辑陷阱识别能力弱。
- **解法**：系统主动撤去"拐杖"。全真原文呈现、倒计时施压、强制要求识别逻辑陷阱。
- **价值**：提效率。让他们"练极致、不仅对、还要快"。

#### 针对教练 —— 核心策略：名师大脑 (Copilot)

- **痛点**：无法分身或能力不达，不知道如何针对不同学生进行精准归因和对症下药。
- **解法**：AI 实时识别学生状态，推送差异化话术，教练演绎。
- **价值**：个性化教学的标准化。在不迁就个性化教学的前提下，降低师资门槛，确保交付质量。

---

## 2. 核心流程图 (User Flow Overview)

我们将一堂 45-60 分钟的微课拆解为 **"S9 战术六步法"**：

**入场 (Entry)** -> **实战 (Battle)** -> **带练 (Coaching)** -> **生词 (Vocab)** -> **难句 (Surgery)** -> **复盘 (Review)**

![S9 战术六步法流程图](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_s9_flow.png)

### 六步法详解

| 步骤 | 名称 | 英文 | 核心目标 |
|:---:|:---:|:---:|--------|
| 1 | 入场 | Entry | 热身导入，激活学习状态 |
| 2 | 实战 | Battle | 独立完成阅读理解，模拟真实考试 |
| 3 | 带练 | Coaching | 教练讲解，核心技能训练 |
| 4 | 生词 | Vocab | 词汇学习与巩固 |
| 5 | 难句 | Surgery | 长难句分析与理解 |
| 6 | 复盘 | Review | 总结回顾，数据分析 |

---

## 3. 功能需求详情 (Detailed Requirements)

### Phase 1: 入场与破冰 (Entry & Warm-up)

**核心逻辑**：基于标签（Tags）的冷启动，建立连接。

![Phase 1 入场与破冰](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase1_entry.png)

#### 界面布局

| 区域 | 说明 |
|-----|------|
| Content Area | 学生端沉浸式欢迎页 |
| Interaction Area | Coach Copilot 交互区 |

#### 学生端 (Student View)

**沉浸式欢迎页**：
- 显示今天是阅读挑战的第几天
- 显示今天的目标是x篇文章，锻炼的是xx技巧
- 锻炼技巧：主旨概括 & 细节理解

#### 教练端 (Coach Copilot)

**学情仪表盘**：
- 学生画像卡片：
  - Level: L0
  - 兴趣: 篮球
  - 状态: 上节课完课率 100%
- 话术提示：请用篮球话题破冰、建立信心，或引入预制开场白

**智能工具箱**：
- 发送预制开场白
- 话题库
- 快速问候
- 智能工具箱

#### 系统逻辑/数据源

- **Pre-fetch**：拉取 UserProfile
- **Fallback**：无兴趣标签时，加载通用破冰文案

---

### Phase 2: 实战演练 (The Battle)

**目标**：分层阅读体验。基础生"扶着走"，进阶生"跑着走"。

![Phase 2 实战演练](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase2_battle_1.png)

#### 界面布局

| 区域 | 说明 |
|-----|------|
| Student Content Area | 分层阅读体验区 |
| Coach Copilot Area | 教练监控与逻辑判断区 |

#### 模块功能对比

| 模块 | 基础模式 (Foundation Mode) | 进阶模式 (Challenge Mode) | 教练端监控与逻辑 |
|-----|--------------------------|-------------------------|---------------|
| **自适应阅读器** | **分段喂食**：文本如有多段，分段显示，屏幕可滚动。<br>**查词额度**：Limit=3 (防止依赖)。<br>**长难句**：自动变色断开 (Chunking)。 | **全真模拟**：纯净原文，无任何标记。<br>**查词限制**：禁止查词 (Hard Mode)。<br>**施压**：右上角显示倒计时。 | **[实时热力图]**<br>监控视口停留。<br>**数据记录**：<br>looked_up_words<br>reading_speed |
| **答题卡** | **信心标记**：选项旁可选 [不确定]。<br>**提交答案**：全部做完，提交，实时判题正误，显示题型类型，无需解析 | 同左。 | **[学情预判]**<br>选对但标记[不确定]->判定为 "蒙对 (Lucky Guess)"，Phase 3 与错题一并关注。<br><br>**[跳过判定]**：<br>逻辑：提交动作触发判断：<br>Score < 100 OR Has_Unsure_Tags ->加载 Phase 3 脚本，进入 Phase 3。<br>Score == 100 AND All_Sure-> 播放"完美通关"动效，跳过 Phase 3，直接进入 Phase 4。 |

![Phase 2 详细表格](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase2_battle_2.png)

---

### Phase 3: 精准带练 (Precision Coaching - Continuous Interaction Flow)

**核心逻辑**：全程无"垃圾时间"。利用 AI 赋能的工具链，将讲解过程转化为"老师发指令(AI给脚本) -> 学生做动作 -> AI 给脚本 -> 老师演绎反馈"的连续互动流。

![Phase 3 精准带练](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase3_coaching_1.png)

#### 功能详解

| 维度 | 学生端 (Student View - Active Arena) | 教练端 (Coach Copilot - Director) | 系统逻辑 / 数据源 |
|-----|-------------------------------------|--------------------------------|---------------|
| **界面与交互** | **1. 全时互动工作台**<br>- 始终解锁：屏幕保持可操作状态，工具栏常驻。<br>- 激光笔跟随：看到老师的红色光点在移动，引导视线，但无需锁定屏幕。<br><br>**2. 智能交互工具**<br>- 语音回答：按住麦克风 -> 语音实时转文字上屏 (STT)。<br>- 场景：回答老师的提问"这里的主语是谁？"<br>- 无限查词：此阶段查词不限次数，且所有查询词自动去重计入"生词债务"列表。<br><br>**3. 任务响应**<br>- 收到老师指令（如"画出证据"）时，界面弹出引导动效，强制要求完成划线/选择操作。 | **1. 归因仪表盘**<br>- 病灶诊断：<br>"Alex 选了 B，这是【偷换概念】陷阱。"<br>"Lisa 选对但标记[不确定]，属于【蒙对 (Lucky Guess)】。"<br><br>**2. 苏格拉底话术 (Socratic Script)**<br>- Step 1 定位引导：<br>"别急着选。Alex，这道题问'Why'，请在原文画出原因句。"<br>(点击 [Push Action] 触发学生端弹划线任务)<br>- Step 2 逻辑排雷：<br>"看你画的这句。B 选项用了 All，但原文是 Most，这犯了什么错？"<br>(等待学生语音/划词回答)<br><br>**3. 实时动作监控**<br>- 镜像投屏：实时看到学生的划线轨迹、查词弹窗和语音转写内容。<br>- 高亮原文：点击面板上的关键词，学生端同步高亮（作为标准答案演示）。<br><br>**4. 死锁兜底**<br>在教练端增加 [一键显示答案/强制下一步] 按钮。<br>逻辑：当学生连续 3 次操作失败，按钮高亮提示教练"Alex 似乎卡住了，建议接管"，点击后直接展示正确状态并进入下一 Step。 | **1. 数据源 (Data Source)**<br>AI Tutor 解析库：基于 Question_ID 获取预制的逻辑链分析 (AItutor类型)。<br><br>**2. 实时交互(Real-time Logic)**<br>- Speech-to-Text (STT)：低延迟语音转写服务。<br><br>**3. 数据回环 (Data Loop)**<br>- 生词合并：<br>Total_Vocab = Phase2_Words $\cup$ Phase3_Words。<br><br>逻辑：Phase 3 查过的词说明听讲时依然有障碍，必须在 Phase 4 复见。 |

![Phase 3 详细表格](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase3_coaching_2.png)

---

### Phase 4: 生词攻克 (Vocab Blitz & Exit Pass)

**核心逻辑**：认知 (看) -> 输出 (读) -> 验证 (检)。

**前置判断**：`Total_Vocab = Phase2_Lookups + Phase3_Queries`。若列表为空，直接跳过并播放"词汇大师"成就动效。

![Phase 4 生词攻克 Step 1&2](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase4_vocab_3.png)

#### 功能详解

| 模块 | 学生端 (Student Immersive) | 教练端 (Coach Copilot) | 系统逻辑 / 数据埋点 |
|-----|---------------------------|---------------------|-----------------|
| **Step 1: 3D 词卡 (认知输入)** | **视觉切分**：ob-sess-ed (音节按颜色切分)。<br><br>**语境回溯**：卡片下方显示原文句子截图，单词高亮。<br><br>**AI 助记**：显示 AI 生成的一句话联想记忆。 | **[实时伴学]**<br>- 同步视窗：教练屏幕实时镜像学生正在看的词卡（如：正停留在 obsessed）。<br>- 控制：<br>  - 领读：点击 [Play Standard]-> 学生端强制播放标准音。<br>  - 提示：点击 [Show Hint] -> 学生端高亮助记句。 | **前置判断**：<br>无查词记录则跳过。<br><br>**数据**：<br>view_duration_per_word |
| **Step 2: 录音跟读 (口语输出)** | **强制对比模式**：<br>按住录音 -> 松开-> 先播 [User] -> 后播 [Standard]。<br><br>**确认**：点击 [我记住了] 进入下一词。 | **[即时反馈]**<br>- 自动播放：学生松开手指，教练端自动播放刚才的录音（无需点击）。<br>- 评价交互：<br>  - 点击 👍 [Great]->学生端炸开烟花。<br>  - 点击 🔄 [Retry]-> 学生端弹窗"再试一次"。 | **降级策略**：<br>无麦克风权限时，切为"听音选义"。 |
| **Step 3: 出门确认 (Exit Pass)** | **生词清单 (Checklist)**：<br>展示本节课所有生词，左侧为单词，右侧为复选框（默认空）。<br><br>**交互逻辑 (The Loop)**：<br>1. 自检：点击单词发音-> 尝试说出意思。<br>2. 验证：<br>  - 会了：点击 ✅ -> 变绿且划掉。<br>  - 忘了：点击单词文本 ->弹出 3D 词卡(强制复习) ->关闭后回到列表 $->再次尝试勾选。<br><br>**3. 下课门禁 (Gatekeeper)**：<br>- 只有当所有单词都打上 ✅ 后，底部的[完成本课] 按钮才会亮起。<br>- 否则按钮置灰，提示"还有单词没掌握哦"。 | **[验收官模式]**<br>- 实时同步：看到学生勾选了几个，还剩几个。<br>- 复习监控：当学生点击"忘了"回炉时，教练端提示："正在复习 obsessed，这是他第 2 次回炉。"<br>- 话术引导："Alex，只剩最后两个了，点进去再看一眼助记图，我们一定能拿下的！" | **- Result**: 最终状态必为 100% 勾选。<br><br>**- Effort (努力值)**：<br>记录每个单词的 Retry_Count (回炉次数)。<br>- Retry == 0: 秒杀词 (Solid)<br>- Retry > 0: 易错词 (Shaky)<br><br>**逻辑约束**：<br>未全选时，阻断进入 Phase 5。 |

![Phase 4 生词攻克 Step 3](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase4_vocab_4.png)

---

### Phase 5: 难句突破 (Sentence Surgery)

**核心逻辑**：视觉降维（看）+ AI 逻辑讲解（听）= 双维深度学习

![Phase 5 难句突破](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase5_surgery_1.png)

#### 功能详解

| 交互步骤 | 学生端 (Student View) | 教练端 (Coach Copilot) | 后台数据支撑 |
|--------|---------------------|---------------------|----------|
| **Step 1: 启动手术** | **挑战界面**<br>只显示长难句，字号超大。等待老师操作。 | **手术控制台**<br>- 显示该句的结构概览。<br>- Start 按钮："准备好了吗？我们要开始切分了。" | Original_Text |
| **Step 2: 视觉切分 (Visual)** | **降维动画**<br>- 老师点击后，修饰语（从句/状语）瞬间 Fade Out (变灰)。<br>- 主干（S-V-O）高亮发光。<br>- 视觉冲击：一句 30 个词的长句，瞬间只剩下 5 个核心词。 | **同步动画**<br>老师端同步看到动画效果。<br>(确保指读同步) | Surgery_Data<br>(chunks: [core, modifier]) |
| **Step 3: 逻辑讲解 (Logic)** | **激光笔跟随**<br>学生不看文字解析，而是看老师的激光笔在屏幕上画圈、划线。<br>(保持沉浸，听老师讲) | **AI 讲解逐字稿 (Copilot Script)**<br>【AI 辅管区域】<br>Jarvis 提示老师怎么讲：<br>1. 定语从句："Alex，看到这个 who 了吗？（操作：画出 who）。它像个钩子，把后面这一长串都挂起来了，这一串只是修饰语，不影响主干，我们先把它划掉，现在看剩下的，Boy is my brother，是不是瞬间懂了？"<br>2. 主干确认："现在看剩下的，Boy is my brother，是不是瞬间懂了？" | Coach_Script<br>(来自后台 长难句AI tutor分层<br>Prompt: "针对 L0 学生，用比喻句解释定语从句"；针对L3学生，追问这句话的逻辑重心是前半句还是后半句？") |
| **Step 4: 跟读内化** | **跟读复述**<br>学生跟读一遍"瘦身"后的主干句。 | **发音反馈**<br>老师给予鼓励。 | Core_Sentence_Audio |

![Phase 5 详细表格](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase5_surgery_2.png)

---

### Phase 6: 课堂回顾与日志 (Review & Learning Log)

**核心逻辑**：即时成就反馈 (Gamification) + 异步深度数据报告 (Data Visualization)。为学生提供"爽感"（游戏化结算），为家长提供"掌控感"（可视化数据），形成口碑传播的社交货币。

![Phase 6 课堂回顾与日志](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase6_review_1.png)

#### 功能详解

| 模块 | 交互端 (View) | 界面呈现与交互细节 (UI/UX) | 系统逻辑 / 数据埋点 (Backend Logic) |
|-----|-------------|----------------------|---------------------------|
| **6.1 课堂总结 (The Wrap-up)** [即时反馈] | **学生端** (Student Immersive)<br><br>**教练端** (Coach Copilot) | **[游戏化结算页 (Game Over Screen)]**<br>- 视觉风格：高饱和度游戏通关特效（星星/烟花/庆祝）。<br>- 核心成就：<br>  ⭐ 击败大魔王：Count 个（今日攻克的长难句）。<br>  💎 收获宝石：Count 个（今日掌握的生词）。<br>  🎯 专注度：100%（基于互动响应率计算）。<br><br>交互：教练点击 [Generate Report]->学生端弹出结算动画。 | **数据聚合 (Data Aggregation)**：<br>- 统计 Phase 5 完成的 Surgery_Count。<br>- 统计 Phase 4 最终 Check 的 Mastery_Count。<br>- 计算 Response_Rate 作为专注度指标。 |
| **6.2 学习日志 (H5 Report)** [异步推送] | **家长/学生端** (WeChat H5)<br><br>[核心体验]<br>Context Replay | **维度 1：解码力 (Decoding Power)**<br>- 内容：展示本课核心生词 + 长难句列表。<br>- 交互（语境时光机）：点击单词 obsessed -> 跳转至阅读器在 Phase 2/3 时的高亮快照 (Snapshot)。<br>价值：证明单词是在文章里学会的，不是死记硬背。<br><br>**维度 2：破局力 (Pattern Power)**<br>- 内容：错题归因雷达图。<br>- 话术："Alex 今天成功识别了 2 个【偷换概念】陷阱，但在【指代关系】的侦查上还需加强。"<br><br>**维度 3：课堂高光 (Highlights)**<br>- 内容：嵌入一段 15-30s 音频。<br>- 来源：Phase 4 中评分最高、最自信的那一次单词/句子跟读录音。 | **快照生成 (Snapshot Generation)**：<br>- 在 Phase 2/3 学生查词或划线时，系统自动截取当前 Viewport + Highlight_State 存储为图片或渲染数据。<br>- H5 点击触发懒加载弹窗加载该快照。<br><br>**归因分析 (Attribution Analysis)**：<br>- 聚合 Phase 3 中的 Error_Tag 数据。<br>- 调用 Feedback_Template 生成针对性评语。<br><br>**素材筛选 (Asset Selection)**：<br>- 选取 Phase 4 中 Coach_Feedback == Great 或 Self_Confidence == High 的音频片段。 |

![Phase 6 详细表格](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_phase6_review_2.png)

---

## 4. 异常与兜底策略 (Edge Cases)

![异常与兜底策略](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_edge_cases.png)

### 4.1 断网/掉线

- **学生端**：缓存当前页面，显示"老师正在路上..."，重连后恢复到断线前的 Step。
- **教练端**：提示"Alex 掉线"，Copilot 自动暂停流程。

### 4.2 Copilot 脚本缺失

- 若后台数据异常，未生成该题的引导话术。
- **兜底**：教练端显示通用话术："请引导学生重新阅读题干关键词。"

---

## 5. 技术架构

### 5.1 前端技术栈

- **框架**：React / Next.js
- **状态管理**：Context API / Redux
- **样式**：CSS Modules / Styled Components
- **实时通信**：WebSocket

### 5.2 后端技术栈

- **服务框架**：FastAPI / Node.js
- **数据库**：PostgreSQL
- **缓存**：Redis
- **AI 服务**：Google Gemini API

---

## 6. 里程碑规划

| 阶段 | 内容 | 预计时间 |
|-----|------|---------|
| MVP | 核心交互流程 + 基础 Copilot 功能 | 2 周 |
| V1.0 | 完整学生端 + 教练端基础功能 | 4 周 |
| V1.5 | Copilot 智能化升级 | 6 周 |
| V2.0 | 数据分析 + 个性化推荐 | 8 周 |

---

## 7. 成功指标

### 7.1 业务指标
- 教练备课时间减少 50%
- 学生课堂参与度提升 30%
- 不同水平学生满意度均达到 4.5/5

### 7.2 技术指标
- 页面加载时间 < 2s
- 实时消息延迟 < 100ms
- 系统可用性 > 99.9%

---

## 附录

### A. 参考设计

![PRD 原始设计图](/Users/ruiwang/.gemini/antigravity/brain/1de8d307-6173-4681-8b8e-98fde24049af/prd_original_image.png)

### B. 术语表

| 术语 | 定义 |
|-----|------|
| TTT 模式 | Teacher-to-Teacher 培训模式 |
| L0-L3 | 学生水平等级划分 |
| Copilot | AI 智能辅助助手 |
| 沉浸层 | 面向学生的纯净学习界面 |
| 控制层 | 面向教练的管理操作界面 |
