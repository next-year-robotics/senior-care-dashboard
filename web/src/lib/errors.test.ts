import { expect, it } from 'vitest'
import { errorKind, errorMessages } from './errors'
it('maps SDK errors to Korean messages without showing raw server content', () => {
  expect(errorKind({ code: 'PERMISSION_DENIED', message: 'secret details' })).toBe('permission')
  expect(errorKind({ code: 'auth/network-request-failed' })).toBe('network')
  expect(errorKind({ code: 'auth/popup-closed-by-user' })).toBe('cancelled')
  expect(errorKind(new Error('unexpected private content'))).toBe('unknown')
  expect(errorMessages[errorKind('new/code')]).not.toContain('new/code')
})
