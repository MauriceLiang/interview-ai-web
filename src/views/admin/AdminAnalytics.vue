<template>
  <div class="analytics-page">
    <div class="page-head">
      <h2 class="page-title">📈 数据分析</h2>
      <div class="page-actions">
        <el-radio-group v-model="days" size="small" @change="load">
          <el-radio-button :value="7">7天</el-radio-button>
          <el-radio-button :value="30">30天</el-radio-button>
          <el-radio-button :value="90">90天</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-loading="loading">
      <!-- 核心业务卡片 -->
      <el-row :gutter="16" class="stat-row" v-if="data">
        <el-col :xs="12" :sm="8" :md="4" v-for="c in bizCards" :key="c.label">
          <el-card shadow="hover" class="stat-card" :style="{ borderTop: '3px solid ' + c.color }">
            <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
            <div class="stat-label">{{ c.label }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 漏斗 + 用户分层 -->
      <el-row :gutter="16" v-if="data">
        <el-col :xs="24" :md="12">
          <el-card class="chart-card">
            <template #header><span class="chart-title">🔄 用户转化漏斗</span></template>
            <div ref="funnelRef" class="chart-box"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card class="chart-card">
            <template #header><span class="chart-title">👥 用户分层</span></template>
            <div ref="tierRef" class="chart-box"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 岗位分析 -->
      <el-row :gutter="16" v-if="data">
        <el-col :xs="24" :md="14">
          <el-card class="chart-card">
            <template #header><span class="chart-title">🏷 岗位热度排行</span></template>
            <div ref="positionRef" class="chart-box"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="10">
          <el-card class="chart-card">
            <template #header><span class="chart-title">⚡ 调用类型分布</span></template>
            <div ref="typeRef" class="chart-box"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 成本概览 -->
      <el-row :gutter="16" v-if="data">
        <el-col :xs="12" :sm="6" v-for="c in costCards" :key="c.label">
          <el-card shadow="hover" class="stat-card" :style="{ borderTop: '3px solid ' + c.color }">
            <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
            <div class="stat-label">{{ c.label }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 趋势图 -->
      <el-card class="chart-card" style="margin-top:0" v-if="data">
        <template #header><span class="chart-title">📊 {{ days }}天趋势对比</span></template>
        <div ref="trendRef" class="chart-box" style="height:380px"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getAnalytics } from '../../api/admin.js'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const data = ref(null)
const days = ref(7)

const funnelRef = ref(null)
const tierRef = ref(null)
const positionRef = ref(null)
const typeRef = ref(null)
const trendRef = ref(null)

let charts = []

const bizCards = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { label: '累计用户', value: fmtNum(d.totalUsers), color: '#409eff' },
    { label: '日活 (DAU)', value: d.dau, color: '#67c23a' },
    { label: '今日面试', value: d.todayInterviews, color: '#e6a23c' },
    { label: '完成率', value: d.completionRate + '%', color: '#f56c6c' },
    { label: '人均轮次', value: d.avgRounds, color: '#909399' },
    { label: '简历上传', value: d.resumeUploads || '-', color: '#5470c6' },
  ]
})

const costCards = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { label: '累计 AI 调用', value: fmtNum(d.totalAiCalls), color: '#409eff' },
    { label: '累计 Token', value: fmtTokens(d.totalTokens), color: '#e6a23c' },
    { label: '累计费用 (¥)', value: '¥' + (d.totalCostEstimate || 0).toFixed(2), color: '#f56c6c' },
    { label: '单次面试成本 (¥)', value: '¥' + (d.avgCostPerInterview || 0).toFixed(2), color: '#909399' },
  ]
})

