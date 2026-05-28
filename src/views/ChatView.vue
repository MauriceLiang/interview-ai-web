<template>
  <div class="chat-page">
    <div class="chat-header">
      <h3 class="chat-title">💬 {{ room?.name || '聊天室' }}</h3>
      <span class="chat-online">🟢 {{ onlineCount }} 人在线</span>
      <el-button size="small" text @click="showMuted = !showMuted" v-if="isAdmin">
        {{ showMuted ? '返回聊天' : '禁言管理' }}
      </el-button>
    </div>

    <div v-if="!connected" class="chat-disconnected">
      ⚠️ 正在连接服务器...
    </div>

    <!-- 滑动容器 -->
    <div class="chat-slider">
      <div class="chat-slider-track" :class="{ 'slid-left': showMuted }">

        <!-- 聊天面板 -->
        <div class="chat-panel">
          <div class="chat-body" ref="chatBodyRef">
            <div v-if="hasHistory" class="load-more">
              <el-button size="small" text :loading="loadingMore" @click="loadMore">加载更多</el-button>
            </div>

            <div v-if="pinnedMessages.length" class="pinned-section">
              <div class="pinned-label">📌 置顶消息</div>
              <div v-for="pm in pinnedMessages" :key="'p-'+pm.id" class="pinned-item">
                <div class="msg-content pinned-msg">{{ pm.senderName }}：{{ pm.content }}</div>
                <div class="pinned-meta">
                  <span class="msg-time">{{ pm.createdAt }}</span>
                  <el-button v-if="isAdmin" size="small" text type="danger" class="pinned-remove" @click="onUnpin(pm)">取消置顶</el-button>
                </div>
              </div>
            </div>

            <div v-for="m in messages" :key="m._key" class="msg-item" :class="{ me: m.senderId === myUserId, system: m.type === 'SYSTEM' || m.type === 'RECALL' }">
              <template v-if="m.type === 'RECALL'">
                <div class="msg-content recall">{{ m.senderName }} 撤回了一条消息</div>
              </template>
              <template v-else-if="m.type === 'SYSTEM'">
                <div class="msg-content system-msg">🔔 {{ m.content }}</div>
              </template>
              <template v-else>
                <div class="msg-sender" v-if="m.senderId !== myUserId">{{ m.senderName }}</div>
                <div class="msg-bubble" :class="{ admin: m.senderRole === 'ADMIN' }">
                  <div v-if="m.recalled" class="recalled-text">[消息已被撤回]</div>
                  <div v-else class="msg-text">{{ m.content }}</div>
                </div>
                <div class="msg-meta">
                  <span class="msg-time">{{ m.createdAt }}</span>
                  <el-button v-if="(isAdmin || m.senderId === myUserId) && !m.recalled && m.type !== 'SYSTEM'" size="small" text class="msg-action" @click="onRecall(m)">撤回</el-button>
                  <el-button v-if="isAdmin && !m.pinned && !m.recalled && m.type === 'TEXT'" size="small" text class="msg-action" @click="onPin(m)">置顶</el-button>
                </div>
              </template>
            </div>

            <div ref="bottomRef"></div>
          </div>

          <div class="chat-input">
            <!-- @mention 弹窗 -->
            <div v-if="mentionVisible" class="mention-popup">
              <div
                v-for="(u, i) in mentionSuggestions"
                :key="u.userId"
                class="mention-item"
                :class="{ 'mention-item--active': i === mentionIndex }"
                @click="selectMention(u)"
                @mouseenter="mentionIndex = i"
              >
                <span class="mention-username">@{{ u.username }}</span>
              </div>
              <div v-if="!mentionSuggestions.length" class="mention-empty">无匹配用户</div>
            </div>
            <div class="chat-input-row">
              <el-input
                v-model="input"
                placeholder="输入消息… @ 提及用户  Ctrl+Enter 发送"
                class="chat-input-field"
                @keydown="onInputKeydown"
                @input="onInputChange"
                :disabled="muted"
                ref="inputRef"
              />
              <el-button :icon="Promotion" :type="hasInput ? 'primary' : 'default'" class="send-btn" :class="{ 'send-btn--active': hasInput }" @click="onSend" :disabled="!hasInput || muted">发送</el-button>
            </div>
            <span v-if="muted" class="muted-tip">你已被禁言</span>
          </div>
        </div>

        <!-- 禁言管理面板 -->
        <div class="mute-panel">
          <el-card>
            <template #header>
              <div class="mute-panel-header">
                <span>禁言管理</span>
                <el-button size="small" text @click="loadSpeakers" :loading="speakersLoading">刷新</el-button>
              </div>
            </template>
            <el-input v-model="speakerSearch" placeholder="搜索用户名…" size="small" clearable class="speaker-search" />
            <el-table :data="filteredSpeakers" stripe size="small" v-loading="speakersLoading" max-height="320">
              <el-table-column prop="username" label="用户" min-width="100" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.muted ? 'danger' : 'success'" size="small" effect="dark" round>{{ row.muted ? '已禁言' : '正常' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button v-if="row.muted" size="small" text type="success" @click="onUnmute(row.userId)">解禁</el-button>
                  <el-button v-else size="small" text type="danger" @click="openMuteDialog(row)">禁言</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!speakersList.length && !speakersLoading" description="暂无发言用户" :image-size="60" />
          </el-card>
        </div>

      </div>
    </div>

    <!-- 禁言弹窗（放在 slider 外部，避免 overflow:hidden 截断） -->
    <el-dialog v-model="muteDialogVisible" title="禁言用户" width="400px" :close-on-click-modal="false" destroy-on-close modal-class="mute-dialog-overlay">
      <el-form label-width="70px" size="default">
        <el-form-item label="用户"><span class="mute-target-name">{{ muteTarget?.username }}</span></el-form-item>
        <el-form-item label="时长">
          <el-select v-model="muteForm.minutes" placeholder="选择禁言时长" style="width:100%">
            <el-option label="10 分钟" :value="10" />
            <el-option label="30 分钟" :value="30" />
            <el-option label="1 小时" :value="60" />
            <el-option label="12 小时" :value="720" />
            <el-option label="永久" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="muteForm.reason" placeholder="禁言原因（可选）" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="muteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="onMuteConfirm" :loading="muteLoading">确认禁言</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getToken, getMe } from '../api/index.js'
