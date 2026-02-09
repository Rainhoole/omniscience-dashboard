# PRD - Omniscience AI Agent Overwatch

## 1. 文档信息
- 文档版本: v1.0
- 编写日期: 2026-02-09
- 依据: `前端/update` 下 4 个有效 UI 原型页面（1 个重复文件已忽略）
- 产品形态: Web 控制台（桌面优先）

## 2. 产品背景与目标
Omniscience 是一个多 AI Agent 协同工作台。用户需要在单一界面完成三件事：发起任务、审阅任务产物、追溯系统行为。

核心目标:
1. 把多 Agent 的任务流转可视化，降低人工监督成本。
2. 提供可审计的执行日志和时间线，支持事后追踪。
3. 提供 Agent 级别健康与配置入口，支持运维与调优。

非目标:
1. 不在当前版本实现复杂项目管理能力（如甘特图、依赖图）。
2. 不在当前版本实现移动端完整功能对等。

## 3. 用户角色与权限
1. Admin（管理员）
- 可创建任务、审批/归档任务、重启 Agent、修改 Agent 参数。
2. Reviewer（审阅者）
- 可查看任务细节与日志，可请求返修，可审批。
3. Observer（观察者）
- 只读查看看板、时间线、Agent 详情与活动流。

## 4. 关键场景
1. 用户在空闲系统中点击 `Summon Task`，创建新的任务指令。
2. 用户在 `Manifestation` 看板中打开任务详情，查看目标说明、内部对话、版本差异后执行审批或返修。
3. 用户在 `Chronology` 页面按 Agent 与时间范围筛选历史事件，追溯关键动作。
4. 用户进入 `Alpha Details` 页面，查看运行指标、任务历史并调整配置参数。

## 5. 信息架构（IA）
全局布局（三栏）:
1. 顶栏: 品牌、全局搜索、用户头像。
2. 左侧栏: Active Agents 列表 + 系统状态/时间范围。
3. 中间主区: 视图主体（Manifestation / Chronology / Agent Detail）。
4. 右侧栏: 实时流/统计流（The Stream、Activity Stats、Neural Trace）。

主视图:
1. Manifestation（任务看板）
2. Chronology（时间线）
3. Archive（归档视图，UI 有入口，MVP 可只读占位）
4. Agent Detail（Agent 详情页，当前原型为 Alpha）

## 6. 功能需求

### FR-001 全局导航与搜索
需求:
1. 顶栏显示品牌、搜索输入框、用户头像入口。
2. 支持在 `Manifestation / Chronology / Archive` 之间切换。
3. 搜索框支持按关键字检索任务、日志、记忆片段（统一搜索入口）。

验收标准:
1. 页面切换不丢失当前用户会话。
2. 搜索响应时间 P95 < 1.5s（50k 日志量基线）。

### FR-002 Active Agents 与系统状态
需求:
1. 左侧展示 Agent 列表（名称、角色、当前任务/状态、在线状态点）。
2. 展示系统健康信息（如 Memory、API 状态）。
3. Agent 卡片可点击进入对应 Agent 详情页。

验收标准:
1. Agent 在线状态 5 秒内更新到 UI。
2. Agent 列表按活跃度默认排序。

### FR-003 Manifestation 空态与任务召唤
需求:
1. 无任务时展示空态（The Void Awaits）和 `Summon Task` 主 CTA。
2. 点击 CTA 打开任务创建流程（MVP 可先弹窗 + 基础字段）。

验收标准:
1. 空态页面必须出现主 CTA，且视觉优先级最高。
2. 创建成功后任务进入看板首列并写入活动流。

### FR-004 任务看板（Kanban）
需求:
1. 提供至少四列状态（建议: Backlog / In Progress / Review / Done）。
2. 任务卡展示标题、Owner、更新时间、优先级标签。
3. 点击任务卡打开任务详情弹窗。

验收标准:
1. 支持拖拽或操作按钮改变任务状态。
2. 每次状态迁移写入审计日志（操作者、时间、前后状态）。

### FR-005 任务详情弹窗（Task Detail）
需求:
1. 展示任务元信息：Task ID、Owner、创建时间、分类标签、当前状态。
2. 展示 `Objective Description`（任务目标说明）。
3. 展示 `Internal Agent Dialogue`（多 Agent 对话日志，含时间戳与发言人）。
4. 展示版本区（Version 1..N，最新版本标记）。
5. 展示关联资源文件（如 `UserProfile.tsx`、`styles.module.css`）。
6. 提供操作按钮：`Request Revision`、`Archive`、`Approve Manifestation`。

验收标准:
1. `Approve Manifestation` 后任务进入完成态并记录审批人。
2. `Request Revision` 后任务回到执行态并生成返修记录。
3. `Archive` 后任务仅在 Archive 视图可见。

