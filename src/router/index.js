import { createRouter, createWebHashHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import TemplateView from '../views/TemplateView.vue'
import InterviewView from '../views/InterviewView.vue'
import HistoryView from '../views/HistoryView.vue'
import HistoryDetailView from '../views/HistoryDetailView.vue'
import ReportView from '../views/ReportView.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminUsers from '../views/admin/AdminUsers.vue'
import AdminAnalytics from '../views/admin/AdminAnalytics.vue'
import ChatView from '../views/ChatView.vue'
import WrongAnswerView from '../views/WrongAnswerView.vue'
import ForumView from '../views/ForumView.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginView, meta: { guest: true } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { guest: true } },
  { path: '/', redirect: '/login' },
  { path: '/templates', name: 'Templates', component: TemplateView, meta: { auth: true } },
  { path: '/interview/:id', name: 'Interview', component: InterviewView, meta: { auth: true, fullscreen: true } },
  { path: '/history', name: 'History', component: HistoryView, meta: { auth: true } },
  { path: '/history/:id', name: 'HistoryDetail', component: HistoryDetailView, meta: { auth: true } },
  { path: '/report/:sessionId', name: 'Report', component: ReportView, meta: { auth: true } },
  // 管理后台
  { path: '/admin', redirect: '/admin/dashboard' },
  { path: '/admin/dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { auth: true, admin: true } },
  { path: '/admin/users', name: 'AdminUsers', component: AdminUsers, meta: { auth: true, admin: true } },
  { path: '/admin/users/:id', name: 'AdminUserDetail', component: AdminUsers, meta: { auth: true, admin: true } },
  { path: '/admin/analytics', name: 'AdminAnalytics', component: AdminAnalytics, meta: { auth: true, admin: true } },
  { path: '/chat/:id', name: 'Chat', component: ChatView, meta: { auth: true } },
  { path: '/wrong-answers', name: 'WrongAnswers', component: WrongAnswerView, meta: { auth: true } },
  { path: '/forum', name: 'Forum', component: ForumView, meta: { auth: true } },
  { path: '/chat', redirect: '/chat/1' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫：未登录跳登录页，非管理员访问管理页跳首页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('zhimian_token')
  const role = localStorage.getItem('zhimian_role') || ''

  if (to.meta.auth && !token) {
    next('/login')
    return
  }

  // 管理员路由：仅 ADMIN 角色可访问
  if (to.meta.admin && role !== 'ADMIN') {
    next('/templates')
    return
  }

  // 非管理员访问管理页 → 重定向到岗位选择
  if (to.path.startsWith('/admin') && role && role !== 'ADMIN') {
    next('/templates')
    return
  }

  next()
})

export default router
