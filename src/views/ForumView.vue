<template>
  <div class="forum-page">
    <div class="page-head">
      <h2 class="page-title">💬 论坛</h2>
      <p class="page-desc">交流面试心得、分享学习资源、讨论技术问题</p>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="tag-filters">
        <el-tag
          v-for="t in allTags" :key="t"
          :type="activeTag === t ? 'primary' : 'plain'"
          effect="plain"
          round
          style="cursor:pointer"
          @click="onTagFilter(t)"
        >{{ t }}</el-tag>
        <el-tag v-if="activeTag" closable @close="onTagFilter('')" style="cursor:pointer">清除筛选</el-tag>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <el-switch v-model="showMine" size="small" />
        <span style="font-size:13px;color:#666">我的帖子</span>
        <el-button type="primary" @click="showCreate = true" :icon="EditPen">发帖</el-button>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div v-if="posts.length" class="post-list">
      <el-card
        v-for="(p, i) in posts" :key="p.id"
        class="post-card animate-in"
        :style="{ animationDelay: 0.04 * i + 's' }"
        :class="{ 'post-pinned': p.isPinned === 1 }"
        @click="openDetail(p)"
      >
        <div class="post-header">
          <div class="post-title">
            <el-tag v-if="p.isPinned === 1" size="small" type="danger" effect="dark" round style="margin-right:6px">置顶</el-tag>
            {{ p.title }}
          </div>
          <div class="post-meta">
            <span class="meta-user">{{ p.username }}</span>
            <span class="meta-time">{{ formatTime(p.createdAt) }}</span>
            <span class="meta-comments">💬 {{ p.commentCount }}</span>
          </div>
        </div>
        <div class="post-content line-clamp">{{ p.content }}</div>
        <div class="post-footer">
          <div class="post-tags" v-if="p.tags?.length">
            <el-tag v-for="t in p.tags" :key="t" size="small" effect="plain" round>{{ t }}</el-tag>
          </div>
          <el-popconfirm v-if="currentUserId === p.userId || isAdmin" title="确定删除此帖？" @confirm="onDeletePostCard(p.id)">
            <template #reference>
              <el-button size="small" text type="danger" @click.stop>删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </el-card>
    </div>
    <el-empty v-else-if="!loading" description="暂无帖子" :image-size="60" />
    <el-skeleton :rows="4" animated v-if="loading" />

    <!-- 发帖弹窗 -->
    <el-dialog v-model="showCreate" title="发布新帖" width="600px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="帖子标题" maxlength="128" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="写下你的想法…" />
        </el-form-item>
        <el-form-item label="标签（可多选）">
          <el-checkbox-group v-model="form.tags">
            <el-checkbox v-for="t in allTags" :key="t" :label="t">{{ t }}</el-checkbox>
          </el-checkbox-group>
          <div style="font-size:12px;color:#909399;margin-top:6px;line-height:1.5">
            💡 选择「<strong>学习</strong>」标签后，AI 将自动在帖子下回复
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="onCreate" :loading="creating">发布</el-button>
      </template>
    </el-dialog>

    <!-- 帖子详情抽屉 -->
    <el-drawer v-model="showDetail" :title="detail?.title || ''" size="600px" direction="rtl">
      <template v-if="detail">
        <div class="detail-meta">
          <span>{{ detail.posterName }}</span>
          <span>{{ formatTime(detail.post?.createdAt) }}</span>
        </div>
        <div class="detail-content">{{ detail.post?.content }}</div>
        <div class="detail-tags" v-if="detail.post?.tags">
          <el-tag v-for="t in JSON.parse(detail.post.tags || '[]')" :key="t" size="small" effect="plain" round>{{ t }}</el-tag>
        </div>

        <el-divider />

        <!-- 评论列表 -->
        <div class="comments-section">
          <h4>评论（{{ (detail.comments || []).filter(x => !x.parentId).length || 0 }}）</h4>
          <div v-for="c in detail.comments.filter(x => !x.parentId)" :key="c.id" class="comment-item" :class="{ 'comment-ai': c.isAi === 1 }">
            <div class="comment-header">
              <span class="comment-user">
                <el-tag v-if="c.isAi === 1" size="small" type="success" effect="dark" round>AI</el-tag>
                {{ c.username }}
              </span>
              <span class="comment-time">{{ formatTime(c.createdAt) }}</span>
            </div>
            <div class="comment-content" v-html="renderMarkdown(c.content)"></div>
            <div v-if="!c.isAi" class="comment-actions">
              <el-button size="small" text @click="replyTo(c)">回复</el-button>
            </div>
            <!-- 子回复 -->
            <div v-for="child in detail.comments.filter(x => x.parentId === c.id)" :key="child.id" class="comment-item comment-child" :class="{ 'comment-ai': child.isAi === 1 }">
              <div class="comment-header">
                <span class="comment-user">
                  <el-tag v-if="child.isAi === 1" size="small" type="success" effect="dark" round>AI</el-tag>
                  {{ child.username }}
                </span>
                <span class="comment-time">{{ formatTime(child.createdAt) }}</span>
              </div>
              <div class="comment-content" v-html="renderMarkdown(child.content)"></div>
            </div>
          </div>
        </div>

        <!-- 评论输入 -->
        <div class="comment-input">
          <div v-if="replyTarget" class="reply-hint">
            回复 @{{ replyTarget.username }}
            <el-button size="small" text @click="replyTarget = null">取消</el-button>
          </div>
          <el-input
            v-model="commentText"
            type="textarea"
            :rows="2"
            :placeholder="replyTarget ? '输入回复…' : '发表评论…'"
          />
          <el-button type="primary" size="small" @click="onComment" :loading="commenting" style="margin-top:8px">发表</el-button>
        </div>

        <!-- 操作区 -->
        <div class="post-actions">
          <el-divider />
          <el-button v-if="isAdmin" size="small" type="warning" plain @click="onTogglePin" :loading="pinning">
            {{ detail.post?.isPinned === 1 ? '取消置顶' : '置顶' }}
          </el-button>
          <el-button v-if="currentUserId === detail.post?.userId || isAdmin" size="small" type="danger" plain @click="onDeletePost" :loading="deleting">删除帖子</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getRole, getMe } from '../api/index.js'