import { getRooms, getHistory, muteUser, unmuteUser, getMutedUsers, getSpeakers } from '../api/chat.js'
import { ElMessage } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import { isConnected, publish, subscribeRoom, unsubscribeRoom, onConnected } from '../lib/stomp.js'

let roomSub = null

const route = useRoute()
const roomId = ref(parseInt(route.params.id) || 1)
const room = ref(null)
const messages = ref([])
const pinnedMessages = ref([])
const input = ref('')
const hasInput = computed(() => input.value.trim().length > 0)
const myUserId = ref(null)
const myRole = ref('')
const isAdmin = ref(false)
const muted = ref(false)
const onlineCount = ref(0)
const chatBodyRef = ref(null)
const bottomRef = ref(null)
const showMuted = ref(false)
const mutedList = ref([])
const mutedLoading = ref(false)
const connected = ref(isConnected())

// 禁言管理
const speakersList = ref([])
const speakerSearch = ref('')
const filteredSpeakers = computed(() => {
  const q = speakerSearch.value.trim().toLowerCase()
  // 禁言管理不显示管理员
  let list = speakersList.value.filter(s => (s.role || '').toUpperCase() !== 'ADMIN')
  if (!q) return list
  return list.filter(s => (s.username || '').toLowerCase().includes(q))
})
const speakersLoading = ref(false)
const muteDialogVisible = ref(false)
const muteTarget = ref(null)
const muteForm = ref({ minutes: 30, reason: '' })
const muteLoading = ref(false)

