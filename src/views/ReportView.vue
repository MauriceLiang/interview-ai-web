<template>
  <div class="report-page">
    <div class="page-head">
      <h2 class="page-title">面试报告</h2>
    </div>

    <!-- 生成中 -->
    <div v-if="!data" class="report-generating">
      <el-card class="generating-card">
        <div class="generating-content">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <div class="generating-title">AI 正在生成报告…</div>
          <div class="generating-hint">正在分析你的面试表现，请稍候</div>
          <div class="generating-progress">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 报告主体 -->
    <template v-else>
      <!-- 总分卡片 -->
      <el-card class="report-score-card animate-in">
        <div class="score-hero">
          <div class="score-ring" :style="{ '--pct': Math.min(data.overallScore / 100, 1) }">
            <span class="score-value">{{ data.overallScore }}</span>
          </div>
          <div class="score-info">
            <div class="score-label">总分</div>
            <div class="score-stats">
              <span class="stat-item">📝 {{ data.totalQuestions }} 题</span>
              <span class="stat-item">✅ {{ data.answeredCount }} 题已答</span>
              <span class="stat-item" v-if="data.totalQuestions">
                📊 {{ Math.round(data.answeredCount / data.totalQuestions * 100) }}% 完成率
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 总评 -->
      <el-card class="report-section animate-in" style="animation-delay:0.1s" v-if="data.overallComment">
        <template #header>
          <span class="section-title">📋 总体评价</span>
        </template>
        <p class="section-body">{{ data.overallComment }}</p>
      </el-card>

      <!-- 维度分析 -->
      <el-card class="report-section animate-in" style="animation-delay:0.18s" v-if="data.dimensionAnalysis">
        <template #header>
          <span class="section-title">📊 能力分析</span>
        </template>
        <div class="section-content sect-dim">{{ renderFormattedText(data.dimensionAnalysis) }}</div>
      </el-card>

      <!-- 优势与待改进 -->
      <el-card class="report-section animate-in" style="animation-delay:0.26s" v-if="data.strengthWeakness">
        <template #header>
          <span class="section-title">🎯 优势与待改进</span>
        </template>
        <div class="section-content sect-sw">{{ renderFormattedText(data.strengthWeakness) }}</div>
      </el-card>

      <!-- 学习建议 -->
      <el-card class="report-section animate-in" style="animation-delay:0.34s" v-if="data.learningSuggestions">
        <template #header>
          <span class="section-title">📚 学习建议</span>
        </template>
        <div class="section-content sect-ls">{{ renderFormattedText(data.learningSuggestions) }}</div>
      </el-card>

      <el-empty v-if="!data.overallComment && !data.dimensionAnalysis && !data.strengthWeakness" description="报告正在生成中…" />
    </template>

    <div v-if="data" class="report-actions">
      <el-button @click="$router.push('/templates')" :icon="Back">返回首页</el-button>
      <el-button
        v-if="data"
        type="primary"
        :icon="Download"
        @click="onExport"
      >
        导出报告
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getReport, exportReportMd } from '../api/index.js'
import { Back, Download, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const sessionId = parseInt(route.params.sessionId)
const data = ref(null)

onMounted(async () => {
  try {
    data.value = await getReport(sessionId)
  } catch (e) {
    console.error(e)
    ElMessage.error('获取报告失败')
  }
})

async function onExport() {
  if (!data.value) {
    ElMessage.warning('暂无报告数据可导出')
    return
  }
  try {
    ElMessage.info('📄 正在生成报告文档，请稍候…')
    await exportReportMd(sessionId)
    ElMessage.success('✅ Markdown 报告已下载完成')
  } catch (e) {
    ElMessage.error('导出失败: ' + (e.message || '未知错误'))
  }
}

/**
 * 将后端返回的格式化文本转为纯文本展示
 * 移除 **粗体** 标记（保留文字），保留换行和缩进结构
 * 兼容旧数据中可能含有的原始 JSON 字符串
 */
function renderFormattedText(text) {
  if (!text) return ''
  let raw = String(text).trim()
  if (!raw) return ''

  // 兼容旧数据：若仍为原始 JSON → 尝试解析为可读文本
  if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
    try {
      const parsed = JSON.parse(raw)
      const fmt = formatJsonToPlain(parsed)
      if (fmt) return fmt
    } catch (_) { /* 继续用原始文本 */ }
  }

  // 移除 ** 标记——保留文字，去掉星号
  let clean = raw.replace(/\*\*(.+?)\*\*/g, '$1')
  // 移除每行开头的 "- " 前缀
  clean = clean.replace(/^- /gm, '')
  return clean
}

