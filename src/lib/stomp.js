import { Client } from '@stomp/stompjs'
import { ElMessage, ElNotification } from 'element-plus'

let client = null
let personalSubs = []
let connectedCb = null

/** 建连 + 个人队列订阅（App.vue 登录后调用一次） */
export function connectPersonal(token) {
  if (client?.active) return

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  client = new Client({
    brokerURL: `${protocol}//${location.host}/ws/chat?token=${token}`,
    reconnectDelay: 5000,
    onConnect: () => {
      connectedCb?.()
      if (!personalSubs.length) {
        personalSubs.push(
          client.subscribe('/user/queue/errors', (msg) => {
            try {
              const data = JSON.parse(msg.body)
              if (data.type === 'ERROR') ElMessage.error(data.message || '操作失败')
            } catch { /* ignore */ }
          }),
          client.subscribe('/user/queue/mentions', (msg) => {
            try {
              const data = JSON.parse(msg.body)
              if (data.type === 'MENTION') {
                ElNotification({
                  id: 'mention-' + Date.now(),
                  title: `💬 ${data.from} 在聊天室提到了你`,
                  message: data.content || '',
                  type: 'info',
                  duration: 5000,
                  offset: 60,
                })
              }
            } catch { /* ignore */ }
          })
        )
      }
    },
    onStompError: () => {},
    onWebSocketClose: () => {},
  })
  client.activate()
}

/** 设置连接成功回调 */
export function onConnected(cb) { connectedCb = cb }

/** 是否已连接 */
export function isConnected() { return client?.active ?? false }

/** 发送 STOMP 消息 */
export function publish(destination, body) {
  if (!client?.active) return
  client.publish({ destination, body: JSON.stringify(body) })
}

/** 订阅房间消息，返回 subscription */
export function subscribeRoom(roomId, handler) {
  if (!client?.active) return null
  return client.subscribe(`/topic/room-${roomId}`, (msg) => {
    try { handler(JSON.parse(msg.body)) } catch { /* ignore */ }
  })
}

/** 取消房间订阅 */
export function unsubscribeRoom(sub) {
  sub?.unsubscribe()
}

/** 断开所有连接（退出登录时） */
export function disconnectAll() {
  client?.deactivate()
  client = null
  personalSubs = []
}
