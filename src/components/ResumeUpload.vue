<template>
  <div class="resume-upload">
    <!-- 上传分析中的全局遮罩（由父级 TemplateView 渲染） -->
    <!-- 已上传简历展示 -->
    <div v-if="currentResume" class="resume-card">
      <div class="resume-card-header">
        <span class="resume-file-icon">📄</span>
        <div class="resume-info">
          <div class="resume-name">{{ currentResume.fileName }}</div>
          <div class="resume-meta">
            已分析 · {{ formatTime(currentResume.createdAt) }}
          </div>
        </div>
        <el-button size="small" text type="danger" @click="onRemove" :loading="removing">
          移除
        </el-button>
      </div>

      <!-- 分析结果摘要 -->
      <div v-if="analysis" class="resume-analysis">
        <div class="analysis-summary">
          <span class="summary-label">📋 简历摘要：</span>
          {{ analysis.summary }}
        </div>
        <div v-if="analysis.skills?.length" class="analysis-tags">
          <span class="tags-label">🏷 技能：</span>
          <el-tag
            v-for="s in analysis.skills"
            :key="s"
            size="small"
            type="primary"
            effect="plain"
            round
          >
            {{ s }}
          </el-tag>
        </div>
      </div>

      <!-- 分析中状态 -->
      <div v-else-if="analyzing" class="resume-analyzing">
        <el-icon class="is-loading" :size="18"><Loading /></el-icon>
        <span>AI 正在分析简历…</span>
      </div>
    </div>

    <!-- 上传入口（未上传时展示） -->
    <div v-else class="upload-area" :class="{ 'upload-area-locked': locked, 'upload-area-dragover': dragOver }"
         @click="!locked && onUploadClick()"
         @dragover.prevent="!locked && (dragOver = true)"
         @dragleave.prevent="dragOver = false"
         @drop.prevent="!locked && (dragOver = false, onDrop($event))">
      <input
        ref="fileInput"
        type="file"
        accept=".md"
        style="display: none"
        :disabled="locked"
        @change="onFileChange"
      />
      <template v-if="locked">
        <div class="upload-icon">🔒</div>
        <div class="upload-text">
          <span class="upload-title">账号已锁定</span>
          <span class="upload-hint">由于有多个未完成的面试，30分钟内无法上传简历</span>
        </div>
      </template>
      <template v-else>
        <div class="upload-icon">📤</div>
        <div class="upload-text">
          <span class="upload-title">上传简历（Markdown）</span>
          <span class="upload-hint">拖拽 .md 文件到此处，或点击选择文件</span>
        </div>
      </template>
      <div v-if="uploadError && !locked" class="upload-error">{{ uploadError }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { uploadResume, getResumeList, deleteResume, checkLock } from '../api/index.js'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const emit = defineEmits(['resume-change', 'analyze-change', 'resume-skills'])

const fileInput = ref(null)
const currentResume = ref(null)
const analysis = ref(null)
const analyzing = ref(false)
const removing = ref(false)
const uploadError = ref('')
const locked = ref(false)
const dragOver = ref(false)

onMounted(async () => {
  // 检查账号是否锁定（≥3 个未完成面试时禁止上传简历）
  await checkLockStatus()
  try {
    const list = await getResumeList()
    if (list && list.length > 0) {
      currentResume.value = list[0]
      parseAnalysis(list[0].analysisJson)
      // 通知父组件已有简历，创建面试时携带 resumeId
      emit('resume-change', list[0].id)
      emit('resume-skills', analysis.value?.skills || [])
    }
  } catch (e) {
    // 没有简历是正常状态，忽略
  }
})

/** 检查账号是否锁定，锁定后禁止上传新简历 */
async function checkLockStatus() {
  try {
    await checkLock()
    locked.value = false
  } catch {
    locked.value = true
  }
}

function parseAnalysis(jsonStr) {
  if (!jsonStr) {
    analysis.value = null
    return
  }
  try {
    const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    analysis.value = {
      skills: parsed.skills || [],
      summary: parsed.summary || '（无摘要）',
      experience: parsed.experience || [],
      projects: parsed.projects || [],
      keyPoints: parsed.keyPoints || [],
    }
  } catch (e) {
    analysis.value = { skills: [], summary: '（解析失败）' }
  }
}

function onUploadClick() {
  fileInput.value?.click()
}

function onDrop(e) {
  const files = e.dataTransfer?.files
  if (files?.length) handleFile(files[0])
}

function onFileChange(e) {
  const files = e.target?.files
  if (files?.length) handleFile(files[0])
  // 重置 input 以允许重复选择同一文件
  if (fileInput.value) fileInput.value.value = ''
}

async function handleFile(file) {
  // 上传前再次检查锁定状态（防止长时间停留页面后状态过期）
  await checkLockStatus()
  if (locked.value) {
    ElMessage.warning('账号已锁定，有多个未完成的面试，30分钟内无法上传简历')
    return
  }

  if (!file.name.toLowerCase().endsWith('.md')) {
    uploadError.value = '仅支持 .md 格式的简历文件'
    return
  }

  uploadError.value = ''
  analyzing.value = true
  emit('analyze-change', true)

  try {
    const resume = await uploadResume(file)
    currentResume.value = resume
    parseAnalysis(resume.analysisJson)
    ElMessage.success('简历上传分析完成')
    emit('resume-change', resume.id)
    emit('resume-skills', analysis.value?.skills || [])
  } catch (e) {
    uploadError.value = e.message || '上传失败'
    ElMessage.error('简历上传失败: ' + (e.message || '未知错误'))
  } finally {
    analyzing.value = false
    emit('analyze-change', false)
  }
}

async function onRemove() {
  if (!currentResume.value) return
  removing.value = true
  try {
    await deleteResume(currentResume.value.id)
    currentResume.value = null
    analysis.value = null
    ElMessage.success('简历已移除')
    emit('resume-change', null)
    emit('resume-skills', [])
  } catch (e) {
    ElMessage.error('删除失败: ' + e.message)
  } finally {
    removing.value = false
  }
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.resume-upload {
  margin-bottom: 24px;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #d0d5dd;
  border-radius: 14px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
  background: #fafbfc;
  position: relative;
}
.upload-area::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 17px;
  background: linear-gradient(135deg, #122e8a44, #122e8a22);
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: -1;
}
.upload-area:hover {
  border-color: #122e8a;
  background: #f0f2ff;
  box-shadow: 0 4px 20px rgba(18, 46, 138, 0.12);
}
.upload-area:hover::before {
  opacity: 1;
}

/* 拖拽悬停高亮 */
.upload-area-dragover {
  border-color: #122e8a !important;
  background: #eceeff !important;
  box-shadow: 0 0 0 4px rgba(18, 46, 138, 0.15), 0 4px 20px rgba(18, 46, 138, 0.12) !important;
  transform: scale(1.01);
}
.upload-area-dragover .upload-icon {
  transform: translateY(-2px) scale(1.08);
}
.upload-icon {
  font-size: 38px;
  line-height: 1;
  transition: transform 0.3s ease;
}
.upload-area:hover .upload-icon {
  transform: translateY(-2px) scale(1.05);
}
.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.upload-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}
.upload-hint {
  font-size: 12px;
  color: #999;
}
.upload-error {
  font-size: 13px;
  color: #f56c6c;
  margin-top: 4px;
}

/* 锁定状态 */
.upload-area-locked {
  border-color: #e8e8e8;
  background: #f5f5f5;
  cursor: not-allowed;
}
.upload-area-locked:hover {
  border-color: #e8e8e8;
  background: #f5f5f5;
}
.upload-area-locked .upload-title {
  color: #bbb;
}
.upload-area-locked .upload-hint {
  color: #ccc;
}

/* 已上传简历卡片 */
.resume-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px 20px;
  background: #fafbfc;
}
.resume-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.resume-file-icon {
  font-size: 28px;
  line-height: 1;
}
.resume-info {
  flex: 1;
}
.resume-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}
.resume-meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 分析结果 */
.resume-analysis {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e8e8e8;
}
.analysis-summary {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 10px;
}
.summary-label {
  font-weight: 600;
  color: #1a1a2e;
}
.analysis-tags {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
}
.tags-label {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  margin-top: 2px;
}

/* 分析中 */
.resume-analyzing {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

/* 全屏遮罩（已迁移到 TemplateView 全局渲染） */
</style>
