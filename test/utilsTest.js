const assert = require('chai').assert

const { parseString, sizeFormat } = require('../utils')

describe('client utils', () => {
  it('parse output', () => {
    const output = parseString('{name}.{ext}', { name: 'test', ext: 'jpg' })
    assert(output === 'test.jpg')
  })

  it('size format', () => {
    const size = sizeFormat(127806)
    assert(size === '124.81 KB')
  })
})
