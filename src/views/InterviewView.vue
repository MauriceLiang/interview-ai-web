<template>
  <div class="interview-page">
    <!-- 头部信息 -->
    <div class="interview-header">
      <div class="header-left">
        <h3 class="header-title">{{ title }}</h3>
        <span class="header-badges">
          <el-tag size="small" effect="plain" round>第 {{ round + 1 }} / {{ total }} 轮</el-tag>
          <el-tag :type="stateTagType" effect="dark" size="small" round>{{ stateLabel }}</el-tag>
        </span>
      </div>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-area" ref="chatRef">
      <div
        v-for="(m, i) in msgs"
        :key="i"
        class="msg-wrapper"
        :class="m.role === 'me' ? 'msg-right' : 'msg-left'"
      >
        <!-- 头像 -->
        <div class="avatar" :class="m.role">
          {{ m.role === 'me' ? '我' : 'AI' }}
        </div>

        <!-- 消息体 -->
        <div class="msg-body">
          <div class="bubble" :class="m.role">
            <div class="bubble-text">{{ m.text }}</div>

            <!-- 评分卡片（嵌入在气泡下方） -->
            <div v-if="m.score" class="score-card">
              <div class="score-main">
                <div class="score-circle" :style="{ '--score': m.score.total / 100 }">
                  <span class="score-num">{{ m.score.total }}</span>
                  <span class="score-label">分</span>
                </div>
                <div class="score-dims">
                  <div class="dim-item" v-for="d in m.score.dims" :key="d.name">
                    <span class="dim-name">{{ d.label }}</span>
                    <el-progress
                      :percentage="d.score"
                      :color="d.color"
                      :stroke-width="6"
                      size="small"
                    />
                  </div>
                </div>
              </div>
              <div v-if="m.score.summary" class="score-summary">{{ m.score.summary }}</div>
              <div v-if="m.score.suggestions?.length" class="score-suggestions">
                <div class="sug-title">💡 改进建议</div>
                <ul>
                  <li v-for="(s, si) in m.score.suggestions" :key="si">{{ s }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="msg-time">{{ m.time }}</div>
        </div>
      </div>

      <!-- 面试前欢迎区（未开始 + 无历史消息时展示） -->
      <div v-if="msgs.length === 0 && state === 'CREATED'" class="welcome-area">
        <div class="welcome-icon">🧠</div>
        <h3 class="welcome-title">{{ title }}</h3>
        <p class="welcome-desc">AI 面试官已就位，准备好就开始吧！</p>
        <div class="welcome-features">
          <div class="wf-item">
            <span class="wf-icon">🎯</span>
            <div class="wf-text">
              <div class="wf-label">智能出题</div>
              <div class="wf-desc">AI 根据岗位方向生成针对性问题，涵盖核心技术点</div>
            </div>
          </div>
          <div class="wf-item">
            <span class="wf-icon">📝</span>
            <div class="wf-text">
              <div class="wf-label">实时评分</div>
              <div class="wf-desc">每道题作答后从技术准确性、表达、完整性、深度四维度评分</div>
            </div>
          </div>
          <div class="wf-item">
            <span class="wf-icon">📊</span>
            <div class="wf-text">
              <div class="wf-label">分析报告</div>
              <div class="wf-desc">面试结束后生成完整能力评估报告与学习建议</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载动画 -->
      <div v-if="thinking" class="msg-wrapper msg-left">
        <div class="avatar ai">AI</div>
        <div class="msg-body">
          <div class="bubble ai thinking-bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作区域 -->
    <div class="action-bar">
      <!-- 未开始 -->
      <div v-if="state === 'CREATED'" class="action-start">
        <el-button type="primary" size="large" @click="onStart" :loading="loading" round>
          🎯 开始面试
        </el-button>
      </div>

      <!-- 提问中 — 输入回答（AI 出题时也可见，但出题中禁用） -->
      <div v-if="state === 'QUESTIONING'" class="action-answer">
        <el-input
          v-model="answer"
          type="textarea"
          :rows="3"
          placeholder="输入你的回答… (Enter 发送，Shift+Enter 换行)"
          @keydown="handleKeydown"
          :disabled="submitting || thinking"
          :placeholder="thinking ? 'AI 正在组织题目…' : '输入你的回答… (Enter 发送，Shift+Enter 换行)'"
        />
        <div class="action-btns">
          <el-button type="primary" @click="onSubmit" :loading="submitting" :disabled="!answer.trim() || thinking">
            {{ thinking ? '⏳ 题目生成中' : '📤 提交回答' }}
          </el-button>
          <span class="shortcut-hint">Enter 发送 · Shift+Enter 换行</span>
        </div>
      </div>

      <!-- 评分中 — 显示等待状态，按钮不出现 -->
      <div v-if="state === 'SCORING' && thinking" class="action-scoring">
        <div class="scoring-indicator">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>AI 正在评分…</span>
        </div>
      </div>

      <!-- 评分完成 — 下一题 / 完成 -->
      <div v-if="state === 'SCORING' && !thinking" class="action-next">
        <el-button type="primary" v-if="round + 1 < total" @click="onNext" :loading="loading" class="next-btn">
          <el-icon><ArrowRight /></el-icon>
          <span>下一题</span>
        </el-button>
        <el-button type="success" v-else @click="onFinish" :loading="loading" class="next-btn">
          <el-icon><Check /></el-icon>
          <span>完成面试 🎉</span>
        </el-button>
      </div>

      <!-- 已完成 -->
      <div v-if="state === 'COMPLETED'" class="action-complete">
        <el-button type="primary" @click="$router.push('/report/' + id)" :icon="Document">
          查看报告
        </el-button>
        <el-button @click="$router.push('/templates')" :icon="Back">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSessionDetail, startInterview, submitAnswer, nextRound, finishInterview, createSSE } from '../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Check, Document, Back, Loading } from '@element-plus/icons-vue'

