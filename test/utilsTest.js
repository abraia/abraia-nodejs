const assert = require('chai').assert

const { parseString, sizeFormat, parseQuery, stringifyParams, csvToJson } = require('../utils')

describe('client utils', () => {
  it('parse output', () => {
    const output = parseString('{name}.{ext}', { name: 'test', ext: 'jpg' })
    assert(output === 'test.jpg')
  })

  it('size format', () => {
    const size = sizeFormat(127806)
    assert(size === '124.81 KB')
  })

  it('parse query', () => {
    const params = parseQuery('width=300&height=200')
    assert(params.width === '300')
  })

  it('stringify query', () => {
    const query = stringifyParams({ width: 300, height: 200 })
    assert(query === 'width=300&height=200')
  })

  it('csv to json', () => {
    const json = csvToJson('image, text\ntest.jpg, test')
    assert(json[0].image === 'test.jpg')
  })
})
