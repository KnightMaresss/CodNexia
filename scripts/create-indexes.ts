import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function createIndexes() {
  const { default: clientPromise } = await import('../lib/mongodb')

  const client = await clientPromise
  const db = client.db(process.env.DB_NAME || 'student_services')

  await db.collection('orders').createIndexes([
    { key: { assignedTo: 1 }, name: 'orders_assignedTo_idx' },
    { key: { status: 1 }, name: 'orders_status_idx' },
    { key: { studentEmail: 1 }, name: 'orders_studentEmail_idx' },
    { key: { createdAt: -1 }, name: 'orders_createdAt_idx' },
    { key: { assignedTo: 1, status: 1 }, name: 'orders_assignedTo_status_idx' },
  ])

  await db.collection('messages').createIndexes([
    { key: { orderId: 1, createdAt: 1 }, name: 'messages_orderId_createdAt_idx' },
  ])

  await db.collection('order_files').createIndexes([
    { key: { orderId: 1, uploadedAt: -1 }, name: 'order_files_orderId_uploadedAt_idx' },
  ])

  await db.collection('ratings').createIndexes([
    { key: { assignedTo: 1 }, name: 'ratings_assignedTo_idx' },
    { key: { orderId: 1 }, name: 'ratings_orderId_idx' },
  ])

  await db.collection('users').createIndexes([
    { key: { email: 1 }, name: 'users_email_idx', unique: true },
    { key: { role: 1 }, name: 'users_role_idx' },
    { key: { lastSeen: -1 }, name: 'users_lastSeen_idx' },
  ])

await db.collection('chat_views').createIndexes([
  { key: { orderId: 1, viewer: 1 }, name: 'chat_views_orderId_viewer_idx' },
])
  console.log('✅ MongoDB indexes created successfully')
  process.exit(0)
}

createIndexes().catch((error) => {
  console.error('❌ Failed to create indexes:', error)
  process.exit(1)
})