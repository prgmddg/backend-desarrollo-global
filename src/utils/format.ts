import * as iconv from 'iconv-lite'

export function formatText (text?: string, fn?: 'lower' | 'upper') {
  if (!text || text.length === 0) return ''

  const formatTxt = iconv.decode(Buffer.from(text, 'binary'), 'utf-8').trim()

  if (fn === 'lower') return formatTxt.toLowerCase()
  if (fn === 'upper') return formatTxt.toUpperCase()

  return formatTxt
}

export function splitIntoGroups<T> (array: T[], groupSize: number) {
  const groups = []

  for (let i = 0; i < array.length; i += groupSize) {
    groups.push(array.slice(i, i + groupSize))
  }

  return groups
}

export function getFormatDateNow () {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // dd/mm/yyyy

  return `${day < 10 ? '0' : ''}${day}/${month < 10 ? '0' : ''}${month}/${year}`
}
