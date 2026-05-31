<template>
  <div class="wrong-page">
    <div class="page-head">
      <h2 class="page-title">📘 错题本</h2>
      <p class="page-desc">收录你面试中得分低于 60 分的题目，以及你手动标记的题目</p>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索错题…"
        clearable
        @clear="onSearch"
        @keyup.enter="onSearch"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="onSearch" :icon="Search">搜索</el-button>
      <el-button @click="onExport" :loading="exporting" :icon="Download" plain>
        导出 Markdown
      </el-button>
    </div>

    <!-- 错题列表 -->
    <div v-if="list.length" class="wrong-list">
      <el-card
        v-for="(item, i) in list"
        :key="item.id"
        class="wrong-card animate-in"
        :style="{ animationDelay: 0.05 * i + 's' }"
      >
        <div class="wrong-header">
          <div class="wrong-meta">
            <span class="wrong-tag" :class="item.autoAdded === 1 ? 'tag-auto' : 'tag-manual'">
              {{ item.autoAdded === 1 ? '自动' : '手动' }}
            </span>
            <span v-if="item.score" class="wrong-score" :class="scoreClass(item.score)">
              {{ item.score }} 分
            </span>
            <span class="wrong-time">{{ formatTime(item.createdAt) }}</span>
          </div>
          <el-button
            size="small"
            text
            type="danger"
            :icon="Delete"
            @click="onDelete(item.id)"
            :loading="deletingId === item.id"
          />
        </div>

        <div class="wrong-question">
          <div class="q-label">📝 题目</div>
          <div class="q-text">{{ item.questionText }}</div>
        </div>

        <!-- 你的回答（可展开） -->
        <div v-if="item.answerText" class="answer-section">
          <div class="s-label" @click="toggleAnswer('a-' + item.id)">
            <span>✍️ 你的回答</span>
            <el-icon class="toggle-icon" :class="{ rotated: expandedIds.has('a-' + item.id) }">
              <ArrowDown />
            </el-icon>
          </div>
          <transition name="expand">
            <div v-if="expandedIds.has('a-' + item.id)" class="a-body">
              <div class="a-text">{{ item.answerText }}</div>
            </div>
          </transition>
        </div>

        <!-- 标准答案（可展开） -->
        <div class="standard-section">
          <div class="s-label" @click="toggleAnswer('s-' + item.id)">
            <span>💡 标准答案</span>
            <el-icon class="toggle-icon" :class="{ rotated: expandedIds.has('s-' + item.id) }">
              <ArrowDown />
            </el-icon>
          </div>
          <transition name="expand">
            <div v-if="expandedIds.has('s-' + item.id)" class="s-body">
              <div v-if="item.standardAnswer" class="s-text" v-html="renderMarkdown(item.standardAnswer)"></div>
              <div v-else class="s-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>AI 正在生成标准答案…</span>
              </div>
            </div>
          </transition>
        </div>
      </el-card>
    </div>

    <el-empty v-else-if="!loading" description="暂无错题，继续加油吧 🎉" :image-size="80" />
    <el-skeleton :rows="5" animated v-if="loading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWrongAnswers, deleteWrongAnswer, exportWrongAnswersMd } from '../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, ArrowDown, Loading, Download } from '@element-plus/icons-vue'

const list = ref([])
const keyword = ref('')
const loading = ref(false)
const expandedIds = ref(new Set())
const deletingId = ref(null)
const exporting = ref(false)