// @mention
const inputRef = ref(null)
const mentionVisible = ref(false)
const mentionQuery = ref('')
const mentionIndex = ref(0)
const mentionSuggestions = computed(() => {
  const q = mentionQuery.value.toLowerCase()
  // 不 @ 自己
  let list = speakersList.value.filter(s => s.userId !== myUserId.value)
  if (!q) return list
  return list.filter(s => (s.username || '').toLowerCase().startsWith(q))
})

// 打开禁言面板时自动刷新列表
watch(showMuted, (val) => {
  if (val) loadSpeakers()
})

let page = 1
let hasHistory = false
let totalHistory = 0
let onlineTimer = null

/** 从公开统计接口获取当前在线人数，每 30 秒刷新 */
async function loadOnlineCount() {
  try {
    const res = await fetch('/api/auth/stats')
    const data = await res.json()
    if (data.code === 200 && data.data?.onlineCount != null) {
      onlineCount.value = data.data.onlineCount
    }
  } catch { /* keep previous value */ }
}

onMounted(async () => {
  try {
    const me = await getMe()
    myUserId.value = me.id
    myRole.value = me.role || ''
    isAdmin.value = me.role === 'ADMIN'
  } catch { /* ignore */ }

  // 监听连接状态
  onConnected(() => { connected.value = true })

  // 加载聊天室信息
  try {
    const rooms = await getRooms()
    room.value = rooms.find(r => r.id === roomId.value) || rooms[0] || null
    if (room.value) roomId.value = room.value.id
  } catch { /* ignore */ }

  await loadHistory()
  subscribeToRoom()
  loadSpeakers()

  // 定时拉取在线人数
  loadOnlineCount()
  onlineTimer = setInterval(loadOnlineCount, 30_000)
})

onBeforeUnmount(() => {
  unsubscribeRoom(roomSub)
  roomSub = null
  if (onlineTimer) { clearInterval(onlineTimer); onlineTimer = null }
})

function subscribeToRoom() {
  roomSub = subscribeRoom(roomId.value, (data) => {
    if (data.type === 'RECALL') {
      const found = messages.value.find(m => m.id === data.msgId)
      if (found) {
        found.type = 'RECALL'
        found.senderName = data.senderName
        found.recalled = true
        messages.value = [...messages.value]
      }
    } else if (data.type === 'PINNED' || data.type === 'UNPINNED') {
      loadPinned()
    } else if (data.type === 'MUTED' && data.userId === myUserId.value) {
      muted.value = true
      ElMessage.warning('你已被管理员禁言')
    } else if (data.type === 'UNMUTED' && data.userId === myUserId.value) {
      muted.value = false
      ElMessage.success('你已被解除禁言')
    } else {
      addMessage(data)
    }
  })
}

function addMessage(data) {
  data._key = data.id || (Date.now() + Math.random())
  messages.value.push(data)
  nextTick(() => scrollToBottom())
}

async function loadHistory() {
  try {
    const res = await getHistory(roomId.value, page, 30)
    const records = res.records || []
    totalHistory = res.total || 0
    pinnedMessages.value = res.pinnedMessages || []
    if (records.length) {
      const formatted = records.reverse().map(m => ({
        ...m,
        _key: 'h-' + m.id,
        // 已撤回的消息：type 改为 RECALL，不再渲染消息气泡
        ...(m.recalled ? { type: 'RECALL' } : {})
      }))
      messages.value = [...formatted, ...messages.value]
      hasHistory = messages.value.length < totalHistory
    }
    nextTick(() => scrollToBottom())
  } catch { /* ignore */ }
}

async function loadMore() {
  page++
  await loadHistory()
  loadingMore.value = false
}

async function loadPinned() {
  try {
    const res = await getHistory(roomId.value, 1, 1)
    pinnedMessages.value = res.pinnedMessages || []
  } catch { /* ignore */ }
}

async function loadMuted() {
  if (!isAdmin.value) return
  mutedLoading.value = true
  try {
    mutedList.value = await getMutedUsers(roomId.value)
  } catch { /* ignore */ }
  finally { mutedLoading.value = false }
}

