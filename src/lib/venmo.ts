interface VenmoParams {
  username: string
  amount: number
  note: string
}

/**
 * Build a Venmo deep link that opens the native app (mobile only).
 */
export function buildVenmoLink({ username, amount, note }: VenmoParams): string {
  const params = new URLSearchParams({
    txn: 'pay',
    audience: 'private',
    recipients: username,
    amount: amount.toFixed(2),
    note,
  })
  return `venmo://paycharge?${params.toString()}`
}

/**
 * Build a Venmo web link as a desktop/fallback option.
 */
export function buildVenmoWebLink({ username, amount, note }: VenmoParams): string {
  const params = new URLSearchParams({
    txn: 'pay',
    audience: 'private',
    recipients: username,
    amount: amount.toFixed(2),
    note,
  })
  return `https://venmo.com/?${params.toString()}`
}
