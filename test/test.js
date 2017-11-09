'use strict'

const assert = require('chai').assert
const path = require('path')

const abraia = require('../abraia')

describe('Abraia', function () {
  it('upload a local file', function () {
    const source = abraia.fromFile(path.join(__dirname, '../images/lion.jpg'))
    assert(source instanceof abraia.Client)
  })

  it('upload a remote file', function () {
    const url = 'https://abraia.me/images/tiger.jpg'
    const source = abraia.fromUrl(url)
    assert(source instanceof abraia.Client)
    assert(source._params.url === url)
  })

  it('save to local file', function () {
    const url = 'https://abraia.me/images/tiger.jpg'
    const source = abraia.fromUrl(url)
    source.toFile(path.join(__dirname, '../images/optimized.jpg'))
  })

  it('resize an image', function () {
    const url = 'https://abraia.me/images/lion.jpg'
    const source = abraia.fromUrl(url).resize({width: 150, height: 150})
    source.toFile(path.join(__dirname, '../images/resized.jpg'))
  })
})
