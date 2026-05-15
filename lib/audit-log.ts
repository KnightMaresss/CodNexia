import clientPromise from '@/lib/mongodb'
import { notifyAuditLog } from '@/lib/orders-stream'

type AuditActor = {
  id?: string | null
  email?: string | null
  name?: string | null
  role?: string | null
}

type AuditLogInput = {
  action: string
  actor: AuditActor
  targetType: 'order' | 'user' | 'file' | 'auth' | 'system'
  targetId?: string | null
  message: string
  metadata?: Record<string, unknown>
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
    const createdAt = new Date()

    const result = await db.collection('audit_logs').insertOne({
      action: input.action,
      actor: {
        id: input.actor.id || null,
        email: input.actor.email || null,
        name: input.actor.name || null,
        role: input.actor.role || null,
      },
      targetType: input.targetType,
      targetId: input.targetId || null,
      message: input.message,
      metadata: input.metadata || {},
      createdAt,
    })

    notifyAuditLog({
      id: result.insertedId.toString(),
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      message: input.message,
      createdAt,
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}