const route = useRoute()
const id = parseInt(route.params.id)
const chatRef = ref(null)

const title = ref('面试')
const state = ref('CREATED')
const round = ref(0)
const total = ref(8)
const msgs = ref([])
const answer = ref('')
const thinking = ref(false)
const loading = ref(false)
const submitting = ref(false)

/** 当前累积的题目文本（SSE 流式拼接） */
const currentQuestionText = ref('')
/** 当前轮的 qaRecordId（由后端 submitAnswer 返回） */
const currentQaRecordId = ref(null)

let abortCtrl = null
/** SSE 代际计数器：每次新连接递增，过期的微任务数据被丢弃 */
let sseGeneration = 0

const stateLabel = computed(() =>
  ({ CREATED: '已创建', WAITING: '等待', QUESTIONING: '提问中', ANSWERING: '回答中', SCORING: '评分', COMPLETED: '已完成', EXITED: '已退出' })[state.value] || state.value
)
const stateTagType = computed(() =>
  ({ CREATED: 'info', QUESTIONING: 'warning', SCORING: 'success', COMPLETED: 'primary', EXITED: 'info' })[state.value] || 'info'
)

/** 将当前面试状态写入 sessionStorage，供导航守卫读取 */
function saveActiveInterview() {
  if (state.value === 'COMPLETED' || state.value === 'EXITED' || state.value === 'EXPIRED') {
    sessionStorage.removeItem('active_interview')
  } else {
    sessionStorage.setItem('active_interview', JSON.stringify({
      id: id,
      title: title.value,
      state: state.value,
      round: round.value,
      total: total.value
    }))
  }
}

onMounted(async () => {
  try {
    const data = await getSessionDetail(id)
    const sess = data.session || data
    const qas = data.qaRecords || []
    title.value = sess.title || '模拟面试'
    state.value = sess.state
    round.value = sess.currentRound || 0
    total.value = sess.totalRounds || 8
    saveActiveInterview()

    // 还原历史对话
    for (const q of qas) {
      addMsg('ai', q.questionText)
      if (q.answerText) addMsg('me', q.answerText)
    }

    // 首次加载且无历史记录时，才通过 SSE 获取题目
    // （有历史记录时，已有题目已在上面还原，不需要再拉）
    if (sess.state === 'QUESTIONING' && qas.length === 0) {
      openQuestionSSE()
    }
  } catch (_) {
    title.value = '模拟面试'
    state.value = 'CREATED'
    saveActiveInterview()
  }
})

