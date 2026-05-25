<p align="center">
  <img src="https://img.icons8.com/fluency/96/idea.png" alt="logo" width="80" />
</p>

<h1 align="center">🧠 智面 · ZhiMian</h1>
<p align="center"><strong>智能面试训练平台 · 前端</strong></p>
<p align="center">
  <em>AI 模拟面试交互界面 — 流式对话 · 实时评分 · 能力可视化</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-%234FC08D?logo=vuedotjs" alt="Vue" />
  <img src="https://img.shields.io/badge/Vite-6.2-%23646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Element_Plus-2.14-%23409EFF?logo=element" alt="Element Plus" />
  <img src="https://img.shields.io/badge/ECharts-6.1-%23AA344D?logo=apacheecharts" alt="ECharts" />
  <img src="https://img.shields.io/badge/STOMP-WebSocket-%2300C853" alt="STOMP" />
  <img src="https://img.shields.io/badge/Hash_Router-4.5-%23333" alt="Vue Router" />
  <img src="https://img.shields.io/badge/ESM-Modern-%23F7DF1E?logo=javascript" alt="ESM" />
</p>

---

> ⚠️ **重要：下载代码后请先安装依赖。**  
> 本项目使用 Vue 3 + Vite + Element Plus + ECharts + STOMP 等技术栈，依赖较多。  
> **必须执行 `npm install` 安装所有依赖后才能启动开发服务器或构建。**  
> Node.js 版本要求 ≥ 18，npm ≥ 9。

---

## 📋 目录

