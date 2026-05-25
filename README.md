<p align="center">
  <img src="https://img.icons8.com/fluency/96/idea.png" alt="logo" width="80" />
  <h1 align="center">🧠 智面 · ZhiMian</h1>
  <p align="center"><strong>智能面试训练平台 · 前端</strong></p>
  <p align="center">
    <em>AI 模拟面试交互界面 — 流式对话 · 实时评分 · 能力可视化</em>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-%234FC08D?logo=vuedotjs" alt="Vue" />
  <img src="https://img.shields.io/badge/Vite-6.2-%23646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Element_Plus-2.14-%23409EFF?logo=element" alt="Element Plus" />
  <img src="https://img.shields.io/badge/SSE-Streaming-%2300C853" alt="SSE" />
  <img src="https://img.shields.io/badge/Hash_Router-4.5-%23333" alt="Vue Router" />
  <img src="https://img.shields.io/badge/ESM-Modern-%23F7DF1E?logo=javascript" alt="ESM" />
</p>

---

## 📋 目录

- [项目概览](#-项目概览)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [路由设计](#-路由设计)
- [功能特性](#-功能特性)
- [核心交互流程](#-核心交互流程)
- [架构设计](#-架构设计)
- [样式体系](#-样式体系)
- [部署方案](#-部署方案)
- [开发指南](#-开发指南)

---

## 🚀 项目概览

**智面前端**是一个基于 Vue 3 + Vite 构建的 AI 模拟面试单页应用。它通过 SSE（Server-Sent Events）与后端建立流式长连接，实现类实时聊天的面试体验——AI 逐字输出问题、用户键盘作答、评分即刻呈现。

### 核心体验

| 体验 | 说明 |
|------|------|
| 💬 **流式对话** | AI 逐字输出，打字机效果，`ReadableStream` 解析 SSE |
| 🎯 **岗位选择** | 11 岗位卡片网格，简历上传一键关联 |
| 📊 **实时评分** | 四维度环形图 + 进度条 + 改进建议列表 |
| 📋 **能力报告** | 总分环形图 + AI 结构化分析 + 学习建议 |
| 🛡 **导航保护** | 面试中离开弹窗确认，防止意外中断 |

---

## 🛠 技术栈

### 核心依赖

```
┌──────────────────────────────────────────┐
│                Vue 3.5                   │
│           Composition API                │
├──────────┬──────────┬────────────────────┤
│  Vite    │  Element  │   Vue Router      │
│  6.2     │  Plus 2.14│   Hash 4.5       │
├──────────┴──────────┴────────────────────┤
│    原生 Fetch · ReadableStream · SSE     │
│    @element-plus/icons-vue               │
└──────────────────────────────────────────┘
```

| 依赖 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5+ | 组合式 API + 响应式系统 |
| Vite | 6.2+ | ESM 原生 HMR，极速开发体验 |
| Element Plus | 2.14+ | 企业级 UI 组件库（表单/卡片/进度条/消息弹窗） |
| Vue Router | 4.5+ | Hash 路由 + 导航守卫 |
| @element-plus/icons-vue | 2.3+ | 矢量图标库 |
| 原生 Fetch API | - | HTTP 请求 + SSE 流式解析（零额外依赖） |

### 设计决策

| 决策 | 理由 |
|------|------|
| **不使用 Axios** | 原生 `fetch()` 已满足需求，`ReadableStream` 是 SSE 必需的底层 API，减少一个依赖 |
| **不使用 EventSource** | `EventSource` 不支持 `Authorization` 头，自定义 `fetch` + `ReadableStream` 实现 JWT 认证的 SSE |
| **不使用 Pinia** | 项目规模适中，组件内 `ref` + 路由传参足以管理状态，无需额外状态管理库 |
| **Hash 路由** | 后端无配置兼容性最佳，刷新不 404 |

---

## 📁 项目结构

```
zhimian01web/
├── index.html                  # HTML 入口
├── vite.config.js              # Vite 配置（代理 /api → 8080）
├── package.json                # 依赖清单
│
└── src/
    ├── main.js                 # 应用入口
    │   ├── Vue 实例化
    │   ├── Element Plus 注册
    │   ├── Router 挂载
    │   └── 全局样式引入
    │
    ├── App.vue                 # 根组件（布局容器）
    │   ├── 🧭 导航栏（毛玻璃效果）
    │   │   ├── 品牌 Logo
    │   │   ├── 面试 / 历史菜单项
    │   │   └── 用户下拉（退出登录）
    │   ├── 📄 Router View（路由视图）
    │   └── 🛡 面试导航守卫
    │
    ├── style.css               # 全局样式
    │   ├── 渐变背景动画
    │   ├── 卡片通用样式
    │   ├── 页面过渡动画
    │   ├── 弹窗缩放动画
    │   └── 响应式适配
    │
    ├── api/
    │   └── index.js            # API 层
    │       ├── request()       # 通用 fetch 封装（Token 注入 + 错误处理）
    │       ├── createSSE()     # SSE 连接工厂
    │       ├── 认证模块        # login / register / getMe / captcha
    │       ├── 面试模块        # create / start / submit / next / finish
    │       ├── 模板/报告/简历  # 接口封装
    │       └── Token 管理      # localStorage 读写
    │
    ├── router/
    │   └── index.js            # 路由配置
    │       ├── 7 条路由规则
    │       ├── hash 历史模式
    │       └── beforeEach 登录守卫
    │
    ├── components/
    │   └── ResumeUpload.vue    # 简历上传组件
    │       ├── 📤 拖拽上传区（.md）
    │       ├── 🔒 账号锁定态
    │       ├── 📄 已上传简历展示
    │       └── 🏷 AI 分析摘要
    │
    └── views/                  # 页面视图
        ├── LoginView.vue       # 登录页
        │   ├── 🎨 左侧品牌装饰区
        │   └── 📝 右侧登录表单（验证码）
        │
        ├── RegisterView.vue    # 注册页
        │   ├── 🎨 同左侧装饰区
        │   └── 📝 注册表单
        │
        ├── TemplateView.vue    # 岗位选择页
        │   ├── 📤 简历上传区
        │   └── 🃏 岗位卡片网格（11 岗位）
        │
        ├── InterviewView.vue   # 面试核心页 🎯
        │   ├── 💬 消息气泡列表
        │   ├── ⌨️ 回答输入区
        │   ├── 🔄 SSE 流式接收
        │   ├── 📊 评分卡片（环形图）
        │   └── 🎮 操作按钮区
        │
        ├── HistoryView.vue     # 面试历史
        │   ├── 📋 历史列表卡片
        │   └── 🏷 状态标签
        │
        ├── HistoryDetailView.vue # 面试详情
        │   ├── 📋 会话概览
        │   └── ⏳ 问答时间线 + 评分展开
        │
        └── ReportView.vue      # 面试报告
            ├── 🎯 总分环形图
            ├── 📝 AI 能力分析
            └── 📚 学习建议
```

---

## ⚡ 快速开始

### 前置条件

| 依赖 | 版本 | 验证 |
|------|------|------|
| Node.js | ≥ 18 | `node --version` |
| npm | ≥ 9 | `npm --version` |

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（后端需已在 :8080 运行）
npm run dev
```

前端默认启动于 **`http://localhost:3000`**，Vite 自动将 `/api` 请求代理到 `http://localhost:8080`。

### 构建

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览生产构建
```

---

## 🧭 路由设计

### 路由表

```
┌──────────────────────────────────────────────────┐
│  🚪  guest （无需登录）                           │
├──────────────┬───────────────┬───────────────────┤
│  /login      │  LoginView    │  登录（验证码）    │
│  /register   │  RegisterView │  注册              │
│  /           │  → /login     │  根路径重定向      │
├──────────────┴───────────────┴───────────────────┤
│  🔐  auth （需登录，router.beforeEach 守卫）      │
├──────────────┬───────────────┬───────────────────┤
│  /templates  │  TemplateView │  岗位选择 + 简历   │
│  /interview/  │  InterviewView│  面试对话 🎯 全屏 │
│  :id         │               │                    │
│  /history    │  HistoryView  │  历史列表           │
│  /history/:id│  HistoryDetail│  逐题回顾 + 评分   │
│  /report/    │  ReportView   │  能力分析报告       │
│  :sessionId  │               │                    │
└──────────────┴───────────────┴───────────────────┘
```

### 导航守卫

```javascript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('zhimian_token')
  if (to.meta.auth && !token) {
    next('/login')      // 未登录 → 跳转登录页
  } else {
    next()              // 已登录或公开页 → 放行
  }
})
```

---

## 🎯 功能特性

### 认证模块

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 登录页    │ ──▶ │ 验证码   │ ──▶ │ JWT 签发 │
│ 双栏布局  │     │ 图形验证  │     │ localStorage │
└──────────┘     └──────────┘     └──────────┘
```

- 图形验证码防刷
- JWT 持久化至 `localStorage`
- Token 过期自动跳转登录页
- 退出登录清除 Token + 刷新页面

### 岗位选择

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 简历上传区    │ ──▶ │ 岗位卡片网格  │ ──▶ │ 创建面试确认 │
│ (可选)       │     │ (11 岗位)    │     │ (锁定检查 +  │
│              │     │              │     │  轮次修改)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

- 11 岗位精美卡片（含图标 + 难度/风格/轮次标签）
- 简历上传后卡片显示 📄 专属标记
- 「其他岗位」强制要求上传简历
- 创建前检查账号锁定（≥3 未完成面试时禁止）
- 两步确认：开始警告 → 轮次修改（1-12轮）

### 面试对话（核心交互）

```
┌─────────────────────────────────────────────────────┐
│  1. 开始面试                                        │
│     └─ POST /start → 状态转入 QUESTIONING            │
│                                                      │
│  2. SSE 流式接收题目                                  │
│     └─ GET /stream/question                          │
│        ├─ question_chunk → 追加到消息累加器           │
│        └─ question_complete → 添加到消息列表          │
│                                                      │
│  3. 用户输入回答 + Enter 发送                         │
│     └─ POST /submit-answer → 状态转入 SCORING         │
│                                                      │
│  4. SSE 流式接收评分                                  │
│     └─ GET /stream/score                             │
│        └─ score_complete → 渲染评分卡片               │
│                                                      │
│  5. 下一题 / 完成面试                                 │
│     └─ POST /next-round 或 POST /finish              │
└─────────────────────────────────────────────────────┘
```

- **消息气泡**：AI 灰色左对齐 / 用户蓝色右对齐，带时间戳
- **打字机效果**：SSE `question_chunk` 逐字追加
- **加载动画**：三点闪烁 `@keyframes blink`
- **快捷键**：`Enter` 发送，`Shift+Enter` 换行
- **评分展示**：环形总分图 + 四维度进度条 + 改进建议列表
- **历史还原**：页面刷新后从后端恢复历史对话

### 面试导航保护

```
用户面试中点击「历史」或「退出登录」
    │
    ▼
App.vue: confirmLeaveActiveInterview()
    │
    ├── sessionStorage 有 active_interview？
    │       └── 否 → 直接跳转
    │
    ├── 当前在 /interview/:id 页面？
    │       └── 否 → 直接跳转
    │
    ├── 面试状态是 COMPLETED / EXITED ？
    │       └── 是 → 直接跳转
    │
    └── 弹出确认框
        ├── 「继续面试」→ 取消导航
        └── 「确定离开」→ 执行跳转
```

### 简历上传

- 拖拽 / 点击上传 `.md` 文件
- AI 自动分析技能标签 + 摘要
- 账号锁定时禁用上传（🔒 锁定态）
- 文件格式校验（仅 `.md`）

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
     │        "technicalAccuracy":  │                             │
     │          {"score":88,...},   │                             │
     │        "summary":"...",      │                             │
     │        "suggestions":[...]}  │                             │
     │◀─────────────────────────────│                             │
```

### 状态管理（无 Pinia）

```
┌────────────────────────────────────────────┐
│              App.vue                        │
│  ├─ showNav / guestPage / fullscreenPage    │
│  └─ username (onMounted → getMe)           │
├────────────────────────────────────────────┤
│          各页面自管理 ref 状态               │
├────────────────────────────────────────────┤
│  InterviewView.vue                         │
│  ├─ msgs: ChatMessage[]       ← 消息列表   │
│  ├─ state: string             ← 面试状态   │
│  ├─ sseGeneration: number     ← SSE 代际   │
│  ├─ thinking/loading          ← 加载态     │
│  └─ currentQaRecordId         ← 当前问答ID │
├────────────────────────────────────────────┤
│          sessionStorage                   │
│  └─ active_interview           ← 导航保护  │
└────────────────────────────────────────────┘
```

---

## 🎨 样式体系

### 设计令牌

| 令牌 | 值 | 用途 |
|------|-----|------|
| 主色 | `#122e8a` | 按钮、链接 |
| 渐变 1 | `#667eea → #764ba2` | 导航栏激活态、AI 头像 |
| 渐变 2 | `#409eff → #337ecc` | 用户头像、蓝色按钮 |
| 背景 | `#f0f2f5 → #e8ecf4 → #f5f0f8` | 页面渐变背景 |
| 圆角 | 14px | 卡片 |
| 圆角 | 18px | 消息气泡 |
| 阴影 | `0 8px 28px rgba(0,0,0,0.08)` | 卡片悬浮 |

### 动画系统

```css
/* 页面入场：卡片从底部展开 + 渐显 + 缩放 */
.fade-enter-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(32px) scale(0.92);
}

/* 背景渐变心跳 */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 卡片悬浮上浮 */
.el-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08) !important;
}

/* 消息气泡入场 */
@keyframes msgIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 评分环形图缩放入场 */
@keyframes ringIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
```

### 关键 UI 细节

| 元素 | 实现 |
|------|------|
| **毛玻璃导航栏** | `backdrop-filter: blur(16px) saturate(180%)` |
| **评分环形图** | `conic-gradient` + `::before` 遮罩实现空心 |
| **消息错峰入场** | 每消息 `animation-delay` 递增 |
| **弹窗缩放** | `.dialog-fade-enter-from { transform: scale(0.88) }` |
| **选项卡片** | 11 岗位各有专属 emoji 图标 |
| **验证码** | Base64 图片 + 点击刷新 |

---

## 🐳 部署方案

### 开发环境

```bash
# 终端 1：后端
cd ../zhimian01 && ./mvnw spring-boot:run    # :8080

# 终端 2：前端
npm run dev                                    # :3000 → 代理 /api → :8080
```

### 生产环境

构建后部署到 Nginx：

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
}
```

### Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 👨‍💻 开发指南

### 常用命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览生产构建
npm run lint       # 代码检查（若配置）
```

### API 层扩展

在 `src/api/index.js` 中添加新接口：

```javascript
// ===== 新模块 =====
export function getFoo(id) {
  return request(`/api/foo/${id}`)
}

export function createFoo(data) {
  return request('/api/foo', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

### SSE 连接示例

```javascript
import { createSSE } from '../api/index.js'

async function connectSSE() {
  const abortCtrl = new AbortController()
  const res = await createSSE('/api/interview/1/stream/question', abortCtrl.signal)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''
    for (const block of parts) {
      // 解析 event: xxx \n data: xxx
    }
  }
}
```

---

## 📄 开源协议

本项目仅用于学习和竞赛目的。

---

<p align="center">
  <sub>Built with ❤️ by the ZhiMian Team</sub>
</p>
