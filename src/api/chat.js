import { request, getToken } from './index.js'

export function getRooms() {
  return request('/api/chat/rooms')
}

export function getHistory(roomId, page = 1, size = 30) {
  return request(`/api/chat/rooms/${roomId}/messages?page=${page}&size=${size}`)
}

export function getOnlineUsers(roomId) {
  return request(`/api/chat/rooms/${roomId}/online`)
}

export function muteUser(roomId, userId, reason, minutes) {
  return request(`/api/chat/rooms/${roomId}/mute`, {
    method: 'POST',
    body: JSON.stringify({ userId, reason, minutes }),
  })
}

export function unmuteUser(roomId, userId) {
  return request(`/api/chat/rooms/${roomId}/mute/${userId}`, { method: 'DELETE' })
}

export function getSpeakers(roomId) {
  return request(`/api/chat/rooms/${roomId}/speakers`)
}

export function getMutedUsers(roomId) {
  return request(`/api/chat/rooms/${roomId}/mutes`)
}