onBeforeUnmount(() => {
  cancelSSE()
  saveActiveInterview()
})

// 面试状态变化时自动持久化到 sessionStorage
watch(state, () => { saveActiveInterview() })

function addMsg(role, text, score) {
  msgs.value.push({
    role,
    text,
    score: score || null,
    time: new Date().toLocaleTimeString()
  })
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight
    }
  })
}

// ===== 开始面试 =====
async function onStart() {
  loading.value = true
  try {
    const result = await startInterview(id)
    state.value = 'QUESTIONING'
    round.value = result.round || 0
    openQuestionSSE()
  } catch (e) {
    ElMessage.error('开始失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// ===== SSE 流式出题 =====
function openQuestionSSE() {
  cancelSSE()
  const gen = ++sseGeneration
  thinking.value = true
  abortCtrl = new AbortController()

  // 每个 SSE 连接使用独立累加器，不共享 currentQuestionText
  let accumulated = ''

  const url = `/api/interview/${id}/stream/question`
  console.log('[SSE] 开始连接, 代际:', gen)
  const startTime = Date.now()

  createSSE(url, abortCtrl.signal)
    .then(res => {
      console.log('[SSE] 响应状态:', res.status, res.statusText)
      if (!res.ok) throw new Error('SSE ' + res.status)
      if (!res.body) throw new Error('SSE body 为空')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventCount = 0

      const read = () => {
        reader.read().then(({ done, value }) => {
          if (gen !== sseGeneration) return
          if (done) return

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const block of parts) {
            let type = 'message'
            let data = ''
            for (const line of block.split('\n')) {
              if (line.startsWith('event:')) type = line.slice(6).trim()
              else if (line.startsWith('data:')) data = line.slice(5)
            }
            eventCount++

            if (type === 'question_chunk') {
              accumulated += data
            } else if (type === 'question_complete') {
              // 复制到共享 ref 供 onSubmit 使用
              currentQuestionText.value = accumulated
              if (accumulated) {
                addMsg('ai', accumulated)
              }
              // 解析后端下发的 qaRecordId（如果有）
              try {
                const meta = JSON.parse(data)
                if (meta.qaRecordId) {
                  currentQaRecordId.value = meta.qaRecordId
                }
              } catch (_) { /* 兼容旧格式 {"status":"done"} */ }
              thinking.value = false
            }
          }
          read()
        }).catch(err => {
          if (err.name !== 'AbortError') {
            console.error('[SSE] 读取出错:', err)
            thinking.value = false
          }
        })
      }
      read()
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error('[SSE] 连接失败:', err)
        thinking.value = false
      }
    })
}

// ===== 键盘快捷键 =====
function handleKeydown(e) {
  // Enter（不含 Shift）→ 提交回答
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSubmit()
  }
  // Shift+Enter → 默认换行行为，不做特殊处理
}

// ===== 提交回答 =====
async function onSubmit() {
  const text = answer.value.trim()
  if (!text) return

  answer.value = ''
  submitting.value = true
  cancelSSE()

  // 先显示用户消息
  addMsg('me', text)

  try {
    // 提交回答（优先使用后端下发的 qaRecordId，没有则让后端自动创建）
    const qaId = currentQaRecordId.value || null
    const result = await submitAnswer(id, qaId, text, 0, currentQuestionText.value || undefined)

    // 记录后端返回的 qaRecordId
    currentQaRecordId.value = result?.qaRecordId || null
    state.value = 'SCORING'
    thinking.value = true

    // 打开评分 SSE
    openScoreSSE()
  } catch (e) {
    ElMessage.error('提交失败: ' + e.message)
    state.value = 'QUESTIONING'
    thinking.value = false
  } finally {
    submitting.value = false
  }
}