### FR-006 Chronology 时间线
需求:
1. 以时间分组展示事件（时间段 -> 事件卡）。
2. 事件卡包含 Agent、事件时间、标题、描述。
3. 支持按 Agent（All/Alpha/Beta/Gamma）和时间范围（24h/7d/Custom）筛选。
4. 右侧展示 24h 活动统计（效率分、Top Contributor、峰值时段）。

验收标准:
1. 筛选操作后 1 秒内刷新结果。
2. 事件按时间倒序，且跨天分组正确。

### FR-007 Agent Detail 页面
需求:
1. 展示 Agent 基础信息、运行状态、专长说明。
2. 展示指标卡（Memory Usage、Token Velocity、Success Rate、Uptime）。
3. 展示任务历史表（任务名、状态、时间、Token 消耗）。
4. 展示配置面板（模型、温度、记忆策略、人格设定）并支持保存。
5. 支持运维动作 `RESTART INSTANCE`。
6. 右侧展示 Agent 专属 `Neural Trace` 流。

验收标准:
1. 参数保存后需有成功反馈，并记录变更审计。
2. 重启动作必须二次确认，且展示执行结果。

### FR-008 Activity Feed（右侧流）
需求:
1. 支持不同视图下的右侧信息流（The Stream / Activity Stats / Neural Trace）。
2. 流数据实时更新，支持滚动与时间戳。
3. 不同来源使用颜色或标签区分（SYSTEM/ADMIN/Agent）。

验收标准:
1. 实时流端到端延迟 < 3 秒。
2. 流记录至少保留最近 7 天可查询。

## 7. 业务规则与状态机
任务状态建议:
1. Draft
2. In Progress
3. Pending Review
4. Approved
5. Archived
6. Failed

规则:
1. 仅 Admin/Reviewer 可执行 `Approve`。
2. 仅 Admin 可执行 `Archive` 与 `Restart Instance`。
3. 所有状态变更必须写审计日志，不可物理删除。

## 8. 数据模型（MVP）
核心实体:
1. Agent
- id, name, role, status, specialization, metrics, config, last_seen_at
2. Task
- id, title, objective, owner_agent_id, status, tags, priority, created_at, updated_at
3. TaskVersion
- id, task_id, version_no, artifact_size, created_at, created_by_agent_id
4. TaskDialogueLog
- id, task_id, speaker_agent_id, content, created_at
5. TimelineEvent
- id, agent_id, type, title, description, occurred_at, metadata
6. ActivityFeedItem
- id, source_type, source_id, message, level, created_at
7. AuditLog
- id, actor_id, action, resource_type, resource_id, before, after, created_at

## 9. 接口草案（MVP）
1. `GET /api/agents`
2. `GET /api/agents/{id}`
3. `POST /api/agents/{id}/restart`
4. `PATCH /api/agents/{id}/config`
5. `GET /api/tasks`
6. `POST /api/tasks`
7. `GET /api/tasks/{id}`
8. `POST /api/tasks/{id}/approve`
9. `POST /api/tasks/{id}/revision`
10. `POST /api/tasks/{id}/archive`
11. `GET /api/tasks/{id}/versions`
12. `GET /api/timeline?agent=&range=`
13. `GET /api/feed?scope=global|agent:{id}`

## 10. 非功能需求
1. 性能
- 首屏可交互时间 < 2.5s（桌面宽带环境）。
- 时间线 10k 事件下滚动无明显卡顿（>= 45 FPS）。
2. 可靠性
- 核心查询接口可用性 >= 99.9%。
3. 安全
- 基于 RBAC 的接口鉴权。
- 敏感操作需审计与防重放。
4. 可观测性
- 前端埋点 + 后端日志链路可关联（trace_id）。

## 11. 指标与埋点
业务 KPI:
1. 任务平均审批时长（TTA）
2. 返修率（Request Revision / 总审批）
3. Agent 成功率与失败任务占比
4. 用户日活（DAU）与审阅频次

关键埋点:
1. `click_summon_task`
2. `open_task_detail`
3. `approve_task`
4. `request_revision`
5. `archive_task`
6. `switch_timeline_filter`
7. `save_agent_config`
8. `restart_agent_instance`

## 12. 里程碑建议
1. M1（1-2 周）: 视图骨架 + 静态数据联调 + 路由
2. M2（2-3 周）: 任务看板 + 任务详情 + 审批流闭环
3. M3（2 周）: 时间线筛选 + Activity Stats + Agent Detail 配置保存
4. M4（1 周）: 权限、审计、性能优化、上线验收

## 13. 风险与待确认项
1. `Archive` 视图在原型中仅有入口，需确认信息结构与筛选规则。
2. `Summon Task` 创建流程字段未在原型中展开，需补充创建表单。
3. 时间线数据量增长后的分页/虚拟滚动方案需提前确定。
4. Agent 配置修改是否需要审批流需产品确认。

