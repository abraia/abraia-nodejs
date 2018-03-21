'use strict'

const assert = require('chai').assert
const path = require('path')
const fs = require('fs')

const abraia = require('../abraia/abraia').api

describe('Abraia', function () {
  it('upload a local file', function () {
    abraia
      .fromFile(path.join(__dirname, '../images/lion.jpg'))
      .then(data => {
        assert(data.url.endsWith('lion.jpg'))
      })
  })

  it('upload a remote file', function () {
    const url = 'https://abraia.me/images/random.jpg'
    abraia
      .fromUrl(url)
      .then(data => assert(data.params.url === url))
  })

  it('save to local file', function () {
    const filename = path.join(__dirname, '../images/optimized.jpg')
    const url = 'https://abraia.me/images/random.jpg'
    const client = abraia.fromUrl(url).toFile(filename)
      .then(() => assert(fs.lstatSync(filename).isFile()))
  })

  it('resize an image', function () {
    abraia
      .fromFile(path.join(__dirname, '../images/lion.jpg'))
      .resize({width: 150, height: 150})
      .toFile(path.join(__dirname, '../images/resized.jpg'))
  })
})
