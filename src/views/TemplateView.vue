<template>
  <!-- 全局遮罩放在最外层，不受 .template-page 动画影响 -->
  <div v-if="analyzing" class="upload-overlay">
    <div class="upload-overlay-content">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <div class="overlay-text">正在上传并分析简历…</div>
      <div class="overlay-hint">请勿刷新或关闭页面</div>
    </div>
  </div>

  <div class="template-page">
    <div class="page-head">
      <h2 class="page-title">选择面试岗位</h2>
      <p class="page-desc">可先上传简历获得专属面试体验，或直接选择岗位开始模拟面试</p>
    </div>

    <!-- 简历上传组件 -->
    <ResumeUpload @resume-change="onResumeChange" @analyze-change="onAnalyzeChange" @resume-skills="onResumeSkills" />

    <el-row :gutter="16" v-if="list.length">
      <el-col
        :xs="24"
        :sm="12"
        :md="8"
        v-for="(t, i) in list"
        :key="t.id"
        class="tpl-col"
        :class="{ 'tpl-col--disabled': isCardDisabled(t) }"
        :style="{ animationDelay: 0.06 * i + 's' }"
      >
        <el-card shadow="hover" class="tpl-card animate-in" :class="{ 'tpl-card--disabled': isCardDisabled(t) }" @click="!isCardDisabled(t) && onPick(t)">
          <div class="tpl-icon">
            {{ positionIcon(t.position) }}
          </div>
          <h3 class="tpl-name">{{ t.name }}</h3>
          <p class="tpl-desc">{{ t.description }}</p>
          <div class="tpl-tags">
            <el-tag
              size="small"
              :type="diffTagType(t.difficultyLevel)"
              effect="plain"
              round
            >
              {{ diffLabel(t.difficultyLevel) }}
            </el-tag>
            <el-tag
              size="small"
              :type="styleTagType(t.interviewerStyle)"
              effect="plain"
              round
            >
              {{ styleLabel(t.interviewerStyle) }}
            </el-tag>
            <el-tag size="small" type="success" effect="plain" round>
              {{ t.totalRounds }} 轮
            </el-tag>
            <el-tag v-if="resumeId" size="small" type="warning" effect="light" round>
              📄 专属
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-skeleton :rows="3" animated v-else-if="!list.length" />
    <el-empty v-else description="暂无可用的面试模板" />


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTemplates, createSession, checkLock } from '../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import ResumeUpload from '../components/ResumeUpload.vue'

const router = useRouter()
const list = ref([])
const resumeId = ref(null)
const resumeSkills = ref([])
const analyzing = ref(false)

/** IT/互联网岗位的关键词列表（用于判断简历是否属于技术岗位） */
const IT_KEYWORDS = [
  'java', 'python', 'go', 'rust', 'c++', 'c#', '前端', '后端', '全栈',
  '开发', '编程', '编码', '算法', '数据结构',
  '数据库', 'sql', 'mysql', 'redis', 'mongodb',
  '测试', '自动化', 'devops', '运维', 'ci/cd',
  'docker', 'kubernetes', 'k8s', 'linux', '云计算',
  'spring', 'react', 'vue', 'angular', 'node',
  'javascript', 'typescript', 'html', 'css',
  '微服务', '分布式', '架构', '系统设计',
  '机器学习', '人工智能', '数据分析', '数据工程',
  '网络', 'tcp/ip', 'http', '安全', '网络安全',
  'git', '敏捷开发', 'scrum', '产品经理',
]

/** 检查简历技能是否匹配 IT 岗位 */
function isItResume() {
  if (!resumeSkills.value || resumeSkills.value.length === 0) return true // 无简历时不限制
  return resumeSkills.value.some(skill =>
    IT_KEYWORDS.some(kw => skill.toLowerCase().includes(kw.toLowerCase()))
  )
}

/** 判断某岗位卡片是否应被禁用（非 IT 简历时，仅「其他岗位」可用） */
function isCardDisabled(tpl) {
  if (!resumeId.value) return false              // 没上传简历 → 不限制
  if (tpl.position === 'other') return false      // 「其他岗位」永远可用
  return !isItResume()                            // 非 IT 简历 → 禁用 IT 岗位
}

function onResumeSkills(skills) {
  resumeSkills.value = skills || []
}

function onAnalyzeChange(val) {
  analyzing.value = val
}

onMounted(async () => {
  try {
    list.value = await getTemplates()
  } catch (e) {
    console.error(e)
  }
})

function onResumeChange(id) {
  resumeId.value = id
}

