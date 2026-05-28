import { request, getToken } from './index.js'

/** 获取仪表盘数据 */
export function getDashboard() {
  return request('/api/admin/dashboard')
}

/** 获取用户列表（分页+搜索） */
export function getUsers(page = 1, size = 20, keyword = '') {
  const params = new URLSearchParams({ page, size })
  if (keyword) params.set('keyword', keyword)
  return request(`/api/admin/users?${params}`)
}

/** 获取用户详情 */
export function getUserDetail(id) {
  return request(`/api/admin/users/${id}`)
}

/** 获取用户的面试列表 */
export function getUserSessions(id) {
  return request(`/api/admin/users/${id}/sessions`)
}

/** 锁定/解锁用户 */
export function setUserStatus(id, status, reason) {
  return request(`/api/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  })
}

/** 获取已锁定账号列表 */
export function getLockedUsers() {
  return request('/api/admin/users/locked')
}

/** 获取异常账号列表 */
export function getAnomalies() {
  return request('/api/admin/anomalies')
}

/** 获取数据分析 */
export function getAnalytics(days = 7) {
  return request(`/api/admin/analytics?days=${days}`)
}

/** 获取当前模型 / 可用模型列表 */
export function getProvider() {
  return request('/api/admin/provider')
}

/** 切换模型 */
export function switchProvider(provider) {
  return request('/api/admin/provider', {
    method: 'PUT',
    body: JSON.stringify({ provider }),
  })
}

/** 测试 AI 连通性 */
export function testProvider() {
  return request('/api/admin/provider/test', { method: 'POST' })
}
