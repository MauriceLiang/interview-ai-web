import { request, getToken } from './index.js'

/** 获取帖子列表 */
export function getForumPosts(tag = '', mine = false) {
  const params = new URLSearchParams()
  if (tag) params.set('tag', tag)
  if (mine) params.set('mine', 'true')
  const qs = params.toString()
  return request(`/api/forum/posts${qs ? '?' + qs : ''}`)
}

/** 获取帖子详情 */
export function getForumPostDetail(id) {
  return request(`/api/forum/posts/${id}`)
}

/** 发帖 */
export function createForumPost(title, content, tags) {
  return request('/api/forum/posts', {
    method: 'POST',
    body: JSON.stringify({ title, content, tags }),
  })
}

/** 删帖 */
export function deleteForumPost(id) {
  return request(`/api/forum/posts/${id}`, { method: 'DELETE' })
}

/** [管理员] 置顶/取消置顶 */
export function togglePin(id) {
  return request(`/api/forum/posts/${id}/pin`, { method: 'PUT' })
}

/** 发表评论 */
export function addForumComment(postId, content, parentId = null) {
  const body = { content }
  if (parentId) body.parentId = parentId
  return request(`/api/forum/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