function scrollToBottom() {
  bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// ===== @mention =====
function onInputChange() {
  const val = input.value
  const lastAt = val.lastIndexOf('@')
  if (lastAt >= 0 && (lastAt === 0 || val[lastAt - 1] === ' ')) {
    const query = val.slice(lastAt + 1)
    if (!query.includes(' ')) {
      mentionQuery.value = query
      mentionVisible.value = true
      mentionIndex.value = 0
      return
    }
  }
  mentionVisible.value = false
}

function onInputKeydown(e) {
  // Ctrl+Enter 发送消息
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    onSend()
    return
  }
  // @mention 弹窗键盘导航
  if (!mentionVisible.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    mentionIndex.value = Math.min(mentionIndex.value + 1, mentionSuggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mentionIndex.value = Math.max(mentionIndex.value - 1, 0)
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (mentionSuggestions.value.length > 0) {
      e.preventDefault()
      selectMention(mentionSuggestions.value[mentionIndex.value])
    }
  } else if (e.key === 'Escape') {
    mentionVisible.value = false
  }
}

function selectMention(u) {
  const val = input.value
  const lastAt = val.lastIndexOf('@')
  if (lastAt >= 0) {
    input.value = val.slice(0, lastAt + 1) + u.username + ' ' + val.slice(lastAt + 1 + mentionQuery.value.length)
  }
  mentionVisible.value = false
  inputRef.value?.focus()
}

function onSend() {
  const text = input.value.trim()
  if (!text) return
  if (!isConnected()) {
    ElMessage.warning('正在连接服务器，请稍后再试')
    return
  }
  publish(`/app/chat.send/${roomId.value}`, { content: text, type: 'TEXT' })
  input.value = ''
}

async function onRecall(msg) {
  if (!isConnected()) return
  publish(`/app/chat.recall/${roomId.value}`, { msgId: msg.id })
}

async function onPin(msg) {
  if (!isConnected()) return
  publish(`/app/chat.pin/${roomId.value}`, { msgId: msg.id })
}

async function onUnpin(pm) {
  if (!isConnected()) return
  publish(`/app/chat.unpin/${roomId.value}`, { msgId: pm.id })
}

async function loadSpeakers() {
  speakersLoading.value = true
  try {
    speakersList.value = await getSpeakers(roomId.value)
  } catch { /* ignore */ }
  finally { speakersLoading.value = false }
}

function openMuteDialog(row) {
  muteTarget.value = row
  muteForm.value = { minutes: 30, reason: '' }
  muteDialogVisible.value = true
}

async function onMuteConfirm() {
  if (!muteTarget.value) return
  muteLoading.value = true
  try {
    await muteUser(roomId.value, muteTarget.value.userId, muteForm.value.reason, muteForm.value.minutes)
    ElMessage.success('已禁言 ' + muteTarget.value.username)
    muteDialogVisible.value = false
    await loadSpeakers()
  } catch (e) {
    ElMessage.error('操作失败: ' + e.message)
  } finally {
    muteLoading.value = false
  }
}

async function onUnmute(userId) {
  try {
    await unmuteUser(roomId.value, userId)
    ElMessage.success('已解除禁言')
    await loadSpeakers()
  } catch (e) {
    ElMessage.error('操作失败: ' + e.message)
  }
}

const loadingMore = ref(false)
</script>

<style>
/* 聊天页填满视口：去除外层容器 padding，防止页面级滚动条 */
.page-container:has(.chat-page) {
  padding: 8px 16px;
}

/* 禁言弹窗遮罩：无动画，直接出现/消失 */
.el-overlay.mute-dialog-overlay {
  animation: none !important;
}
</style>

<style scoped>
.chat-page {
  max-width: 900px;
  margin: 0 auto;
  height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
  flex-shrink: 0;
}
.chat-title { font-size: 17px; font-weight: 600; color: #1a1a2e; margin: 0; }
.chat-online { font-size: 13px; color: #67c23a; margin-left: auto; }

/* ===== 滑动容器 ===== */
.chat-slider {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.chat-slider-track {
  display: flex;
  width: 200%;
  height: 100%;
  transition: transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.chat-slider-track.slid-left {
  transform: translateX(-50%);
}

/* 各面板占滑块的一半 = 容器 100% */
.chat-panel,
.mute-panel {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.chat-body::-webkit-scrollbar { width: 5px; }
.chat-body::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

.load-more { text-align: center; margin-bottom: 12px; }

.pinned-section {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.pinned-label { font-size: 12px; font-weight: 600; color: #d48806; margin-bottom: 6px; }
.pinned-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}
.pinned-item + .pinned-item { border-top: 1px dashed #ffe58f; padding-top: 6px; margin-top: 2px; }
.pinned-msg { color: #8c6d00 !important; flex: 1; min-width: 0; }
.pinned-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pinned-remove { font-size: 12px !important; padding: 0 4px !important; height: auto !important; }

.msg-item { margin-bottom: 16px; max-width: 75%; }
.msg-item.me { margin-left: auto; text-align: right; }
.msg-item.system { max-width: 100%; text-align: center; }
.msg-sender { font-size: 12px; color: #999; margin-bottom: 4px; }
.msg-bubble {
  display: inline-block;
  padding: 10px 16px;
  border-radius: 14px;
  background: #f0f2f5;
  color: #333;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.msg-item.me .msg-bubble { background: #409eff; color: #fff; }
.msg-bubble.admin { border: 1px solid #e6a23c; }
.recall, .system-msg { color: #999; font-size: 13px; font-style: italic; }
.recalled-text { color: #bbb; font-style: italic; }
.msg-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.msg-item.me .msg-meta { justify-content: flex-end; }
.msg-time { font-size: 11px; color: #bbb; }
.msg-action { font-size: 11px !important; padding: 0 4px !important; height: auto !important; }

.chat-input {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafbfc;
  position: relative;
}

/* @mention 弹窗 */
.mention-popup {
  position: absolute;
  bottom: 100%;
  left: 24px;
  right: 24px;
  max-height: 180px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
  margin-bottom: 6px;
  z-index: 50;
}
.mention-item {
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.15s;
}
.mention-item:hover,
.mention-item--active {
  background: #ecf5ff;
  color: #409eff;
}
.mention-username {
  font-weight: 500;
}
.mention-empty {
  padding: 14px;
  text-align: center;
  font-size: 12px;
  color: #bbb;
}

.chat-input-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.chat-input-field {
  flex: 1;
}

/* 输入框填满行高，与发送按钮上下对齐 */
.chat-input-field :deep(.el-input) {
  height: 100%;
}
.chat-input-field :deep(.el-input__wrapper) {
  height: 100%;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: box-shadow 0.2s ease;
  box-sizing: border-box;
}
.chat-input-field :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}
.chat-input-field :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

/* 发送按钮 — 与输入框等高，无外框 */
.send-btn {
  flex-shrink: 0;
  min-width: 72px;
  border-radius: 10px !important;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.5px;
  box-shadow: none !important;
  padding: 0 20px;
}
.send-btn.send-btn--active {
  background: #409eff !important;
  border-color: #409eff !important;
  color: #fff !important;
}
.send-btn:not(.send-btn--active) {
  background: #dcdfe6 !important;
  border-color: #dcdfe6 !important;
  color: #fff !important;
}
.muted-tip { font-size: 12px; color: #f56c6c; margin-top: 4px; display: block; }

.mute-panel {
  padding: 16px 24px;
  overflow-y: auto;
  background: #fafbfc;
}
.mute-panel-header { display: flex; align-items: center; justify-content: space-between; }
.speaker-search { margin-bottom: 10px; }
.mute-target-name { font-weight: 600; color: #1a1a2e; }
.chat-disconnected {
  text-align: center;
  padding: 10px;
  background: #fef0f0;
  color: #f56c6c;
  font-size: 13px;
}
</style>
