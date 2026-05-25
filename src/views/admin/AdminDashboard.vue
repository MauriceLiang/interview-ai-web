<template>
  <div class="admin-page">
    <div class="page-head">
      <h2 class="page-title">📊 管理后台</h2>
      <p class="page-desc">系统运行概况 · 用户监控 · 模型管理</p>
    </div>

    <!-- ===== 系统健康灯 ===== -->
    <div class="health-bar" v-if="data">
      <span class="health-label">系统状态</span>
      <span class="health-dot" v-for="d in healthDots" :key="d.key" :class="'dot-' + d.status" :title="d.detail">
        {{ d.icon }} {{ d.name }}
      </span>
      <span class="health-spacer" />
      <span class="health-label">模型</span>
      <el-select v-model="activeModel" size="small" style="width:140px" @change="onModelSwitch" :disabled="modelSwitching">
        <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
      </el-select>
      <span v-if="modelSwitching" class="model-switch-tip">切换中…</span>
      <el-button size="small" text @click="loadAll" :loading="loading">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <!-- ===== 核心指标卡片（4列 × 2行） ===== -->
    <el-row :gutter="16" class="stat-row" v-if="data">
      <el-col :xs="12" :sm="6" v-for="c in statCards1" :key="c.label">
        <el-card shadow="hover" class="stat-card" :style="{ borderTop: '3px solid ' + c.color }">
          <div class="stat-icon">{{ c.icon }}</div>
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
          <div class="stat-label">{{ c.label }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16" class="stat-row" v-if="data">
      <el-col :xs="12" :sm="6" v-for="c in statCards2" :key="c.label">
        <el-card shadow="hover" class="stat-card" :style="{ borderTop: '3px solid ' + c.color }">
          <div class="stat-icon">{{ c.icon }}</div>
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
          <div class="stat-label">{{ c.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 异常监控 ===== -->
    <el-row :gutter="16" v-if="data">
      <el-col :xs="24" :md="12">
        <el-card class="section-card">
          <template #header><span class="section-title">🔴 近期 AI 失败（最近1h）</span></template>
          <el-table v-if="data.recentAiFailures?.length" :data="data.recentAiFailures" stripe size="small" max-height="220">
            <el-table-column prop="provider" label="提供商" width="80" />
            <el-table-column prop="callType" label="类型" width="70" />
            <el-table-column prop="errorMessage" label="错误信息" min-width="160" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="时间" width="80" />
          </el-table>
          <el-empty v-else description="✅ 近期无 AI 调用失败" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="section-card">
          <template #header>
            <span class="section-title">⚠️ 异常账号</span>
            <el-button size="small" text @click="loadLocked" :loading="lockedLoading">刷新</el-button>
          </template>
          <el-table v-if="lockedUsers.length" :data="lockedUsers" stripe size="small" max-height="220">
            <el-table-column prop="username" label="用户名" min-width="100" />
            <el-table-column prop="lockedReason" label="原因" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" text type="success" @click="onUnlock(row)">解锁</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="✅ 无异常账号" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 今日面试详情 ===== -->
    <el-card class="section-card" v-if="data">
      <template #header>
        <span class="section-title">📝 今日面试</span>
        <span class="section-subtitle">共 {{ data.todaySessionList?.length || 0 }} 场</span>
      </template>
      <el-table :data="data.todaySessionList" stripe size="small" max-height="300">
        <el-table-column prop="username" label="用户" width="90" />
        <el-table-column prop="title" label="面试标题" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="stateTag(row.state)" size="small" effect="dark" round>{{ stateLabel(row.state) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="轮次" width="70">
          <template #default="{ row }">{{ row.currentRound }}/{{ row.totalRounds }}</template>
        </el-table-column>
        <el-table-column label="评分" width="70">
          <template #default="{ row }">{{ row.avgScore != null ? row.avgScore : '-' }}</template>
        </el-table-column>
        <el-table-column label="耗时" width="70">
          <template #default="{ row }">{{ row.durationMinutes ? row.durationMinutes + 'm' : '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="140" />
      </el-table>
      <el-empty v-if="!data.todaySessionList?.length" description="今日暂无面试" :image-size="60" />
    </el-card>

    <!-- ===== 待完成面试 ===== -->
    <el-card class="section-card" v-if="data">
      <template #header>
        <span class="section-title">⏳ 待完成面试</span>
        <span class="section-subtitle">共 {{ data.pendingSessionList?.length || 0 }} 场</span>
      </template>
      <el-table :data="data.pendingSessionList" stripe size="small" max-height="260">
        <el-table-column prop="username" label="用户" width="90" />
        <el-table-column prop="title" label="面试标题" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="stateTag(row.state)" size="small" effect="dark" round>{{ stateLabel(row.state) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="进度" width="90">
          <template #default="{ row }">
            <el-progress :percentage="Math.round((row.currentRound / row.totalRounds) * 100)" :stroke-width="6" :show-text="false" />
            <span class="progress-text">{{ row.currentRound }}/{{ row.totalRounds }}</span>
          </template>
        </el-table-column>
        <el-table-column label="停留" width="80">
          <template #default="{ row }">
            <span :class="{ 'stale-warn': row.staleMinutes >= 30 }">{{ row.staleMinutes }}m</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="140" />
      </el-table>
      <el-empty v-if="!data.pendingSessionList?.length" description="暂无待完成面试" :image-size="60" />
    </el-card>

    <!-- ===== 今日新增用户 ===== -->
    <el-card class="section-card" v-if="data">
      <template #header>
        <span class="section-title">🆕 今日新增用户</span>
        <span class="section-subtitle">共 {{ data.todayNewUserList?.length || 0 }} 人</span>
      </template>
      <el-table :data="data.todayNewUserList" stripe size="small" max-height="240">
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column label="已创建面试" width="100">
          <template #default="{ row }">
            <el-tag :type="row.hasInterview ? 'success' : 'info'" size="small" effect="plain" round>
              {{ row.hasInterview ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="140" />
      </el-table>
      <el-empty v-if="!data.todayNewUserList?.length" description="今日暂无新注册用户" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboard, getLockedUsers, setUserStatus, getProvider, switchProvider as switchProviderApi } from '../../api/admin.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const data = ref(null)
const lockedUsers = ref([])
const lockedLoading = ref(false)
const activeModel = ref('')
const availableModels = ref([])
const modelSwitching = ref(false)

const statCards1 = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { icon:'🟢', label:'在线', value: d.onlineUsers, color: '#67c23a' },
    { icon:'👥', label:'总用户', value: d.totalUsers, color: '#409eff' },
    { icon:'🆕', label:'今日新增', value: d.todayNewUsers, color: '#e6a23c' },
    { icon:'📝', label:'今日面试', value: d.todayInterviews, color: '#909399' },
  ]
})
const statCards2 = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { icon:'✅', label:'完成率', value: d.completionRate + '%', color: '#67c23a' },
    { icon:'⏳', label:'待完成', value: d.pendingSessions, color: '#e6a23c' },
    { icon:'💰', label:'AI 费用', value: '¥' + (d.todayCostEstimate || 0).toFixed(1), color: '#f56c6c' },
    { icon:'⏱', label:'AI 耗时', value: d.avgAiDurationMs + 'ms', color: '#909399' },
  ]
})

const healthDots = computed(() => {
  if (!data.value?.health) return []
  const h = data.value.health
  return [
    { key: 'ai', name: 'AI', status: h.aiStatus, icon: h.aiStatus === 'green' ? '✅' : h.aiStatus === 'yellow' ? '⚠️' : '🔴', detail: h.aiDetail },
    { key: 'db', name: 'DB', status: h.dbStatus, icon: '✅', detail: h.dbDetail },
    { key: 'redis', name: 'Redis', status: h.redisStatus, icon: '✅', detail: h.redisDetail },
  ]
})

function stateLabel(s) { const m = { CREATED:'已创建',WAITING:'等待',QUESTIONING:'提问中',ANSWERING:'回答中',SCORING:'评分中',COMPLETED:'已完成',EXPIRED:'已过期',INTERRUPTED:'中断',EXITED:'已退出' }; return m[s]||s }
function stateTag(s) { const m = { CREATED:'info',WAITING:'info',QUESTIONING:'warning',COMPLETED:'success',EXPIRED:'danger',INTERRUPTED:'danger',EXITED:'info' }; return m[s]||'info' }

async function loadAll() {
  loading.value = true
  try {
    data.value = await getDashboard()
    await loadLocked()
    await loadModelInfo()
  } catch (e) {
    ElMessage.error('加载仪表盘失败: ' + e.message)
  } finally { loading.value = false }
}

async function loadLocked() {
  lockedLoading.value = true
  try { lockedUsers.value = await getLockedUsers() } catch { /* ignore */ }
  finally { lockedLoading.value = false }
}

async function loadModelInfo() {
  try {
    const info = await getProvider()
    activeModel.value = info.active
    availableModels.value = info.available || []
  } catch { /* ignore */ }
}

async function onModelSwitch(val) {
  modelSwitching.value = true
  try {
    await switchProviderApi(val)
    ElMessage.success('已切换至 ' + val)
  } catch (e) {
    ElMessage.error('切换失败: ' + e.message)
    loadModelInfo()
  } finally { modelSwitching.value = false }
}

async function onUnlock(row) {
  try {
    await ElMessageBox.confirm(`确定解锁用户「${row.username}」？`, '确认', { type: 'info' })
    await setUserStatus(row.id, 1, '')
    ElMessage.success('已解锁')
    await loadAll()
  } catch { /* cancel */ }
}

onMounted(() => loadAll())
</script>

<style scoped>
.admin-page { animation: pageIn 0.4s ease both; }
@keyframes pageIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }

.page-head { margin-bottom: 16px; }
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 6px; }
.page-desc { font-size: 14px; color: #888; margin: 0; }

/* 健康灯 */
.health-bar {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  background: #fff; border-radius: 12px; margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); font-size: 13px;
}
.health-label { font-weight: 600; color: #1a1a2e; margin-right: 4px; }
.health-dot { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 20px; font-size: 12px; }
.dot-green { background: #f0f9eb; color: #67c23a; }
.dot-yellow { background: #fdf6ec; color: #e6a23c; }
.dot-red { background: #fef0f0; color: #f56c6c; }
.health-spacer { flex: 1; }
.model-switch-tip { font-size: 12px; color: #e6a23c; }

/* 卡片 */
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; border-radius: 12px !important; cursor: default; padding: 4px 0; }
.stat-icon { font-size: 18px; line-height: 1; margin-bottom: 2px; }
.stat-value { font-size: 22px; font-weight: 700; line-height: 1.2; white-space: nowrap; }
.stat-label { font-size: 12px; color: #888; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.section-card { border-radius: 14px !important; margin-bottom: 20px; }
.section-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
.section-subtitle { font-size: 13px; color: #999; margin-left: 8px; }

.progress-text { font-size: 12px; color: #888; margin-left: 6px; }
.stale-warn { color: #f56c6c; font-weight: 600; }

:deep(.el-table th) { background: #f8f9fc !important; }

@media (max-width: 768px) {
  .stat-value { font-size: 18px; }
  .stat-icon { font-size: 16px; }
}
</style>