// ===== SSE 评分 =====
function openScoreSSE() {
  cancelSSE()
  const gen = ++sseGeneration
  abortCtrl = new AbortController()
  let buffer = ''

  let scored = false

  createSSE(`/api/interview/${id}/stream/score`, abortCtrl.signal)
    .then(res => {
      if (!res.ok) throw new Error('评分SSE ' + res.status)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      function read() {
        reader.read().then(({ done, value }) => {
          if (gen !== sseGeneration) return
          if (done) {
            // 流关闭但评分未到，不做任何事，由超时兜底处理
            if (!scored) {
              console.warn('[SSE] 评分连接意外关闭')
            }
            return
          }
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const block of parts) {
            let eventType = 'message'
            let data = ''
            for (const line of block.split('\n')) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim()
              else if (line.startsWith('data:')) data = line.slice(5)
            }

            if (!data) continue

            if (eventType === 'score_complete') {
              try {
                const sc = JSON.parse(data)
                // 解析各维度分数
                const dims = []
                if (sc.technicalAccuracy?.score != null) {
                  dims.push({ name: 'technicalAccuracy', label: '技术准确性', score: sc.technicalAccuracy.score, color: '#409eff' })
                }
                if (sc.clarity?.score != null) {
                  dims.push({ name: 'clarity', label: '表达清晰度', score: sc.clarity.score, color: '#67c23a' })
                }
                if (sc.completeness?.score != null) {
                  dims.push({ name: 'completeness', label: '完整性', score: sc.completeness.score, color: '#e6a23c' })
                }
                if (sc.depth?.score != null) {
                  dims.push({ name: 'depth', label: '深度', score: sc.depth.score, color: '#f56c6c' })
                }

                addMsg('ai', '📊 评分结果', {
                  total: sc.totalScore,
                  dims,
                  summary: sc.summary,
                  suggestions: sc.suggestions
                })
                state.value = 'SCORING'
              } catch (e2) {
                console.error('评分解析失败', e2)
              }
              scored = true
              // 确保评分消息渲染到 DOM 后，再显示下一题按钮
              nextTick(() => {
                setTimeout(() => {
                  thinking.value = false
                  cancelSSE()
                }, 350)
              })
            }
          }
          read()
        }).catch(err => {
          if (err.name !== 'AbortError') console.error(err)
        })
      }
      read()
      // 兜底超时：60 秒后如果评分还没到，才释放按钮（避免用户永久卡住）
      setTimeout(() => {
        if (!scored) {
          console.warn('[SSE] 评分超时 60s')
          thinking.value = false
        }
      }, 60000)
    })
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err)
      // 连接阶段出错不影响已有状态，等超时兜底
    })
}

