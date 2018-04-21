'use strict'

const assert = require('chai').assert
const path = require('path')
const fs = require('fs')

const abraia = require('../abraia/abraia')

describe('Abraia', function () {
  it('upload a local file', function () {
    return abraia
      .fromFile(path.join(__dirname, '../images/lion.jpg'))
      .then(data => {
        assert(data.path.endsWith('lion.jpg'))
      })
  }).timeout(10000)

  it('upload a remote file', function () {
    const url = 'https://abraia.me/images/random.jpg'
    return abraia
      .fromUrl(url)
      .then(data => assert(data.params.url === url))
  }).timeout(10000)

  it('download stored file', () => {
    const filename = path.join(__dirname, '../images/optimized.jpg')
    return abraia
      .fromFile(path.join(__dirname, '../images/tiger.jpg'))
      .toFile(filename).then(() => assert(fs.lstatSync(filename).isFile()))
  }).timeout(10000)

  it('download remote file', () => {
    const filename = path.join(__dirname, '../images/roptim.jpg')
    return abraia
      .fromUrl('https://abraia.me/images/random.jpg')
      .resize({ width: 500, height: 500, mode: 'thumb' })
      .toFile(filename).then(() => assert(fs.lstatSync(filename).isFile()))
  }).timeout(10000)

  it('download resize file', () => {
    const filename = path.join(__dirname, '../images/lion_500x500.jpg')
    return abraia
      .fromFile(path.join(__dirname, '../images/lion.jpg'))
      .resize({ width: 500, height: 500 })
      .toFile(filename).then(() => assert(fs.lstatSync(filename).isFile()))
  }).timeout(10000)
})
