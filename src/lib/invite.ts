const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

/**
 * Generate a random 8-character invite code.
 */
export function generateInviteCode(): string {
  let result = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}

/**
 * Generate a unique invite code by checking against existing codes.
 * Retries up to maxAttempts times to handle collisions.
 */
export async function generateUniqueInviteCode(
  checkExists: (code: string) => Promise<boolean>,
  maxAttempts = 5
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateInviteCode()
    const exists = await checkExists(code)
    if (!exists) return code
  }
  throw new Error('Failed to generate a unique invite code after maximum attempts')
}