// ===== 下一轮 =====
async function onNext() {
  cancelSSE()
  loading.value = true
  try {
    const r = await nextRound(id)
    round.value = r.round || 0
    state.value = 'QUESTIONING'
    currentQaRecordId.value = null
    nextTick(() => openQuestionSSE())
  } catch (e) {
    ElMessage.error('进入下一题失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// ===== 结束面试 =====
async function onFinish() {
  cancelSSE()
  loading.value = true
  try {
    await finishInterview(id)
    state.value = 'COMPLETED'
    ElMessage.success('🎉 面试已完成')
  } catch (e) {
    ElMessage.error('结束失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

function cancelSSE() {
  if (abortCtrl) {
    abortCtrl.abort()
    abortCtrl = null
  }
}
</script>

<style scoped>
.interview-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ===== 头部 ===== */
.interview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}
.header-badges {
  display: flex;
  gap: 6px;
}

/* ===== 聊天区域 ===== */
.chat-area {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px;
  min-height: 400px;
  max-height: min(640px, calc(100vh - 260px));
  overflow-y: auto;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  scroll-behavior: smooth;
  transition: box-shadow 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.chat-area:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
.chat-area::-webkit-scrollbar {
  width: 6px;
}
.chat-area::-webkit-scrollbar-thumb {
  background: #d0d5dd;
  border-radius: 3px;
}
.chat-area::-webkit-scrollbar-thumb:hover {
  background: #b0b5bd;
}

/* ===== 面试前欢迎区 ===== */
.welcome-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 320px;
  padding: 20px 0;
  animation: welcomeIn 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes welcomeIn {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.welcome-icon {
  font-size: 56px;
  line-height: 1;
  margin-bottom: 16px;
}
.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}
.welcome-desc {
  font-size: 15px;
  color: #888;
  margin: 0 0 32px;
}
.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: left;
  max-width: 420px;
}
.wf-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.wf-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}
.wf-text {
  flex: 1;
}
.wf-label {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}
.wf-desc {
  font-size: 13px;
  color: #888;
  line-height: 1.5;
}

/* 消息行 — 错峰入场 */
.msg-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: flex-start;
  animation: msgIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
.msg-wrapper.msg-right {
  flex-direction: row-reverse;
}
@keyframes msgIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 头像 */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0;
}
.avatar.ai {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}
.avatar.me {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
}

/* 消息体 */
.msg-body {
  max-width: 75%;
  min-width: 0;
}
.msg-right .msg-body {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* 气泡 */
.bubble {
  padding: 14px 18px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.bubble.ai {
  background: #f0f2f5;
  color: #333;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}
.bubble.me {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble-text {
  white-space: pre-wrap;
}

/* 时间戳 */
.msg-time {
  font-size: 11px;
  color: #aaa;
  margin-top: 4px;
}

/* ===== 评分卡片 ===== */
.score-card {
  margin-top: 12px;
  background: #fff;
  border: 1px solid #e8eaef;
  border-radius: 14px;
  padding: 18px;
  animation: fadeInUp 0.4s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.score-main {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.score-circle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: conic-gradient(#409eff calc(var(--score) * 360deg), #e8e8e8 0deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  animation: ringIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes ringIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
.score-circle::before {
  content: '';
  position: absolute;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: #fff;
}
.score-num {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  z-index: 1;
  line-height: 1;
}
.score-label {
  font-size: 10px;
  color: #999;
  z-index: 1;
}
.score-dims {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dim-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dim-name {
  font-size: 12px;
  color: #666;
  width: 64px;
  flex-shrink: 0;
}
.dim-item .el-progress {
  flex: 1;
}
.score-summary {
  margin-top: 12px;
  font-size: 13px;
  color: #444;
  line-height: 1.6;
}
.score-suggestions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ddd;
}
.sug-title {
  font-size: 13px;
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 6px;
}
.score-suggestions ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #555;
  line-height: 1.8;
}

/* ===== 加载动画 ===== */
.thinking-bubble {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 14px 20px;
}
.dot {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: blink 1.4s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}

/* ===== 操作栏 ===== */
.action-bar {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8eaef;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.action-start,
.action-next,
.action-complete {
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
}
.action-answer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.action-answer .el-textarea__inner {
  border-radius: 8px;
  resize: none;
}
.action-btns {
  display: flex;
  align-items: center;
  gap: 12px;
}
.shortcut-hint {
  font-size: 12px;
  color: #bbb;
}

/* 评分中指示器 */
.action-scoring {
  display: flex;
  justify-content: center;
  align-items: center;
}
.scoring-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  color: #909399;
  font-size: 15px;
}
.scoring-indicator .el-icon {
  font-size: 20px;
  color: #409eff;
}

/* 下一题按钮 — 图标+文字居中 */
.next-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* ===== 响应式 ===== */
@media (max-width: 600px) {
  .chat-area { padding: 16px 12px; max-height: 420px; }
  .msg-body { max-width: 85%; }
  .score-main { flex-direction: column; align-items: flex-start; }
  .score-circle { width: 60px; height: 60px; }
  .score-circle::before { width: 50px; height: 50px; }
  .score-num { font-size: 18px; }
  .dim-name { width: 56px; font-size: 11px; }
}
</style>