- [环境要求](#-环境要求)
- [项目概览](#-项目概览)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [路由设计](#-路由设计)
- [功能特性](#-功能特性)
- [核心交互流程](#-核心交互流程)
- [样式体系](#-样式体系)
- [部署方案](#-部署方案)
- [开发指南](#-开发指南)

---

## 🖥 环境要求

| 依赖 | 版本要求 | 验证命令 |
|------|----------|----------|
| Node.js | ≥ 18 | `node --version` |
| npm | ≥ 9 | `npm --version` |

---

## 🚀 项目概览

**智面前端**是一个基于 Vue 3 + Vite 构建的 AI 模拟面试单页应用。通过 SSE（Server-Sent Events）与后端建立流式长连接，实现类实时聊天的面试体验——AI 逐字输出问题、用户键盘作答、评分即刻呈现。

### 核心体验

| 体验 | 说明 |
|------|------|
| 💬 **流式对话** | AI 逐字输出，打字机效果，`ReadableStream` 解析 SSE |
| 🎯 **岗位选择** | 11 岗位卡片网格，简历上传一键关联专属面试 |
| 📊 **实时评分** | 四维度进度条 + 环形总分图 + 改进建议列表 |
| 📋 **能力报告** | 总分环形图 + AI 结构化分析 + 学习建议 + Markdown 导出 |
| 💬 **实时聊天** | STOMP WebSocket 公共聊天室 + 禁言管理 + @提及通知 |
| 🛡 **导航保护** | 面试中离开弹窗确认，防止意外中断 |
| 🛠 **管理后台** | 仪表盘 + 用户管理 + 模型切换 + 数据分析（ECharts） |

---

## 🛠 技术栈

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5+ | Composition API + 响应式系统 |
| Vite | 6.2+ | ESM 原生 HMR，极速开发体验 |
| Element Plus | 2.14+ | 企业级 UI 组件库（表单/卡片/进度条/弹窗/骨架屏） |
| Vue Router | 4.5+ | Hash 路由 + 导航守卫 |
| ECharts | 6.1+ | 管理后台数据可视化图表 |
| @stomp/stompjs | 7.3+ | STOMP WebSocket 客户端（聊天室） |
| @element-plus/icons-vue | 2.3+ | Element Plus 矢量图标库 |
| 原生 Fetch API | - | HTTP 请求 + SSE 流式解析（零额外 HTTP 依赖） |

### 依赖关系

```
Vite 6.2
└── @vitejs/plugin-vue 5.2

Vue 3.5
├── vue-router 4.5    → Hash 路由
├── element-plus 2.14 → UI 组件库
├── echarts 6.1       → 数据可视化
├── @stomp/stompjs 7.3 → WebSocket 聊天
└── @element-plus/icons-vue 2.3 → 图标
```

### 设计决策

| 决策 | 理由 |
|------|------|
| **不使用 Axios** | 原生 `fetch()` 已满足需求，`ReadableStream` 是 SSE 必需的底层 API，减少一个依赖 |
| **不使用 EventSource** | `EventSource` 不支持 `Authorization` 请求头，自定义 `fetch` + `ReadableStream` 实现 JWT 认证的 SSE |
| **不使用 Pinia** | 项目规模适中，组件内 `ref` + 路由传参足以管理状态，无需额外状态管理库 |
| **Hash 路由** | 后端无配置兼容性最佳，刷新不 404 |
| **Vite 代理** | 开发环境 `/api` → `localhost:8080`，`/ws` → WebSocket 代理，无需 CORS 配置 |

---

## 📁 项目结构

```
zhimian01web/
├── index.html                          # HTML 入口（lang="zh-CN"）
├── vite.config.js                      # Vite 配置（代理 /api → :8080, /ws → ws）
├── package.json                        # 依赖清单 + 脚本
├── package-lock.json                   # 依赖锁定
│
└── src/
    ├── main.js                         # 应用入口
    │   ├── createApp(Vue)
    │   ├── app.use(ElementPlus)
    │   ├── app.use(Router)
    │   └── 全局样式引入
    │
    ├── App.vue                         # 根组件（布局容器 + 导航守卫）
    │   ├── 🧭 毛玻璃导航栏（sticky, backdrop-filter）
    │   │   ├── 品牌 Logo（渐变色 + 脉冲动画）
    │   │   ├── 面试 / 历史 / 交流 菜单
    │   │   ├── 管理员：仪表盘 / 用户管理 / 数据分析
    │   │   └── 用户下拉（退出登录）
    │   ├── 📄 Router View（含 fade 过渡动画）
    │   └── 🛡 confirmLeaveActiveInterview() 导航保护
    │
    ├── style.css                       # 全局样式
    │   ├── 渐变背景动画 (gradientShift, 30s)
    │   ├── 卡片通用样式（圆角 14px + 悬浮上浮）
    │   ├── 页面过渡动画（fade / slide-up）
    │   ├── 弹窗缩放动画 (dialog-fade)
    │   ├── 毛玻璃导航栏 + 激活态渐变下划线
    │   ├── 错峰入场工具类 (stagger-delay-1~8)
    │   ├── 自定义滚动条 + 文本选中色
    │   └── 响应式适配 (@media max-width: 640px)
    │
    ├── api/
    │   ├── index.js                    # API 主文件
    │   │   ├── request()              # 通用 fetch 封装（Token 注入 + 401 拦截）
    │   │   ├── createSSE()            # SSE 连接工厂（ReadableStream）
    │   │   ├── 认证模块               # login / register / getMe / captcha
    │   │   ├── 面试模块               # checkLock / create / start / submit / next / finish
    │   │   ├── 模板/报告/简历         # 接口封装
    │   │   ├── exportReportMd()       # 报告 Markdown 导出下载
    │   │   └── Token 管理             # getToken / setToken / clearToken / getRole / setRole
    │   ├── admin.js                    # 管理后台 API
    │   │   ├── getDashboard / getUsers / getUserDetail
    │   │   ├── setUserStatus / getLockedUsers / getAnomalies
    │   │   ├── getAnalytics / getProvider / switchProvider
    │   │   └── getUserSessions
    │   └── chat.js                     # 聊天室 API
    │       ├── getRooms / getHistory / getOnlineUsers
    │       ├── muteUser / unmuteUser / getMutedUsers
    │       └── getSpeakers
    │
    ├── lib/
    │   └── stomp.js                    # STOMP WebSocket 封装
    │       ├── connectPersonal()       # 建立个人连接（JWT 认证）
    │       ├── subscribeRoom()         # 订阅房间消息
    │       ├── publish()               # 发送 STOMP 消息
    │       ├── onConnected()           # 连接成功回调
    │       └── disconnectAll()         # 断开所有连接
    │
    ├── router/
    │   └── index.js                    # 路由配置
    │       ├── 14 条路由规则
    │       ├── createWebHashHistory
    │       └── beforeEach 守卫（auth + admin 权限校验）
    │
    ├── components/
    │   └── ResumeUpload.vue           # 简历上传组件
    │       ├── 📤 拖拽/点击上传区（仅 .md）
    │       ├── 🔒 账号锁定态
    │       ├── 📄 已上传简历展示 + AI 分析摘要
    │       └── 🏷 技能标签列表
    │
    └── views/                          # 页面视图
        ├── LoginView.vue              # 🔐 登录页
        │   ├── 🎨 左侧品牌装饰区（渐变 + 插图）
        │   └── 📝 右侧登录表单（验证码 + 图形刷新）
        │
        ├── RegisterView.vue           # 📝 注册页
        │   └── 与登录页对称的双栏布局
        │
        ├── TemplateView.vue           # 🎯 岗位选择页
        │   ├── 📤 简历上传区
        │   ├── 🃏 11 岗位卡片网格（emoji 图标 + 难度/风格/轮次标签）
        │   ├── 📄 简历专属标记
        │   └── 创建确认弹窗（锁定检查 + 轮次修改 1-12）
        │
        ├── InterviewView.vue          # 💬 面试核心页（全屏）
        │   ├── 头部信息栏（标题 + 轮次 + 状态标签）
        │   ├── 消息气泡列表（左 AI / 右用户，时间戳）
        │   ├── 欢迎区（未开始时展示功能特性）
        │   ├── ⌨️ 回答输入区（Enter 发送, Shift+Enter 换行）
        │   ├── 🔄 SSE 流式接收（打字机效果 + 三点加载动画）
        │   ├── 📊 嵌入评分卡片（环形图 + 四维进度条 + 建议）
        │   └── 🎮 操作按钮区（下一题/完成/中断恢复）
        │
        ├── HistoryView.vue            # 📋 面试历史
        │   ├── 历史列表卡片（岗位/时间/状态标签）
        │   └── 空状态引导
        │
        ├── HistoryDetailView.vue      # ⏳ 面试详情
        │   ├── 会话概览卡片
        │   └── 问答时间线 + 评分展开查看
        │
        ├── ReportView.vue             # 📊 面试报告
        │   ├── 🎯 总分环形图（conic-gradient）
        │   ├── 📝 AI 四维能力分析
        │   ├── 📚 学习建议列表
        │   └── 📥 Markdown 导出按钮
        │
        ├── ChatView.vue               # 💬 公共聊天室
        │   ├── 在线用户列表
        │   ├── 消息列表（文本/系统/置顶/撤回）
        │   ├── 输入区（Enter 发送 + @提及弹窗）
        │   └── 管理员：禁言管理
        │
        └── admin/                     # 🛠 管理后台
            ├── AdminDashboard.vue     # 仪表盘（用户数/面试数/在线数）
            ├── AdminUsers.vue         # 用户管理（列表/搜索/锁定/详情）
            └── AdminAnalytics.vue     # 数据分析（ECharts 图表）
```

---

## ⚡ 快速开始

### 1️⃣ 安装依赖

```bash
# ⚠️ 首次使用必须执行，否则无法启动
npm install
```

### 2️⃣ 启动开发服务器

```bash
# 确保后端已在 :8080 运行
npm run dev
```

前端默认启动在 **`http://localhost:3000`**，Vite 自动将 `/api` 代理到 `http://localhost:8080`。

### 3️⃣ 构建生产版本

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览生产构建
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖（首次必执行） |
| `npm run dev` | 启动开发服务器（HMR 热更新） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

---

## 🧭 路由设计

### 路由表

| 路径 | 页面 | 认证 | 角色 | 说明 |
|------|------|------|------|------|
| `/login` | LoginView | 公开 | - | 登录（双栏布局 + 验证码） |
| `/register` | RegisterView | 公开 | - | 注册 |
| `/` | → `/login` | - | - | 根路径重定向 |
| `/templates` | TemplateView | JWT | - | 岗位选择 + 简历上传 |
| `/interview/:id` | InterviewView | JWT | - | 面试对话（全屏） |
| `/history` | HistoryView | JWT | - | 面试历史列表 |
| `/history/:id` | HistoryDetailView | JWT | - | 逐题回顾 + 评分 |
| `/report/:sessionId` | ReportView | JWT | - | 能力分析报告 |
| `/chat/:id` | ChatView | JWT | - | 公共聊天室 |
| `/chat` | → `/chat/1` | JWT | - | 默认聊天室 |
| `/admin/dashboard` | AdminDashboard | JWT | ADMIN | 管理仪表盘 |
| `/admin/users` | AdminUsers | JWT | ADMIN | 用户管理 |
| `/admin/analytics` | AdminAnalytics | JWT | ADMIN | 数据分析 |

### 导航守卫

```javascript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('zhimian_token')
  const role = localStorage.getItem('zhimian_role') || ''

  // 需要认证但无 Token → 跳转登录
  if (to.meta.auth && !token) return next('/login')

  // 管理员路由但非 ADMIN → 跳转岗位页
  if (to.meta.admin && role !== 'ADMIN') return next('/templates')

  // 非管理员访问 /admin → 跳转岗位页
  if (to.path.startsWith('/admin') && role && role !== 'ADMIN') return next('/templates')

  next()
})
```

---

## 🎯 功能特性

### 认证模块

- 双栏布局：左侧品牌装饰区 + 右侧表单
- 图形验证码（Base64 图片 + 点击刷新）
- JWT 持久化至 `localStorage`（`zhimian_token` + `zhimian_role`）
- Token 过期自动跳转登录页（API 层 401 拦截）
- 退出登录清除 Token + 断开 WebSocket + 刷新页面

### 岗位选择

- 11 岗位精美卡片（含 emoji 图标 + 难度/风格/轮次标签）
- 简历上传后卡片显示 📄 专属标记
- 「其他岗位」强制要求上传简历
- 创建前检查账号锁定（≥3 个未完成面试禁止新建）
- 两步确认弹窗：开始警告 → 轮次修改（1-12 轮可调）

### 面试对话（核心）

- **消息气泡**：AI 灰色左对齐 / 用户蓝色右对齐，带时间戳
- **打字机效果**：SSE `question_chunk` 事件逐字追加
- **加载动画**：三点闪烁 `@keyframes blink`
- **快捷键**：`Enter` 发送，`Shift+Enter` 换行
- **评分卡片**：嵌入在 AI 消息气泡下方
  - 环形总分图（`conic-gradient` + `::before` 遮罩）
  - 四维度进度条（技术准确性/表达清晰度/完整性/深度）
  - 改进建议列表
- **历史恢复**：页面刷新后从后端恢复对话 + 评分

### 面试导航保护

```
用户面试中点击导航或退出
    │
    ├── 管理员？ → 直接放行
    │
    ├── sessionStorage 无 active_interview？ → 直接放行
    │
    ├── 面试状态已是 COMPLETED/EXITED/EXPIRED？ → 直接放行
    │
    ├── 当前不在面试页？ → 直接放行
    │
    └── 弹出确认框
        ├── 「继续面试」→ 取消导航
        └── 「确定离开」→ 执行跳转（面试将被标记为 EXITED）
```

### 聊天室

- STOMP over WebSocket（`@stomp/stompjs`）
- 实时消息列表（文本/系统通知/置顶/撤回）
- 在线用户列表
- @提及通知（浏览器 Notification）
- 管理员禁言/解禁
- 连接异常自动重连（5 秒间隔）

### 管理后台

- **仪表盘**：总用户数、今日面试数、在线人数、模型状态
- **用户管理**：列表/搜索/锁定/解锁/详情/面试记录
- **数据分析**：ECharts 图表（面试趋势/岗位分布/评分分布）
- **模型切换**：动态切换 AI Provider（DeepSeek ↔ Kimi）

### 简历上传

- 拖拽 / 点击上传 `.md` 文件
- AI 自动分析技能标签 + 摘要展示
- 账号锁定时禁用上传（🔒 锁定态）
- 上传中全局遮罩（禁止操作）

---

## 🔄 核心交互流程

### SSE 流式数据流

```
┌──────────┐                    ┌──────────┐                    ┌──────┐
│  前端     │                    │  后端     │                    │  AI  │
│  Vue 3   │                    │  Spring  │                    │ API  │
└────┬─────┘                    └────┬─────┘                    └──┬───┘
     │                              │                             │
     │  GET /stream/question        │                             │
     │  (Authorization: Bearer...)  │                             │
     │─────────────────────────────▶│                             │
     │                              │  POST /v1/chat/completions  │
     │                              │  (stream: true)             │
     │                              │────────────────────────────▶│
     │                              │                             │
     │                              │  data: {"choices":[{"delta":│
     │                              │    {"content":"请"}}]}      │
     │                              │◀────────────────────────────│
     │  event: question_chunk       │                             │
     │  data: "请"                  │                             │
     │◀─────────────────────────────│                             │
     │                              │                             │
     │  event: question_chunk       │  (more chunks...)           │
     │  data: "解释"                │◀────────────────────────────│
     │◀─────────────────────────────│                             │
     │                              │                             │
     │  event: question_complete    │                             │
     │  data: {"status":"done",     │                             │
     │        "qaRecordId": 123}    │                             │
     │◀─────────────────────────────│                             │
     │                              │                             │
     │  用户输入回答...              │                             │
     │                              │                             │
     │  POST /submit-answer         │                             │
     │─────────────────────────────▶│                             │
     │                              │                             │
     │  GET /stream/score           │                             │
     │─────────────────────────────▶│                             │
     │                              │  POST scoring prompt        │
     │                              │────────────────────────────▶│
     │                              │◀────────────────────────────│
     │  event: score_complete       │                             │
     │  data: {"totalScore":85,     │                             │
     │        "dimensions": [...],  │                             │
     │        "summary":"...",      │                             │
     │        "suggestions":[...]}  │                             │
     │◀─────────────────────────────│                             │
```

### 状态管理（无 Pinia）

```
┌────────────────────────────────────────────┐
│              App.vue                        │
│  ├─ showNav / guestPage / fullscreenPage    │
│  ├─ username (onMounted → getMe)           │
│  └─ userRole (isAdmin 计算属性)             │
├────────────────────────────────────────────┤
│          各页面自管理 ref/reactive           │
├────────────────────────────────────────────┤
│  InterviewView.vue                         │
│  ├─ msgs: ChatMessage[]       ← 消息列表    │
│  ├─ state: string             ← 面试状态    │
│  ├─ sseGeneration: number     ← SSE 代际    │
│  ├─ thinking / loading        ← 加载态      │
│  └─ currentQaRecordId         ← 当前问答ID  │
├────────────────────────────────────────────┤
│  ChatView.vue                              │
│  ├─ messages / onlineUsers    ← 响应式列表  │
│  ├─ stompSub                  ← 房间订阅    │
│  └─ replyTo / replyContent    ← 回复状态    │
├────────────────────────────────────────────┤
│          localStorage                      │
│  ├─ zhimian_token              ← JWT       │
│  └─ zhimian_role               ← 用户角色   │
├────────────────────────────────────────────┤
│          sessionStorage                    │
│  └─ active_interview           ← 导航保护   │
└────────────────────────────────────────────┘
```

---

## 🎨 样式体系

### 设计令牌

| 令牌 | 值 | 用途 |
|------|-----|------|
| 主色 | `#122e8a` | 按钮、链接 |
| 渐变 1 | `#667eea → #764ba2` | 导航栏激活态、AI 头像、品牌文字 |
| 渐变 2 | `#409eff → #337ecc` | 用户头像、蓝色按钮 |
| 背景 | `#f0f2f5 → #e8ecf4 → #f5f0f8` | 页面渐变背景（30s 循环） |
| 卡片圆角 | 14px | 卡片 |
| 气泡圆角 | 18px | 消息气泡 |
| 卡片阴影 | `0 8px 28px rgba(0,0,0,0.08)` | 卡片悬浮 |
| 弹窗阴影 | `0 16px 48px rgba(0,0,0,0.15)` | 弹窗/消息框 |

### 动画系统

| 动画 | 实现 | 用途 |
|------|------|------|
| 页面入场 | `fade-enter` — translateY(32px) + scale(0.92) + opacity, 0.4s cubic-bezier | 路由切换 |
| 页面离场 | `fade-leave` — translateY(-16px) + scale(0.95) + opacity, 0.22s | 路由切换 |
| 背景渐变 | `gradientShift` — background-position 循环, 30s | 页面背景 |
| 卡片悬浮 | `translateY(-2px)` + 阴影增强, 0.25s | 卡片 hover |
| 消息入场 | `msgIn` — translateY(10px) + scale(0.98) → 原位, 0.35s | 新消息 |
| 评分入场 | `ringIn` — scale(0.5) → scale(1), 0.5s | 评分环形图 |
| 品牌脉冲 | `brandPulse` — scale(1) → scale(1.08) → scale(1), 3s | 导航栏 Logo |
| 加载闪烁 | `blink` — opacity 交替, 1.4s | AI 思考中三点 |
| 弹窗缩放 | `dialog-fade` — scale(0.88) + opacity, 0.3s | 弹窗打开/关闭 |
| 错峰入场 | `stagger-delay-1~8` — 递增 0.05s | 卡片列表依次出现 |

### 关键 UI 细节

| 元素 | 实现方式 |
|------|----------|
| **毛玻璃导航栏** | `backdrop-filter: blur(16px) saturate(180%)` + `rgba(255,255,255,0.78)` |
| **导航激活态** | `::after` 渐变下划线，hover 时宽度动画从 20px → 32px |
| **评分环形图** | `conic-gradient` + `::before` 遮罩实现空心圆环 |
| **消息错峰入场** | 每条消息 `animation-delay` 递增 |
| **岗位卡片** | `animate-in` + 递增 `animationDelay: 0.06 * i` |
| **验证码** | Base64 图片 + 点击刷新 |
| **自定义滚动条** | `::-webkit-scrollbar` 6px 宽度，hover 变深 |
| **文本选中色** | `::selection { background: rgba(102,126,234,0.25) }` |
| **焦点环** | `*:focus-visible { outline: rgba(102,126,234,0.6) 2px }` |

---

## 🐳 部署方案

### Vite 配置

```javascript
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,              // WebSocket 代理
        changeOrigin: true,
      },
    },
  },
})
```

### 生产环境（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/zhimian01web/dist;

    # SPA 路由：所有非文件请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # SSE 需要关闭缓冲
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```bash
npm run build
docker build -t zhimian-webui .
docker run -d -p 80:80 zhimian-webui
```

---

## 👨‍💻 开发指南

### 本地联调

```bash
# 终端 1：后端
cd ../zhimian01 && ./mvnw spring-boot:run     # :8080

# 终端 2：前端
npm install                                     # 首次必执行
npm run dev                                     # :3000
```

### 新增页面

1. 在 `src/views/` 创建 `.vue` 文件
2. 在 `src/router/index.js` 注册路由
3. 如需 API，在 `src/api/index.js`（或 `admin.js` / `chat.js`）添加接口函数

### SSE 连接示例

```javascript
import { createSSE } from '../api/index.js'

async function connectSSE(sessionId) {
  const abortCtrl = new AbortController()
  const res = await createSSE(
    `/api/interview/${sessionId}/stream/question`,
    abortCtrl.signal
  )
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // 按 \n\n 分割 SSE 事件块
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const block of parts) {
      const eventMatch = block.match(/^event:\s*(.+)$/m)
      const dataMatch = block.match(/^data:\s*(.+)$/m)
      if (eventMatch && dataMatch) {
        handleEvent(eventMatch[1], dataMatch[1])
      }
    }
  }
}
```

### 代码规范

- **Composition API**：统一使用 `<script setup>` 语法
- **组件拆分**：可复用逻辑抽取为独立组件（如 `ResumeUpload.vue`）
- **API 分层**：`index.js`（通用）、`admin.js`（管理）、`chat.js`（聊天）
- **样式**：全局样式在 `style.css`，组件样式使用 `scoped`
- **错误处理**：API 层统一 401 拦截，业务层 `try/catch` + `ElMessage`
- **Token 管理**：通过 `api/index.js` 导出的 `getToken/setToken/clearToken`

---

## 📄 开源协议

本项目仅用于学习和竞赛目的。

---

<p align="center">
  <sub>Built with ❤️ by the ZhiMian Team</sub>
</p>
