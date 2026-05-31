const API_BASE = ''  // vite proxy handles /api -> localhost:8080

function getToken() {
  return localStorage.getItem('zhimian_token')
}

function setToken(token) {
  localStorage.setItem('zhimian_token', token)
}

function clearToken() {
  localStorage.removeItem('zhimian_token')
  localStorage.removeItem('zhimian_role')
}

function getRole() {
  return localStorage.getItem('zhimian_role') || ''
}

function setRole(role) {
  if (role) {
    localStorage.setItem('zhimian_role', role)
  } else {
    localStorage.removeItem('zhimian_role')
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (data.code === 401 || data.code === 403) {
    clearToken()
    window.location.hash = '#/login'
    throw new Error(data.message || '未登录或token已过期')
  }
  if (data.code !== 200) throw new Error(data.message || '请求失败')
  return data.data
}

// ===== Auth =====
export function getCaptcha() {
  return request('/api/auth/captcha')
}

export function login(username, password, captchaKey, captchaCode) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, captchaKey, captchaCode }),
  })
}

export function register(username, password, email) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email }),
  })
}

export function getMe() {
  return request('/api/auth/me')
}

// ===== Templates =====
export function getTemplates() {
  return request('/api/templates')
}

// ===== Interview =====
export function checkLock() {
  return request('/api/interview/check-lock')
}

export function createSession(templateId, resumeId, totalRounds) {
  const body = { templateId }
  if (resumeId) body.resumeId = resumeId
  if (totalRounds) body.totalRounds = totalRounds
  return request('/api/interview/create', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function startInterview(id) {
  return request(`/api/interview/${id}/start`, { method: 'POST' })
}

export function submitAnswer(sessionId, qaRecordId, answer, durationMs, questionText) {
  const body = { answer, durationMs };
  if (qaRecordId != null && qaRecordId > 0) body.qaRecordId = qaRecordId;
  if (questionText) body.questionText = questionText;
  return request(`/api/interview/${sessionId}/submit-answer`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function nextRound(id) {
  return request(`/api/interview/${id}/next-round`, { method: 'POST' })
}

export function finishInterview(id) {
  return request(`/api/interview/${id}/finish`, { method: 'POST' })
}

export function getHistory() {
  return request('/api/interview/history')
}

export function getSessionDetail(id) {
  return request(`/api/interview/${id}/detail`)
}

// ===== Report =====
export function getReport(sessionId) {
  return request(`/api/report/${sessionId}`)
}

/** 导出面试报告为 Markdown 文档（触发浏览器下载） */
export function exportReportMd(sessionId) {
  const token = getToken()
  return fetch(`/api/report/${sessionId}/export/md`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error('导出失败')
    return res.text()
  }).then(text => {
    // 创建下载链接并自动点击
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zhimian-report-${sessionId}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
}

// ===== Resume =====
export function uploadResume(file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  return fetch(`${API_BASE}/api/resume/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(res => res.json()).then(data => {
    if (data.code === 401 || data.code === 403) {
      clearToken()
      window.location.hash = '#/login'
      throw new Error(data.message || '未登录或token已过期')
    }
    if (data.code !== 200) throw new Error(data.message || '上传失败')
    return data.data
  })
}

export function getResumeList() {
  return request('/api/resume/list')
}

export function getResumeDetail(id) {
  return request(`/api/resume/${id}`)
}

export function deleteResume(id) {
  return request(`/api/resume/${id}`, { method: 'DELETE' })
}

// ===== Wrong Answers =====
export function getWrongAnswers(keyword = '') {
  const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
  return request(`/api/wrong-answers/list${params}`)
}

export function addWrongAnswer(qaRecordId) {
  return request('/api/wrong-answers/add', {
    method: 'POST',
    body: JSON.stringify({ qaRecordId }),
  })
}

export function deleteWrongAnswer(id) {
  return request(`/api/wrong-answers/${id}`, { method: 'DELETE' })
}

/** 导出错题本为 Markdown 文档（触发浏览器下载） */
export function exportWrongAnswersMd() {
  const token = getToken()
  return fetch(`/api/wrong-answers/export`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error('导出失败')
    return res.text()
  }).then(text => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zhimian-wrong-answers.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
}

// ===== SSE (返回 fetch Response) =====
export function createSSE(path, signal) {
  const token = getToken()
  return fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
}

// ===== Token =====
export { request, getToken, setToken, clearToken, getRole, setRole }