/**
 * 将解析后的 JSON 对象/数组转为纯文本（旧报告数据兜底）
 */
function formatJsonToPlain(obj, depth = 0) {
  if (obj === null || obj === undefined) return ''
  const indent = depth > 0 ? '  ' : ''

  if (Array.isArray(obj)) {
    return obj.map((item, i) => {
      const val = typeof item === 'object' ? formatJsonToPlain(item, depth + 1) : String(item)
      return indent + (i + 1) + '. ' + val
    }).join('\n')
  }

  if (typeof obj === 'object') {
    const labels = {
      overallSkillLevel: '能力水平',
      technicalBreadth: '技术广度',
      depthOfKnowledge: '知识深度',
      technicalDepth: '技术深度',
      problemSolving: '问题解决能力',
      technicalAccuracy: '技术准确性',
      clarity: '表达清晰度',
      completeness: '完整性',
      depth: '深度',
      strengths: '优势',
      weaknesses: '待改进',
      summary: '总结',
    }
    return Object.entries(obj).map(([key, val]) => {
      const label = labels[key] || key
      if (typeof val === 'object') {
        const child = formatJsonToPlain(val, depth + 1)
        return indent + label + '：\n' + child
      }
      return indent + label + '：' + String(val)
    }).join('\n')
  }

  return String(obj)
}
</script>

<style scoped>
.report-page {
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

/* ===== 生成中 ===== */
.report-generating {
  display: flex;
  justify-content: center;
  padding: 60px 0;
  animation: generatingIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes generatingIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.generating-card {
  width: 380px;
  max-width: 100%;
  text-align: center;
  border-radius: 20px !important;
  padding: 8px;
}
.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}
.generating-content .el-icon {
  color: #409eff;
}
.generating-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}
.generating-hint {
  font-size: 13px;
  color: #999;
}
.generating-progress {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.generating-progress .dot {
  width: 10px;
  height: 10px;
  background: #409eff;
  border-radius: 50%;
  animation: generatingBlink 1.6s infinite;
}
.generating-progress .dot:nth-child(2) { animation-delay: 0.2s; }
.generating-progress .dot:nth-child(3) { animation-delay: 0.4s; }
.generating-progress .dot:nth-child(4) { animation-delay: 0.6s; }
@keyframes generatingBlink {
  0%, 60%, 100% { opacity: 0.2; transform: scale(0.7); }
  30% { opacity: 1; transform: scale(1); }
}

/* 总分卡片 */
.report-score-card {
  margin-bottom: 16px;
  animation: scoreCardIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes scoreCardIn {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes ringIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

.score-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.score-ring {
  width: 96px;
  height: 96px;
  animation: ringIn 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) 0.15s both;
  border-radius: 50%;
  background: conic-gradient(#409eff calc(var(--pct) * 360deg), #e8e8e8 0deg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.score-ring::before {
  content: '';
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
}
.score-value {
  font-size: 30px;
  font-weight: 700;
  color: #409eff;
  z-index: 1;
}
.score-info {
  flex: 1;
}
.score-label {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}
.score-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}
.stat-item {
  white-space: nowrap;
}

/* 报告段落 */
.report-section {
  margin-bottom: 20px;
  border-radius: 14px !important;
  overflow: hidden;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}
.section-body {
  font-size: 14px;
  line-height: 1.8;
  color: #444;
  white-space: pre-wrap;
  margin: 0;
}

.section-content {
  font-size: 14px;
  line-height: 1.8;
  color: #555;
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
  padding: 4px 0;
  background: #f8f9fc;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #eef0f5;
}

/* 格式化文本渲染 — 利用 pre-wrap 保留换行，去掉 "- " 前缀后无缩进 */
.sect-dim,
.sect-sw,
.sect-ls {
  line-height: 2;
  padding: 14px 20px;
  font-size: 14px;
}

.report-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .score-hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .score-ring {
    width: 80px;
    height: 80px;
  }
  .score-ring::before {
    width: 66px;
    height: 66px;
  }
  .score-value {
    font-size: 24px;
  }
  .score-stats {
    justify-content: center;
  }
}
</style>
