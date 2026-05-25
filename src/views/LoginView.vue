<template>
  <div class="auth-page">
    <!-- 浮动装饰元素 -->
    <div class="float-icon fi-1">🎯</div>
    <div class="float-icon fi-2">📝</div>
    <div class="float-icon fi-3">📊</div>
    <div class="float-icon fi-4">🧠</div>

    <!-- 左侧 — 装饰区 -->
    <div class="auth-sidebar">
      <div class="sidebar-content">
        <div class="sidebar-brand">
          <span class="brand-icon">🧠</span>
          <h1 class="brand-title">智面</h1>
          <p class="brand-subtitle">智能面试训练平台</p>
        </div>

        <div class="feature-cards">
          <div class="feature-card" style="animation-delay:0.1s">
            <div class="feature-icon-wrap">
              <span class="feature-icon">🎯</span>
            </div>
            <div class="feature-text">
              <div class="feature-title">智能出题</div>
              <div class="feature-desc">AI 根据岗位方向生成针对性问题，涵盖核心技术点</div>
            </div>
          </div>
          <div class="feature-card" style="animation-delay:0.2s">
            <div class="feature-icon-wrap">
              <span class="feature-icon">📝</span>
            </div>
            <div class="feature-text">
              <div class="feature-title">实时评分</div>
              <div class="feature-desc">每道题从技术准确性、表达、完整性、深度四维度评分</div>
            </div>
          </div>
          <div class="feature-card" style="animation-delay:0.3s">
            <div class="feature-icon-wrap">
              <span class="feature-icon">📊</span>
            </div>
            <div class="feature-text">
              <div class="feature-title">分析报告</div>
              <div class="feature-desc">面试结束后生成完整能力评估报告与个性化学习建议</div>
            </div>
          </div>
        </div>

        <div class="sidebar-footer" style="animation-delay:0.4s">
          🎉 已有 <strong>{{ completedCount }}</strong> 人完成模拟面试
        </div>
      </div>
    </div>

    <!-- 右侧 — 登录区 -->
    <div class="auth-main">
      <el-card class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">欢迎回来</h2>
          <p class="auth-subtitle">登录你的账号继续面试训练</p>
        </div>

        <el-form @submit.prevent="onLogin" class="auth-form">
          <el-form-item class="form-item-in">
            <el-input
              v-model="username"
              placeholder="用户名"
              size="large"
              :prefix-icon="User"
              @keyup.enter="onLogin"
            />
          </el-form-item>
          <el-form-item class="form-item-in" style="animation-delay:0.06s">
            <el-input
              v-model="password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
              :prefix-icon="Lock"
              @keyup.enter="onLogin"
            />
          </el-form-item>
          <el-form-item class="form-item-in" style="animation-delay:0.12s">
            <div class="captcha-row">
              <el-input
                v-model="captchaCode"
                placeholder="验证码"
                size="large"
                maxlength="4"
                class="captcha-input"
                @keyup.enter="onLogin"
              />
              <img
                v-if="captchaImage"
                :src="'data:image/png;base64,' + captchaImage"
                class="captcha-img"
                @click="loadCaptcha"
                @error="captchaImage = ''"
                title="点击刷新验证码"
              />
              <span v-else class="captcha-reload" @click="loadCaptcha" title="点击加载验证码">
                刷新
              </span>
            </div>
          </el-form-item>
          <el-form-item v-if="err" class="form-item-in" style="animation-delay:0.16s">
            <el-alert :title="err" :type="alertType" show-icon :closable="false" />
          </el-form-item>
          <el-form-item class="form-item-in" style="animation-delay:0.18s">
            <el-button type="primary" size="large" class="login-btn" @click="onLogin" :loading="loading">
              登 录
            </el-button>
          </el-form-item>
        </el-form>
        <p class="auth-footer form-item-in" style="animation-delay:0.22s">
          还没有账号？<router-link to="/register" class="auth-link">立即注册</router-link>
        </p>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, setToken, setRole, getCaptcha } from '../api/index.js'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const captchaKey = ref('')
const captchaCode = ref('')
const captchaImage = ref('')
const err = ref('')
const loading = ref(false)
const alertType = computed(() => err.value.includes('已被管理员锁定') ? 'warning' : 'error')
const completedCount = ref('2,000+')

async function loadStats() {
  try {
    const res = await fetch('/api/auth/stats')
    const data = await res.json()
    if (data.code === 200 && data.data?.completedCount) {
      const n = data.data.completedCount
      completedCount.value = n.toLocaleString() + '+'
    }
  } catch { /* keep default */ }
}

onMounted(() => {
  loadCaptcha()
  loadStats()
})

async function loadCaptcha() {
  try {
    const data = await getCaptcha()
    captchaKey.value = data.key
    captchaImage.value = data.image
    captchaCode.value = ''
  } catch (e) {
    console.error('加载验证码失败', e)
  }
}

