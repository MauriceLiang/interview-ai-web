<template>
  <div class="detail-page">
    <div class="page-head">
      <h2 class="page-title">面试详情</h2>
    </div>

    <!-- 会话概览 -->
    <el-card v-if="sess" class="detail-summary">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="标题" :span="2">{{ sess.title }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="stateTag(sess.state)" size="small" round>{{ stateText(sess.state) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="轮次">{{ sess.currentRound }} / {{ sess.totalRounds }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ sess.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="耗时" v-if="sess.durationSeconds">
          {{ fmtDuration(sess.durationSeconds) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 问答时间线 -->
    <div v-if="qas.length" class="qa-timeline">
      <el-timeline>
        <el-timeline-item
          v-for="qa in qas"
          :key="qa.id"
          :timestamp="'第 ' + (qa.roundNumber + 1) + ' 题'"
          placement="top"
          :color="qa.answerText ? '#409eff' : '#e8e8e8'"
        >
          <el-card shadow="never" class="qa-card">
            <div class="qa-question">
              <el-icon color="#e6a23c"><QuestionFilled /></el-icon>
              <span>{{ qa.questionText }}</span>
            </div>
            <div class="qa-answer" v-if="qa.answerText">
              <el-icon color="#67c23a"><Check /></el-icon>
              <span>{{ qa.answerText }}</span>
            </div>
            <div class="qa-empty" v-else>
              <el-icon color="#bbb"><Minus /></el-icon>
              <span class="empty-text">（未回答）</span>
            </div>

            <!-- 评分展示 -->
            <div v-if="scoreResults[qa.id]" class="qa-score-detail animate-in">
              <div class="score-header">
                <span class="score-header-label">评分</span>
                <span class="score-total">
                  <strong>{{ Math.round(scoreResults[qa.id].totalScore) }}</strong>
                  <small>分</small>
                </span>
              </div>
              <div class="score-dims" v-if="scoreResults[qa.id].dimensions">
                <div class="sd-item" v-for="(info, dimName) in scoreResults[qa.id].dimensions" :key="dimName">
                  <span class="sd-label">{{ dimLabel(dimName) }}</span>
                  <el-progress
                    :percentage="Math.round(info.score)"
                    :color="dimColor(dimName)"
                    :stroke-width="5"
                    size="small"
                  />
                </div>
              </div>
              <div v-if="scoreResults[qa.id].summary" class="score-summary">
                {{ scoreResults[qa.id].summary }}
              </div>
            </div>
            <div class="qa-score" v-else-if="qa.scoreStatus === 'COMPLETED'">
              <el-tag size="small" type="success" effect="light" round>已评分</el-tag>
            </div>
            <div class="qa-score" v-else-if="qa.scoreStatus === 'FAILED'">
              <el-tag size="small" type="danger" effect="light" round>评分失败</el-tag>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div class="detail-actions">
      <el-button @click="$router.push('/history')" :icon="Back">返回列表</el-button>
      <el-button
        v-if="sess?.state === 'COMPLETED'"
        type="primary"
        @click="$router.push('/report/' + sess.id)"
        :icon="Document"
      >
        查看报告
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getSessionDetail } from '../api/index.js'
import { QuestionFilled, Check, Minus, Back, Document } from '@element-plus/icons-vue'

const route = useRoute()
const sess = ref(null)
const qas = ref([])
const scoreResults = ref({})

onMounted(async () => {
  try {
    const data = await getSessionDetail(parseInt(route.params.id))
    sess.value = data.session || data
    qas.value = data.qaRecords || []
    scoreResults.value = data.scoreResults || {}
  } catch (e) {
    console.error(e)
  }
})

function dimLabel(name) {
  return { technicalAccuracy: '技术准确性', clarity: '表达清晰度', completeness: '完整性', depth: '深度' }[name] || name
}
function dimColor(name) {
  return { technicalAccuracy: '#409eff', clarity: '#67c23a', completeness: '#e6a23c', depth: '#f56c6c' }[name] || '#909399'
}

function stateText(s) {
  if (s === 'COMPLETED') return '已完成'
  if (s === 'EXPIRED') return '已过期'
  if (s === 'EXITED') return '已退出'
  return '未完成'
}
function stateTag(s) {
  if (s === 'COMPLETED') return 'primary'
  if (s === 'EXPIRED') return 'danger'
  if (s === 'EXITED') return 'info'
  return 'warning'
}
function fmtDuration(sec) {
  if (!sec) return ''
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return min > 0 ? `${min}分${s}秒` : `${s}秒`
}
</script>

<style scoped>
.detail-page {
  animation: pageIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-head {
  margin-bottom: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.3px;
}

.detail-summary {
  margin-bottom: 24px;
  border-radius: 14px !important;
  overflow: hidden;
}

.detail-summary :deep(.el-descriptions__title) {
  font-weight: 600;
  color: #1a1a2e;
}

.detail-summary :deep(.el-descriptions__cell) {
  padding: 12px 16px;
}

.qa-timeline {
  margin-bottom: 16px;
}

.qa-card {
  padding: 8px 0;
  border-left: 3px solid transparent;
  transition: border-color 0.25s ease, background 0.25s ease;
}
.qa-card:hover {
  border-left-color: #409eff;
  background: #fafbfc;
}
.qa-question {
  display: flex;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 8px;
  line-height: 1.6;
}
.qa-answer {
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: #444;
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.qa-empty {
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: #bbb;
  padding: 8px 4px;
}
.empty-text {
  font-style: italic;
}
.qa-score {
  margin-top: 8px;
}

/* ===== 评分详情 ===== */
.qa-score-detail {
  margin-top: 12px;
  background: #fff;
  border: 1px solid #e8eaef;
  border-radius: 12px;
  padding: 14px 16px;
  animation: fadeUp 0.35s ease both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.score-header-label {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}
.score-total strong {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
  margin-right: 2px;
}
.score-total small {
  font-size: 12px;
  color: #999;
}
.score-dims {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 8px;
}
.sd-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sd-label {
  width: 64px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  text-align: right;
}
.sd-item .el-progress {
  flex: 1;
}
.score-summary {
  font-size: 12px;
  color: #888;
  line-height: 1.6;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
</style>
