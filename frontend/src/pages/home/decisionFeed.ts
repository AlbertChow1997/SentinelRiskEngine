// Illustrative mock data for the homepage visual only. No real merchants, customers or cards.
export interface FeedItem {
  id: string
  merchant: string
  amount: number
  currency: string
  country: string
  score: number
  outcome: 'Approved' | 'Held for review' | 'Declined'
}

export const decisionFeed: readonly FeedItem[] = [
  {
    id: 'tx-1042',
    merchant: 'Harbour Coffee',
    amount: 4.8,
    currency: 'EUR',
    country: 'IE',
    score: 8,
    outcome: 'Approved',
  },
  {
    id: 'tx-1043',
    merchant: 'Northwind Books',
    amount: 62.5,
    currency: 'EUR',
    country: 'IE',
    score: 21,
    outcome: 'Approved',
  },
  {
    id: 'tx-1044',
    merchant: 'Volt Electronics',
    amount: 1899,
    currency: 'EUR',
    country: 'NL',
    score: 58,
    outcome: 'Held for review',
  },
  {
    id: 'tx-1045',
    merchant: 'Lumen Travel',
    amount: 7500,
    currency: 'EUR',
    country: 'BR',
    score: 86,
    outcome: 'Declined',
  },
  {
    id: 'tx-1046',
    merchant: 'Greenleaf Grocers',
    amount: 37.2,
    currency: 'GBP',
    country: 'GB',
    score: 14,
    outcome: 'Approved',
  },
  {
    id: 'tx-1047',
    merchant: 'Pixel Arcade',
    amount: 240,
    currency: 'EUR',
    country: 'DE',
    score: 47,
    outcome: 'Held for review',
  },
]

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amount)
}

const VISIBLE = 4

/** The items on screen, keyed by their absolute position so rows that stay do not remount. */
export function visibleItems(offset: number): { key: number; item: FeedItem }[] {
  return Array.from({ length: VISIBLE }, (_, i) => {
    const position = offset + i
    const item = decisionFeed[position % decisionFeed.length]
    if (!item) throw new Error('decisionFeed must not be empty')
    return { key: position, item }
  })
}
