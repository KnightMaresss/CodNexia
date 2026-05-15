type StreamEvent =
  | 'connected'
  | 'heartbeat'
  | 'new-order'
  | 'order-updated'
  | 'order-deleted'
  | 'order-reassigned'
  | 'audit-log'
  | 'message-sent'
type Client = {
  id: number
  send: (data: string) => void
}

const clients = new Set<Client>()

export function addClient(client: Client) {
  clients.add(client)
}

export function removeClient(client: Client) {
  clients.delete(client)
}

export function broadcast(type: StreamEvent, data?: unknown) {
  const message = JSON.stringify({
    type,
    data,
    timestamp: Date.now(),
  })

  clients.forEach((client) => {
    try {
      client.send(message)
    } catch {
      clients.delete(client)
    }
  })
}

export function notifyNewOrder(orderData: unknown) {
  broadcast('new-order', orderData)
}

export function notifyOrderUpdated(orderData: unknown) {
  broadcast('order-updated', orderData)
}

export function notifyOrderDeleted(orderData: unknown) {
  broadcast('order-deleted', orderData)
}

export function notifyOrderReassigned(orderData: unknown) {
  broadcast('order-reassigned', orderData)
}

export function notifyAuditLog(logData: unknown) {
  broadcast('audit-log', logData)
}
export function notifyMessageSent(messageData: unknown) {
  broadcast('message-sent', messageData)
}
/**
 * Keep SSE alive
 */
setInterval(() => {
  broadcast('heartbeat')
}, 25000)