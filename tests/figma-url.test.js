import { describe, it, expect } from 'vitest'
import { extractFileKey, extractNodeId } from '../server/figma.js'

const URL = 'https://www.figma.com/design/lGoawgMQm08KzG5lNpGuwZ/Name?node-id=592-6187&t=abc'

describe('figma url helpers', () => {
  it('extracts the file key', () => {
    expect(extractFileKey(URL)).toBe('lGoawgMQm08KzG5lNpGuwZ')
  })
  it('extracts node-id and converts hyphen to colon', () => {
    expect(extractNodeId(URL)).toBe('592:6187')
  })
  it('returns null for malformed urls', () => {
    expect(extractFileKey('not a url')).toBeNull()
    expect(extractNodeId('https://figma.com/design/KEY/Name')).toBeNull()
  })
})
