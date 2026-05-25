<template>
  <div class="admin-page">
    <!-- ========== 用户详情视图 ========== -->
    <template v-if="userId">
      <div class="page-head">
        <el-button text :icon="ArrowLeft" @click="$router.push('/admin/users')" class="back-btn">返回用户列表</el-button>
        <h2 class="page-title">👤 用户详情</h2>
      </div>

      <!-- 用户基本信息 -->
      <el-card class="section-card" v-loading="detailLoading">
        <template #header><span class="section-title">基本信息</span></template>
        <el-descriptions v-if="userDetail" :column="2" border>
          <el-descriptions-item label="ID">{{ userDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ userDetail.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userDetail.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="userDetail.role === 'ADMIN' ? 'warning' : 'info'" size="small" effect="dark">
              {{ userDetail.role === 'ADMIN' ? '管理员' : '普通用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="账号状态">
            <el-tag :type="userDetail.status === 0 ? 'danger' : 'success'" size="small" effect="dark" round>
              {{ userDetail.status === 0 ? '已锁定' : '正常' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="锁定原因">{{ userDetail.lockedReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录失败次数">{{ userDetail.loginFailCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ userDetail.lastLoginAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ userDetail.createdAt || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 操作按钮 -->
        <div v-if="userDetail && userDetail.role !== 'ADMIN'" class="detail-actions">
          <el-button v-if="userDetail.status === 1" type="danger" @click="onLock(userDetail)">🔒 锁定账号</el-button>
          <el-button v-if="userDetail.status === 0" type="success" @click="onUnlock(userDetail)">🔓 解锁账号</el-button>
        </div>
      </el-card>

      <!-- 用户面试记录 -->
      <el-card class="section-card" style="margin-top:16px" v-loading="sessionsLoading">
        <template #header><span class="section-title">📋 面试记录</span></template>
        <el-table v-if="userSessions.length" :data="userSessions" stripe style="width:100%">
          <el-table-column prop="id" label="会话ID" width="80" />
          <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="sessionStateTag(row.state)" size="small" effect="dark" round>
                {{ sessionStateLabel(row.state) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="120">
            <template #default="{ row }">{{ row.currentRound }} / {{ row.totalRounds }} 轮</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column prop="completedAt" label="完成时间" width="160">
            <template #default="{ row }">{{ row.completedAt || '-' }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="该用户暂无面试记录" :image-size="80" />
      </el-card>
    </template>

    <!-- ========== 用户列表视图 ========== -->
    <template v-else>
      <div class="page-head">
        <h2 class="page-title">👥 用户管理</h2>
        <p class="page-desc">查看和管理平台用户账号</p>
      </div>

      <!-- 搜索 -->
      <el-card class="search-card">
        <el-form :inline="true" @submit.prevent>
          <el-form-item>
            <el-input v-model="keyword" placeholder="用户名 / 邮箱" clearable @keyup.enter="onSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">搜索</el-button>
            <el-button @click="keyword=''; onSearch()">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 用户列表 -->
      <el-card class="section-card">
        <el-table :data="list" stripe v-loading="loading" style="width:100%">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="用户名" min-width="120">
            <template #default="{ row }">
              <span>{{ row.username }}</span>
              <el-tag v-if="row.role === 'ADMIN'" size="small" type="warning" effect="dark" style="margin-left:4px">ADMIN</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="160" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'danger' : 'success'" size="small" effect="dark" round>
                {{ row.status === 0 ? '锁定' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="loginFailCount" label="失败登录" width="80" align="center" />
          <el-table-column prop="lastLoginAt" label="最近登录" width="160">
            <template #default="{ row }">{{ row.lastLoginAt || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="$router.push('/admin/users/' + row.id)">详情</el-button>
              <el-button v-if="row.role !== 'ADMIN' && row.status === 1" size="small" text type="danger" @click="onLock(row)">锁定</el-button>
              <el-button v-if="row.role !== 'ADMIN' && row.status === 0" size="small" text type="success" @click="onUnlock(row)">解锁</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrap" v-if="total > 0">
          <el-pagination
            v-model:current-page="page"
            :page-size="size"
            :total="total"
            layout="prev, pager, next"
            @current-change="loadUsers"
          />
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUsers, getUserDetail, getUserSessions, setUserStatus } from '../../api/admin.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()

// ===== 列表状态 =====
const list = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const loading = ref(false)

// ===== 详情状态 =====
const userId = computed(() => route.params.id ? parseInt(route.params.id) : null)
const userDetail = ref(null)
const userSessions = ref([])
const detailLoading = ref(false)
const sessionsLoading = ref(false)

// ===== 列表方法 =====
async function loadUsers() {
  loading.value = true
  try {
    const res = await getUsers(page.value, size.value, keyword.value)
    list.value = res.records || []
    total.value = res.totalRow || 0
  } catch (e) {
    ElMessage.error('加载用户列表失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  loadUsers()
}

// ===== 详情方法 =====
async function loadUserDetail() {
  if (!userId.value) return
  detailLoading.value = true
  sessionsLoading.value = true
  try {
    const [detail, sessions] = await Promise.all([
      getUserDetail(userId.value),
      getUserSessions(userId.value),
    ])
    userDetail.value = detail
    userSessions.value = sessions || []
  } catch (e) {
    ElMessage.error('加载用户详情失败: ' + e.message)
  } finally {
    detailLoading.value = false
    sessionsLoading.value = false
  }
}

// ===== 锁定/解锁（列表和详情共用） =====
async function onLock(row) {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `确定锁定用户「${row.username}」？请输入锁定原因：`,
      '锁定账号',
      { inputPlaceholder: '锁定原因（必填）', inputValidator: v => !!v || '请输入原因' }
    )
    await setUserStatus(row.id, 0, reason)
    ElMessage.success('已锁定')
    if (userId.value) {
      await loadUserDetail()
    } else {
      await loadUsers()
    }
  } catch (_) { /* 取消 */ }
}

async function onUnlock(row) {
  try {
    await ElMessageBox.confirm(`确定解锁用户「${row.username}」？`, '解锁账号', { type: 'info' })
    await setUserStatus(row.id, 1, '')
    ElMessage.success('已解锁')
    if (userId.value) {
      await loadUserDetail()
    } else {
      await loadUsers()
    }
  } catch (_) { /* 取消 */ }
}

// ===== 工具方法 =====
function sessionStateLabel(s) {
  const map = { CREATED: '已创建', WAITING: '等待', QUESTIONING: '提问中', ANSWERING: '回答中', SCORING: '评分', COMPLETED: '已完成', EXPIRED: '已过期', INTERRUPTED: '中断', EXITED: '已退出' }
  return map[s] || s
}
function sessionStateTag(s) {
  const map = { CREATED: 'info', QUESTIONING: 'warning', SCORING: '', COMPLETED: 'success', EXITED: 'info', EXPIRED: 'danger', INTERRUPTED: 'danger' }
  return map[s] || 'info'
}

// ===== 生命周期 =====
onMounted(() => {
  if (userId.value) {
    loadUserDetail()
  } else {
    loadUsers()
  }
})

// 路由参数变化时切换视图
watch(userId, (newId) => {
  if (newId) {
    loadUserDetail()
  } else {
    userDetail.value = null
    userSessions.value = []
    loadUsers()
  }
})
</script>

<style scoped>
.admin-page { animation: pageIn 0.4s ease both; }
@keyframes pageIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
.page-head { margin-bottom:20px; }
.page-title { font-size:24px; font-weight:700; color:#1a1a2e; margin:0 0 6px; }
.page-desc { font-size:14px; color:#888; margin:0; }
.back-btn { margin-bottom:12px; }
.search-card { margin-bottom:16px; border-radius:14px !important; }
.section-card { border-radius:14px !important; }
.section-title { font-size:16px; font-weight:600; color:#1a1a2e; }
.pagination-wrap { display:flex; justify-content:center; margin-top:20px; }
.detail-actions { margin-top:16px; display:flex; gap:12px; }
:deep(.el-table th) { background:#f8f9fc !important; }
</style>