function fmtNum(n) { if (n >= 10000) return (n / 10000).toFixed(1) + '万'; return String(n) }
function fmtTokens(n) { if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return String(n) }
function fmtLarge(n) { if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'; return String(n) }

async function load() {
  loading.value = true
  try {
    data.value = await getAnalytics(days.value)
    await nextTick()
    disposeAll()
    renderAll()
  } catch (e) {
    ElMessage.error('加载分析数据失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

function renderAll() {
  renderFunnel()
  renderTier()
  renderPosition()
  renderType()
  renderTrend()
}

function renderFunnel() {
  if (!funnelRef.value || !data.value?.funnel) return
  const c = echarts.init(funnelRef.value)
  charts.push(c)
  const f = data.value.funnel
  const stages = [
    { name: '注册', value: f.registered },
    { name: '激活', value: f.activated },
    { name: '参与', value: f.participated },
    { name: '完成', value: f.completed },
    { name: '回访', value: f.returned },
  ]
  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人' },
    series: [{
      type: 'funnel', left: '10%', right: '10%', top: 20, bottom: 20,
      minSize: '15%', maxSize: '100%', gap: 4,
      label: { show: true, position: 'inside', formatter: '{b}\n{c}', fontSize: 13 },
      labelLine: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: stages,
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
    }],
  })
}

function renderTier() {
  if (!tierRef.value || !data.value?.userTiers) return
  const c = echarts.init(tierRef.value)
  charts.push(c)
  const t = data.value.userTiers
  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%' },
      data: [
        { name: '未使用', value: t.tierZero, itemStyle: { color: '#dcdfe6' } },
        { name: '轻度(1-3次)', value: t.tierFree, itemStyle: { color: '#409eff' } },
        { name: '活跃(4-10次)', value: t.tierActive, itemStyle: { color: '#67c23a' } },
        { name: '重度(>10次)', value: t.tierHeavy, itemStyle: { color: '#e6a23c' } },
      ],
    }],
  })
}

function renderPosition() {
  if (!positionRef.value || !data.value?.positionStats?.length) return
  const c = echarts.init(positionRef.value)
  charts.push(c)
  const ps = data.value.positionStats.slice(0, 10)
  c.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 60, top: 10, bottom: 20 },
    xAxis: { type: 'value', axisLabel: { fontSize: 11, formatter: fmtLarge } },
    yAxis: { type: 'category', data: ps.map(p => p.name || p.position).reverse(),
             axisLabel: { fontSize: 11 }, inverse: true },
    series: [{
      type: 'bar', data: ps.map(p => p.sessionCount).reverse(),
      barMaxWidth: 20,
      itemStyle: { color: '#409eff', borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', fontSize: 11, color: '#666' },
    }],
  })
}

function renderType() {
  if (!typeRef.value || !data.value?.callTypeStats) return
  const c = echarts.init(typeRef.value)
  charts.push(c)
  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%' },
      data: data.value.callTypeStats.map(s => ({ name: s.type, value: s.count })),
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
    }],
  })
}

function renderTrend() {
  if (!trendRef.value || !data.value) return
  const c = echarts.init(trendRef.value)
  charts.push(c)
  const d = data.value
  c.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['面试场次', '完成', '退出', '新增用户', 'AI调用'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 50, right: 50, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: d.trendLabels, axisLabel: { fontSize: 11 } },
    yAxis: [
      { type: 'value', axisLabel: { fontSize: 11, formatter: fmtLarge }, splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
      { type: 'value', axisLabel: { fontSize: 11, formatter: fmtLarge } },
    ],
    series: [
      { name: '面试场次', type: 'bar', data: d.dailyInterviews, barMaxWidth: 20,
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] } },
      { name: '完成', type: 'bar', data: d.dailyCompleted, barMaxWidth: 20,
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] } },
      { name: '退出', type: 'bar', data: d.dailyDropouts, barMaxWidth: 20,
        itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] } },
      { name: '新增用户', type: 'line', data: d.dailyNewUsers, yAxisIndex: 1,
        smooth: true, lineStyle: { color: '#e6a23c', width: 2 }, symbol: 'circle', symbolSize: 6 },
      { name: 'AI调用', type: 'line', data: d.dailyAiCalls, yAxisIndex: 1,
        smooth: true, lineStyle: { color: '#909399', width: 2, type: 'dashed' }, symbol: 'diamond', symbolSize: 6 },
    ],
  })
}

function disposeAll() {
  charts.forEach(c => c.dispose())
  charts = []
}

function handleResize() { charts.forEach(c => c.resize()) }

onMounted(() => { load(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); disposeAll() })
</script>

<style scoped>
.analytics-page { animation: pageIn 0.4s ease both; }
@keyframes pageIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }

.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0; }

.stat-row { margin-bottom: 20px; }
.stat-card { text-align: center; border-radius: 12px !important; cursor: default; }
.stat-value { font-size: 24px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: #888; margin-top: 4px; }

.chart-card { border-radius: 14px !important; margin-bottom: 20px; }
.chart-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
.chart-box { width: 100%; height: 300px; }

/* 统一所有 el-row 底部间距 */
.el-row { margin-bottom: 20px; }
.el-row:last-child { margin-bottom: 0; }

@media (max-width: 768px) {
  .stat-value { font-size: 20px; }
  .chart-box { height: 240px; }
}
</style>
