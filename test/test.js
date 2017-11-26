'use strict'

const assert = require('chai').assert
const path = require('path')
const fs = require('fs')

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
    const filename = path.join(__dirname, '../images/optimized.jpg')
    const url = 'https://abraia.me/images/tiger.jpg'
    abraia.fromUrl(url).toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  })

  it('resize an image', function () {
    const url = 'https://abraia.me/images/lion.jpg'
    const source = abraia.fromUrl(url).resize({width: 150, height: 150})
    source.toFile(path.join(__dirname, '../images/resized.jpg'))
  })
})
