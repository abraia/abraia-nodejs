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

  it('upload remote file', async () => {
    const url = 'https://api.abraia.me/files/demo/birds.jpg'
    const result = await abraia.fromUrl(url)
    assert(result.path.endsWith('birds.jpg'))
  }).timeout(25000)

  it('optimize image', async () => {
    const filename = path.join(__dirname, '../images/optimized.jpg')
    await abraia.fromStore('0/lion.jpg').toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('optimize buffer image', async () => {
    const data = await abraia.fromStore('0/lion.jpg').toBuffer()
    assert(Buffer.isBuffer(data))
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
