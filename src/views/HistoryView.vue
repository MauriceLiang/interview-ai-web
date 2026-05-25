<template>
  <div class="history-page">
    <div class="page-head">
      <h2 class="page-title">面试历史</h2>
      <p class="page-desc">回顾你的每一次模拟面试</p>
    </div>

    <el-empty v-if="list.length === 0" description="暂无面试记录，去开始一场面试吧" />

    <div v-else class="history-list">
      <el-card
        v-for="(s, i) in list"
        :key="s.id"
        shadow="hover"
        class="history-card animate-in"
        :style="{ animationDelay: 0.06 * i + 's' }"
        @click="$router.push('/history/' + s.id)"
      >
        <div class="history-card-body">
          <div class="history-info">
            <div class="history-title">{{ s.title }}</div>
            <div class="history-meta">
              <el-tag
                :type="stateTag(s.state)"
                size="small"
                effect="dark"
                round
              >
                {{ stateText(s.state) }}
              </el-tag>
              <span class="meta-item">{{ s.totalRounds }} 轮</span>
              <span class="meta-item" v-if="s.createdAt">{{ fmt(s.createdAt) }}</span>
              <span class="meta-item" v-if="s.durationSeconds">
                耗时 {{ fmtDuration(s.durationSeconds) }}
              </span>
            </div>
          </div>
          <el-icon class="history-arrow"><ArrowRight /></el-icon>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getHistory } from '../api/index.js'
import { ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()
const list = ref([])

async function loadHistory() {
  try {
    list.value = await getHistory()
  } catch (e) {
    console.error(e)
  }
}

onMounted(loadHistory)

// 兜底：某些边界情况（如从含 SSE 长连接的面试页导航过来）下 onMounted 可能未触发
// 监听路由变化，进入 /history 时重新加载数据
watch(() => route.path, (path) => {
  if (path === '/history') {
    loadHistory()
  }
})

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
function fmt(s) {
  if (!s) return ''
  const d = new Date(s)
  const y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${M}-${D} ${h}:${m}`
}
function fmtDuration(sec) {
  if (!sec) return ''
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return min > 0 ? `${min}分${s}秒` : `${s}秒`
}
</script>

<style scoped>
.history-page {
  animation: pageIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.history-card {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.3s ease;
}
.history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
}

.page-head {
  margin-bottom: 28px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.page-desc {
  font-size: 14px;
  color: #888;
  margin: 0;
  line-height: 1.5;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  cursor: pointer;
}
.history-card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  line-height: 1.4;
}
.history-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #888;
  flex-wrap: wrap;
}
.meta-item {
  color: #999;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.meta-item + .meta-item::before {
  content: '·';
  color: #d0d5dd;
  margin-right: 4px;
}
.history-arrow {
  color: #c8ccd4;
  flex-shrink: 0;
  transition: color 0.2s ease, transform 0.2s ease;
}
.history-card:hover .history-arrow {
  color: #409eff;
  transform: translateX(3px);
}
</style>
