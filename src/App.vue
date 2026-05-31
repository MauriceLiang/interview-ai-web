<template>
  <div id="zhimian-app">
    <!-- 导航栏 -->
    <el-menu
      v-if="showNav"
      mode="horizontal"
      :ellipsis="false"
      :default-active="route.path"
      class="app-nav"
      @select="onNavSelect"
    >
      <el-menu-item index="/templates" class="nav-brand">
        <span class="brand-icon">🧠</span>
        <span class="brand-text">智面</span>
      </el-menu-item>

      <div class="nav-spacer" />

      <!-- 普通用户导航 -->
      <template v-if="!isAdmin">
        <el-menu-item index="/templates">
          <el-icon><Notebook /></el-icon>
          <span class="nav-label">面试</span>
        </el-menu-item>
        <el-menu-item index="/history">
          <el-icon><Clock /></el-icon>
          <span class="nav-label">历史</span>
        </el-menu-item>
        <el-menu-item index="/wrong-answers">
          <el-icon><EditPen /></el-icon>
          <span class="nav-label">错题本</span>
        </el-menu-item>
        <el-menu-item index="/chat">
          <el-icon><ChatDotRound /></el-icon>
          <span class="nav-label">交流</span>
        </el-menu-item>
      </template>

      <!-- 管理员入口（管理员仅显示管理导航） -->
      <template v-if="isAdmin">
        <el-menu-item index="/admin/dashboard">
          <el-icon><Setting /></el-icon>
          <span class="nav-label">仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span class="nav-label">用户管理</span>
        </el-menu-item>
        <el-menu-item index="/chat">
          <el-icon><ChatDotRound /></el-icon>
          <span class="nav-label">交流大厅</span>
        </el-menu-item>
        <el-menu-item index="/admin/analytics">
          <el-icon><TrendCharts /></el-icon>
          <span class="nav-label">数据分析</span>
        </el-menu-item>
      </template>

      <el-dropdown class="nav-user" @command="onLogout">
        <span class="nav-user-link">
          <el-icon><User /></el-icon>
          <span class="nav-label">{{ username || '用户' }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-menu>

    <div class="page-container" :class="{ 'container': !guestPage && !fullscreenPage, 'page-container--guest': guestPage, 'page-container--fullscreen': fullscreenPage }">
      <router-view :key="route.fullPath" v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getMe, getToken, clearToken, setRole, getRole } from './api/index.js'
import { ElMessageBox } from 'element-plus'
import { connectPersonal, disconnectAll } from './lib/stomp.js'
import { Notebook, Clock, Setting, User, SwitchButton, TrendCharts, ChatDotRound, EditPen } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const username = ref('')
const userRole = ref('')

const showNav = computed(() => !route.meta?.guest)
const guestPage = computed(() => route.meta?.guest)
const fullscreenPage = computed(() => route.meta?.fullscreen)
const isAdmin = computed(() => userRole.value === 'ADMIN')

async function onNavSelect(index) {
  const confirmed = await confirmLeaveActiveInterview()
  if (!confirmed) return
  window.location.hash = '#' + index
}

onMounted(async () => {
  const token = getToken()
  if (token) {
    try {
      const u = await getMe()
      username.value = u.username
      userRole.value = u.role || ''
      setRole(u.role || '')

      // 建立 WebSocket，登录后立即能收到 @通知
      connectPersonal(token)

      // 管理员自动跳转到管理后台（除非已在管理页面或聊天室）
      if (u.role === 'ADMIN' && !route.path.startsWith('/admin') && !route.path.startsWith('/chat')) {
        window.location.hash = '#/admin/dashboard'
        return
      }
    } catch {
      clearToken()
    }
  }
})

async function onLogout() {
  const confirmed = await confirmLeaveActiveInterview()
  if (!confirmed) return
  disconnectAll()
  clearToken()
  setRole('')
  username.value = ''
  userRole.value = ''
  window.location.hash = '#/login'
  window.location.reload()
}

/**
 * 检查是否正在进行中的面试
 * 如果是则弹窗确认，防止用户意外离开导致面试中断不可恢复
 */
async function confirmLeaveActiveInterview() {
  // 管理员不参与面试，跳过离开确认
  if (isAdmin.value) return true

  const raw = sessionStorage.getItem('active_interview')
  if (!raw) return true

  let interview
  try { interview = JSON.parse(raw) } catch { return true }

  // 已完成/已退出的面试不需要拦截
  if (!interview || interview.state === 'COMPLETED' || interview.state === 'EXITED' || interview.state === 'EXPIRED') {
    return true
  }

  // 当前不在面试页时也放行（避免从其他页导航也被拦截）
  if (!route.path.startsWith('/interview/')) {
    return true
  }

  try {
    await ElMessageBox.confirm(
      `<div style="line-height:1.8">
        <p style="margin:0 0 12px;font-size:15px;font-weight:600">🧠 面试尚未完成</p>
        <p style="margin:0 0 8px;font-size:14px;color:#444">
          当前正在进行 <strong>${interview.title || '模拟面试'}</strong>（第 ${interview.round + 1}/${interview.total} 轮），
          离开后 <strong style="color:#f56c6c">不可再次进入</strong>。
        </p>
        <p style="margin:0;font-size:13px;color:#909399">
          面试将被标记为"已退出"，届时需重新开始一场新的面试。
        </p>
      </div>`,
      '确认离开？',
      {
        confirmButtonText: '确定离开',
        cancelButtonText: '继续面试',
        type: 'warning',
        round: true,
        dangerouslyUseHTMLString: true,
      }
    )
    return true
  } catch {
    return false
  }
}
</script>

<style scoped>
.app-nav {
  display: flex;
  align-items: center;
  padding: 0 32px !important;
}

.nav-brand {
  pointer-events: none !important;
  opacity: 1 !important;
  display: flex !important;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 0 !important;
}

.brand-icon {
  font-size: 24px;
  line-height: 1;
  display: inline-block;
  animation: brandPulse 3s ease-in-out infinite;
}
@keyframes brandPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.brand-text {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 1px;
}

.nav-spacer {
  flex: 1;
}

.nav-label {
  margin-left: 4px;
}

/* 用户下拉菜单 */
.nav-user {
  margin-left: auto;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 56px;
}
.nav-user:focus,
.nav-user *:focus {
  outline: none;
}
.nav-user:focus-visible,
.nav-user *:focus-visible {
  outline: none;
}
.nav-user-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
  font-size: 14px;
  outline: none;
  border: none;
}
.nav-user-link:hover {
  color: #409eff;
}

/* 响应式 */
@media (max-width: 640px) {
  .app-nav {
    padding: 0 12px !important;
  }
  .nav-label {
    display: none;
  }
  .brand-text {
    font-size: 17px;
  }
}
</style>