async function onLogin() {
  if (!username.value || !password.value) {
    err.value = '请输入用户名和密码'
    return
  }
  if (!captchaCode.value) {
    err.value = '请输入验证码'
    return
  }
  err.value = ''
  loading.value = true
  try {
    const data = await login(username.value, password.value, captchaKey.value, captchaCode.value)
    setToken(data.token)
    setRole(data.role || '')
    // 管理员跳转到管理后台，普通用户跳转到岗位选择
    window.location.hash = data.role === 'ADMIN' ? '#/admin/dashboard' : '#/templates'
    window.location.reload()
  } catch (e) {
    const msg = e.message || '登录失败'
    err.value = msg
    // 账号被锁定不是验证码问题，不需要刷新验证码
    if (!msg.includes('已被管理员锁定')) {
      loadCaptcha()
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ===== 外层布局 ===== */
.auth-page {
  display: flex;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fc 0%, #f0f2f7 50%, #f5f2f8 100%);
}

/* ===== 浮动装饰 ===== */
.float-icon {
  position: absolute;
  font-size: 32px;
  line-height: 1;
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
  animation: floatAround 6s ease-in-out infinite;
}
.fi-1 { top: 12%; left: 8%; animation-delay: 0s; }
.fi-2 { top: 20%; right: 52%; animation-delay: 1.5s; }
.fi-3 { bottom: 25%; left: 10%; animation-delay: 3s; }
.fi-4 { bottom: 15%; right: 55%; animation-delay: 4.5s; }

@keyframes floatAround {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(4deg); }
  75% { transform: translateY(6px) rotate(-3deg); }
}

/* ===== 左侧装饰区 ===== */
.auth-sidebar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.sidebar-content {
  max-width: 460px;
  animation: sidebarIn 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes sidebarIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Brand */
.sidebar-brand {
  margin-bottom: 48px;
}
.brand-icon {
  font-size: 56px;
  line-height: 1;
  display: inline-block;
  animation: brandBounce 3s ease-in-out infinite;
  margin-bottom: 12px;
}
@keyframes brandBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.05); }
}
.brand-title {
  font-size: 36px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 6px;
  letter-spacing: 2px;
}
.brand-subtitle {
  font-size: 15px;
  color: #86868b;
  font-weight: 400;
  margin: 0;
}

/* 特性卡片 */
.feature-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  cursor: default;
  animation: cardSlideIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes cardSlideIn {
  from { opacity: 0; transform: translateX(-16px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
.feature-card:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.feature-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eef1ff, #f5efff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}
.feature-card:hover .feature-icon-wrap {
  transform: scale(1.08);
}
.feature-icon {
  font-size: 22px;
  line-height: 1;
}
.feature-text {
  flex: 1;
}
.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 3px;
}
.feature-desc {
  font-size: 13px;
  color: #86868b;
  line-height: 1.4;
}

/* 底部统计 */
.sidebar-footer {
  font-size: 14px;
  color: #86868b;
  text-align: center;
  padding: 12px 0;
  animation: fadeUp 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
.sidebar-footer strong {
  color: #0071e3;
  font-weight: 600;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 右侧登录区 ===== */
.auth-main {
  width: 440px;
  min-width: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 40px 40px 0;
  position: relative;
  z-index: 1;
}

.auth-card {
  width: 100%;
  padding: 40px 32px 32px;
  border-radius: 20px !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06) !important;
  animation: cardAppear 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes cardAppear {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}
.auth-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 6px;
  letter-spacing: 0.5px;
}
.auth-subtitle {
  font-size: 14px;
  color: #86868b;
  font-weight: 400;
  margin: 0;
}
.auth-form {
  margin-bottom: 8px;
}

.form-item-in {
  animation: formItemIn 0.45s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes formItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-btn {
  width: 100%;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
  height: 44px;
  border-radius: 10px !important;
  background: #122e8a !important;
  border: none !important;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) !important;
  box-shadow: 0 4px 14px rgba(18, 46, 138, 0.3) !important;
}
.login-btn:hover { 
  background: #1a3a9e !important;
  box-shadow: 0 6px 20px rgba(18, 46, 138, 0.4) !important;
  transform: translateY(-1px) !important;
}
.login-btn:active { transform: scale(0.97) !important; }

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: #86868b;
}
.auth-link {
  color: #0071e3;
  text-decoration: none;
  position: relative;
}
.auth-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: #0071e3;
  transition: width 0.25s ease;
}
.auth-link:hover::after { width: 100%; }

/* 验证码 */
.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: center;
}
.captcha-row .el-input.captcha-input { flex: 1; min-width: 0; }
.captcha-img {
  width: 120px; height: 40px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  flex-shrink: 0;
  transition: all 0.2s ease;
  object-fit: cover;
}
.captcha-img:hover { 
  border-color: #667eea; 
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}
.captcha-reload {
  height: 40px; min-width: 60px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  border: 1px dashed #d2d2d6;
  cursor: pointer;
  font-size: 13px;
  color: #86868b;
  flex-shrink: 0;
  user-select: none;
  transition: all 0.2s ease;
}
.captcha-reload:hover { border-color: #667eea; color: #667eea; background: #f8f7ff; }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .auth-page { flex-direction: column; }
  .auth-sidebar { padding: 32px 24px 0; }
  .sidebar-content { max-width: 100%; }
  .feature-cards { flex-direction: row; flex-wrap: wrap; }
  .feature-card { flex: 1; min-width: 200px; }
  .sidebar-brand { margin-bottom: 28px; }
  .float-icon { display: none; }
  .auth-main {
    width: 100%; min-width: 0;
    padding: 24px;
  }
}
</style>