/** 简单 Markdown → HTML 渲染，处理 AI 回答中的常见格式 */
function renderMarkdown(text) {
  if (!text) return ''
  // 转义 HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 代码块（必须优先处理，避免被行内规则污染）
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 水平线
  html = html.replace(/^---+$/gm, '<hr>')

  // 标题（四级到一级，从长到短避免误匹配）
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 段落：没有被 HTML 标签包裹的独立行用 <p> 包起来
  const lines = html.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) { result.push(''); continue }
    // 已经是 HTML 标签开头的行（标题、列表、代码、hr 等），直接保留
    if (/^</.test(trimmed)) {
      result.push(line)
      continue
    }
    // 纯文本行 → 包 <p>
    result.push('<p>' + line + '</p>')
  }

  return result.join('\n')
}

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    list.value = await getWrongAnswers(keyword.value)
  } catch (e) {
    ElMessage.error('加载错题本失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  loadList()
}

function toggleAnswer(id) {
  const set = new Set(expandedIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  expandedIds.value = set
}

async function onDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除这道错题？', '确认', { type: 'info' })
    deletingId.value = id
    await deleteWrongAnswer(id)
    list.value = list.value.filter(item => item.id !== id)
    ElMessage.success('已删除')
  } catch {
    // cancel
  } finally {
    deletingId.value = null
  }
}

async function onExport() {
  exporting.value = true
  try {
    await exportWrongAnswersMd()
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败: ' + e.message)
  } finally {
    exporting.value = false
  }
}

function scoreClass(score) {
  if (score < 40) return 'score-low'
  if (score < 60) return 'score-mid'
  return 'score-high'
}

function formatTime(t) {
  if (!t) return ''
  return t.substring(0, 16).replace('T', ' ')
}
</script>

<style scoped>
.wrong-page {
  animation: pageIn 0.4s ease both;
  max-width: 860px;
  margin: 0 auto;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-head { margin-bottom: 16px; }
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 6px; }
.page-desc { font-size: 14px; color: #888; margin: 0; }

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.search-input {
  flex: 1;
}

/* 错题卡片 */
.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.wrong-card {
  border-radius: 14px !important;
  animation: cardIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.wrong-card :deep(.el-card__body) {
  padding: 20px;
}

/* 头部 */
.wrong-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.wrong-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wrong-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.tag-auto { background: #ecf5ff; color: #409eff; }
.tag-manual { background: #fdf6ec; color: #e6a23c; }
.wrong-score {
  font-size: 14px;
  font-weight: 700;
}
.score-low { color: #f56c6c; }
.score-mid { color: #e6a23c; }
.score-high { color: #67c23a; }
.wrong-time {
  font-size: 12px;
  color: #aaa;
}

/* 题目 */
.wrong-question { margin-bottom: 10px; }
.q-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
}
.q-text {
  font-size: 15px;
  color: #1a1a2e;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* 你的回答（可折叠） */
.answer-section {
  padding-top: 10px;
  margin-bottom: 4px;
}
.a-body {
  margin-top: 10px;
  padding: 12px 14px;
  background: #f8f9fc;
  border-radius: 10px;
  border-left: 3px solid #c0c4cc;
}
.a-text {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 标准答案 */
.standard-section {
  border-top: 1px solid #eee;
  padding-top: 10px;
}
.s-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  cursor: pointer;
  user-select: none;
}
.s-label:hover { opacity: 0.8; }
.toggle-icon {
  transition: transform 0.2s;
  font-size: 14px;
}
.toggle-icon.rotated { transform: rotate(-180deg); }
.s-body {
  margin-top: 10px;
  padding: 12px 14px;
  background: #f0f9eb;
  border-radius: 10px;
  border-left: 3px solid #67c23a;
}
.s-text {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
}
.s-text h1, .s-text h2, .s-text h3, .s-text h4 {
  margin: 16px 0 8px;
  color: #1a1a2e;
  font-weight: 600;
}
.s-text h1 { font-size: 18px; }
.s-text h2 { font-size: 16px; }
.s-text h3 { font-size: 15px; }
.s-text h4 { font-size: 14px; }
.s-text p {
  margin: 0 0 8px;
  line-height: 1.8;
}

.s-text strong {
  font-weight: 600;
  color: #1a1a2e;
}
.s-text hr {
  margin: 12px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}
.s-text pre {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0 12px;
}
.s-text code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}
.s-text :not(pre) > code {
  background: #f0f2f5;
  color: #e01e5a;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}
.s-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

/* transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* animate-in */
.animate-in {
  animation: cardIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}

@media (max-width: 600px) {
  .wrong-card :deep(.el-card__body) { padding: 14px; }
  .q-text { font-size: 14px; }
}
</style>
