'use strict'

const assert = require('chai').assert
const path = require('path')
const fs = require('fs')

const abraia = require('../abraia')

describe('Abraia', () => {
  it('upload local file', async () => {
    const result = await abraia.fromFile(path.join(__dirname, '../images/lion.jpg'))
    assert(result.path.endsWith('lion.jpg'))
  }).timeout(25000)

  // it('upload a remote file', () => {
  //   const url = 'https://abraia.me/images/random.jpg'
  //   return abraia
  //     .fromUrl(url)
  //     .then(data => assert(data.params.url === url))
  // }).timeout(25000)

  it('optimize image', async () => {
    const filename = path.join(__dirname, '../images/optimized.jpg')
    await abraia
      .fromFile(path.join(__dirname, '../images/lion.jpg'))
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('thumb resize image', async () => {
    const filename = path.join(__dirname, '../images/roptim.jpg')
    await abraia
      .fromFile(path.join(__dirname, '../images/lion.jpg'))
      .resize({ width: 500, height: 500, mode: 'thumb' })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('height resize image', async () => {
    const filename = path.join(__dirname, '../images/tiger_x333.jpg')
    await abraia
      .fromFile(path.join(__dirname, '../images/tiger.jpg'))
      .resize({ height: 333 })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('smart resize image', async () => {
    const filename = path.join(__dirname, '../images/tiger_333x333.jpg')
    await abraia
      .fromFile(path.join(__dirname, '../images/tiger.jpg'))
      .resize({ width: 333, height: 333 })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)
})
