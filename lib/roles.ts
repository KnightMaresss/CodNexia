export const ROLES = {
  FOUNDER: 'founder',
  MODERATOR: 'moderator',
} as const

export function isFounderRole(role?: string | null): boolean {
  return role === ROLES.FOUNDER
}

export function isModeratorRole(role?: string | null): boolean {
  return role === ROLES.MODERATOR
}

export function canAccessAdmin(role?: string | null): boolean {
  return isFounderRole(role) || isModeratorRole(role)
}