import { getForumPosts, getForumPostDetail, createForumPost, deleteForumPost, togglePin, addForumComment } from '../api/forum.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'

const allTags = ['面试', '生活', '学习', '技术', '资源分享']
const activeTag = ref('')
const showMine = ref(false)
const currentUserId = ref(null)
const posts = ref([])
const loading = ref(false)
const showCreate = ref(false)
const creating = ref(false)
const form = ref({ title: '', content: '', tags: [] })
const showDetail = ref(false)
const detail = ref(null)
const commentText = ref('')
const commenting = ref(false)
const replyTarget = ref(null)
const pinning = ref(false)
const deleting = ref(false)
const isAdmin = computed(() => getRole() === 'ADMIN')

onMounted(async () => {
  try {
    const u = await getMe()
    currentUserId.value = u.id
  } catch (_) { /* ignore */ }
  await loadPosts()
})

watch(activeTag, () => loadPosts())
watch(showMine, () => loadPosts())

async function loadPosts() {
  loading.value = true
  try {
    posts.value = await getForumPosts(activeTag.value, showMine.value)
  } catch (e) {
    ElMessage.error('加载失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

function onTagFilter(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}

async function onCreate() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    ElMessage.warning('标题和内容不能为空')
    return
  }
  creating.value = true
  try {
    await createForumPost(form.value.title, form.value.content, form.value.tags)
    ElMessage.success('发布成功')
    showCreate.value = false
    form.value = { title: '', content: '', tags: [] }
    await loadPosts()
  } catch (e) {
    ElMessage.error('发布失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

async function openDetail(post) {
  try {
    const data = await getForumPostDetail(post.id)
    detail.value = data
    showDetail.value = true
  } catch (e) {
    ElMessage.error('加载失败: ' + e.message)
  }
}

async function onComment() {
  if (!commentText.value.trim()) return
  commenting.value = true
  try {
    await addForumComment(detail.value.post.id, commentText.value, replyTarget.value?.id || null)
    commentText.value = ''
    replyTarget.value = null
    ElMessage.success('评论成功')
    // 刷新详情
    const data = await getForumPostDetail(detail.value.post.id)
    detail.value = data
  } catch (e) {
    ElMessage.error('评论失败: ' + e.message)
  } finally {
    commenting.value = false
  }
}

function replyTo(comment) {
  replyTarget.value = comment
}

async function onTogglePin() {
  pinning.value = true
  try {
    await togglePin(detail.value.post.id)
    ElMessage.success('操作成功')
    const data = await getForumPostDetail(detail.value.post.id)
    detail.value = data
    await loadPosts()
  } catch (e) {
    ElMessage.error('操作失败: ' + e.message)
  } finally {
    pinning.value = false
  }
}

async function onDeletePostCard(postId) {
  try {
    await deleteForumPost(postId)
    ElMessage.success('已删除')
    await loadPosts()
  } catch (e) {
    ElMessage.error('删除失败: ' + e.message)
  }
}

async function onDeletePost() {
  try {
    await ElMessageBox.confirm('确定删除此帖？删除后不可恢复。', '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
  } catch { return }
  deleting.value = true
  try {
    await deleteForumPost(detail.value.post.id)
    ElMessage.success('已删除')
    showDetail.value = false
    await loadPosts()
  } catch (e) {
    ElMessage.error('删除失败: ' + e.message)
  } finally {
    deleting.value = false
  }
}

/** 简单 Markdown → HTML 渲染 */
function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---+$/gm, '<hr>')
  const lines = html.split('\n')
  const result = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) { result.push(''); continue }
    if (/^</.test(t)) { result.push(line); continue }
    result.push('<p>' + line + '</p>')
  }
  return result.join('\n')
}

function formatTime(t) {
  if (!t) return ''
  return t.substring(0, 16).replace('T', ' ')
}
</script>

<style scoped>
.forum-page { animation: fadeIn 0.4s ease both; max-width: 900px; margin: 0 auto; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.page-head { margin-bottom: 12px; }
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.page-desc { font-size: 14px; color: #888; margin: 0; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.tag-filters { display: flex; flex-wrap: wrap; gap: 6px; }

.post-list { display: flex; flex-direction: column; gap: 12px; }
.post-card { border-radius: 14px !important; cursor: pointer; }
.post-card:hover { transform: translateY(-2px); }
.post-pinned { border-left: 4px solid #f56c6c !important; }
.post-header { margin-bottom: 8px; }
.post-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
.post-meta { display: flex; gap: 12px; font-size: 12px; color: #aaa; margin-top: 4px; }
.post-content { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 8px; }
.line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.post-tags { display: flex; gap: 4px; flex-wrap: wrap; }

/* 详情 */
.detail-meta { font-size: 13px; color: #999; margin-bottom: 12px; display: flex; gap: 12px; }
.detail-content { font-size: 15px; line-height: 1.8; color: #333; white-space: pre-wrap; margin-bottom: 12px; }
.detail-tags { margin-bottom: 8px; display: flex; gap: 4px; flex-wrap: wrap; }

/* 评论 */
.comments-section { margin-top: 8px; }
.comments-section h4 { font-size: 15px; color: #1a1a2e; margin: 0 0 12px; }
.comment-item { padding: 10px 14px; background: #f8f9fc; border-radius: 10px; margin-bottom: 8px; }
.comment-ai { background: #f0f9eb; border-left: 3px solid #67c23a; }
.comment-child { margin-left: 24px; margin-bottom: 4px; background: #f5f5f8; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.comment-user { font-size: 13px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 4px; }
.comment-time { font-size: 11px; color: #aaa; }
.comment-content { font-size: 14px; line-height: 1.6; color: #444; }
.comment-content p { margin: 0 0 6px; }
.comment-content strong { font-weight: 600; color: #1a1a2e; }
.comment-content code { background: #f0f2f5; color: #e01e5a; padding: 1px 6px; border-radius: 4px; font-size: 13px; font-family: Consolas, Monaco, monospace; }
.comment-content pre { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 10px 14px; overflow-x: auto; font-size: 13px; margin: 6px 0 10px; }
.comment-content h1, .comment-content h2, .comment-content h3, .comment-content h4 { margin: 10px 0 4px; color: #1a1a2e; font-weight: 600; }
.comment-content h4 { font-size: 14px; }
.comment-content hr { margin: 8px 0; border: none; border-top: 1px solid #e0e0e0; }
.comment-actions { margin-top: 4px; }
.comment-actions { margin-top: 4px; }

.comment-input { margin-top: 16px; }
.reply-hint { font-size: 13px; color: #409eff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }

.post-footer { display: flex; justify-content: space-between; align-items: center; }
.post-actions { margin-top: 8px; display: flex; gap: 8px; }

.animate-in { animation: cardIn 0.4s ease both; }
@keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 600px) {
  .toolbar { flex-direction: column; align-items: stretch; }
}
</style>
