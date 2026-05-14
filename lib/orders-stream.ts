// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clients = new Set<any>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addClient(client: any) {
  clients.add(client)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeClient(client: any) {
  clients.delete(client)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function notifyNewOrder(orderData: any) {
  const message = JSON.stringify({ type: 'new-order', data: orderData })
  clients.forEach((client) => {
    try {
      client.send(message)
    } catch {
      clients.delete(client)
    }
  })
}