async function onPick(tpl) {
  // 被禁用的岗位不可点击
  if (isCardDisabled(tpl)) {
    ElMessage.warning('你上传的简历不属于互联网技术岗位，请选择「其他岗位」让 AI 根据简历内容自动匹配面试方向')
    return
  }

  // 「其他岗位」必须上传简历
  if (tpl.position === 'other' && !resumeId.value) {
    ElMessage.warning('「其他岗位」需要先上传简历，AI 将根据简历内容自动识别你的岗位方向')
    return
  }

  // 先检查账号是否被锁定
  try {
    await checkLock()
  } catch (e) {
    ElMessage.error(e.message || '账号已被锁定，请30分钟后再试')
    return
  }

  // 第1步：警告弹窗
  try {
    await ElMessageBox.confirm(
      '<div style="line-height:1.8">' +
      '<p style="margin:0 0 12px;font-size:14px">面试开始后需<b style="color:#e6a23c">一次性答完全部题目</b>，中途退出<b style="color:#f56c6c">不可再次加入</b>。</p>' +
      '<p style="margin:0 0 12px;font-size:13px;color:#888">请确保有充足的时间（约 30–60 分钟）</p>' +
      '<hr style="border:none;border-top:1px solid #eee;margin:12px 0">' +
      '<p style="margin:0;font-size:13px;color:#909399">⚠️ 若累计有 <b style="color:#e6a23c">3 个未完成</b>的面试，账号将被锁定 <b style="color:#e6a23c">30 分钟</b>，期间无法创建新的面试。</p>' +
      '</div>',
      '确认开始面试',
      {
        confirmButtonText: '确定开始',
        cancelButtonText: '再想想',
        type: 'warning',
        round: true,
        dangerouslyUseHTMLString: true,
      }
    )
  } catch {
    return  // 用户取消
  }

  // 第2步：询问是否修改轮数
  let totalRounds = tpl.totalRounds
  let modifyRounds = false
  try {
    await ElMessageBox.confirm(
      `当前面试共 <strong>${tpl.totalRounds} 轮</strong>，是否要修改轮数？`,
      '面试轮数',
      {
        confirmButtonText: '修改轮数',
        cancelButtonText: '直接开始',
        type: 'info',
        dangerouslyUseHTMLString: true,
        distinguishCancelAndClose: true,
      }
    )
    modifyRounds = true
  } catch (action) {
    if (action === 'cancel') {
      modifyRounds = false  // 直接开始
    } else {
      return  // 点了关闭按钮，取消整个流程
    }
  }

  if (modifyRounds) {
    try {
      const { value } = await ElMessageBox.prompt(
        '请输入面试轮数（1 ~ 12 轮）',
        '修改轮数',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: String(tpl.totalRounds),
          inputPattern: /^(1[0-2]|[1-9])$/,
          inputErrorMessage: '请输入 1 ~ 12 之间的整数',
        }
      )
      totalRounds = parseInt(value, 10)
    } catch {
      return  // 取消修改 → 取消整个流程
    }
  }

  // 创建面试会话后跳转到面试页
  try {
    const sess = await createSession(tpl.id, resumeId.value, totalRounds)
    window.location.hash = '#/interview/' + sess.id
    window.location.reload()
  } catch (e) {
    ElMessage.error('创建面试失败: ' + (e.message || e))
  }
}

function positionIcon(pos) {
  const map = {
    'java-backend': '☕',
    'go-backend': '🐹',
    'frontend': '🎨',
    'python-backend': '🐍',
    'devops': '⚙️',
    'data-engineer': '📊',
    'software-testing': '🧪',
    'operations': '📈',
    'java-senior': '⚡',
    'architect': '🏗️',
    'other': '🔮',
  }
  return map[pos?.toLowerCase()] || '💻'
}

function diffLabel(d) {
  return { JUNIOR: '初级', MIDDLE: '中级', SENIOR: '高级' }[d] || d
}
function diffTagType(d) {
  return { JUNIOR: 'success', MIDDLE: 'warning', SENIOR: 'danger' }[d] || 'info'
}
function styleLabel(s) {
  return { NORMAL: '常规面', STRICT: '深挖面', PRESSURE: '压力面' }[s] || s
}
function styleTagType(s) {
  return { NORMAL: 'info', STRICT: 'danger', PRESSURE: 'warning' }[s] || 'info'
}
</script>

<style scoped>
.template-page {
  animation: pageIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.tpl-col {
  margin-bottom: 16px;
  animation: cardIn 0.45s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
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

.tpl-card {
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px;
  border: 1px solid transparent;
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}
.tpl-card:hover {
  border-color: rgba(102, 126, 234, 0.15);
  box-shadow: 0 8px 28px rgba(102, 126, 234, 0.10) !important;
}
.tpl-icon {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 12px;
}
.tpl-name {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
}
.tpl-desc {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
  margin: 0 0 16px;
  flex: 1;
}
.tpl-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ===== 全局遮罩 ===== */
.upload-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayIn 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes overlayIn {
  from { opacity: 0; backdrop-filter: blur(0); }
  to { opacity: 1; backdrop-filter: blur(4px); }
}
/* ===== 禁用状态 ===== */
.tpl-col--disabled {
  cursor: not-allowed;
}
.tpl-card--disabled {
  opacity: 0.45;
  filter: grayscale(0.7);
  cursor: not-allowed !important;
  pointer-events: none;
}
.tpl-card--disabled:hover {
  transform: none !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06) !important;
  border-color: transparent !important;
}

.upload-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: overlayContentIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
@keyframes overlayContentIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.overlay-text {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
}
.overlay-hint {
  font-size: 13px;
  color: #999;
}
</style>
