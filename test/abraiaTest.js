require('dotenv').config()

const assert = require('chai').assert
const fs = require('fs')

const abraia = require('../abraia')

describe('Abraia', () => {
  it('load user data', async () => {
    const result = await abraia.user()
    assert(result instanceof Object)
  }).timeout(25000)

  it('list stored files', async () => {
    const result = await abraia.files()
    assert(result instanceof Object)
  }).timeout(25000)

  it('optimize local image', async () => {
    const data = await abraia.fromFile('images/lion.jpg').toBuffer()
    assert(Buffer.isBuffer(data))
  }).timeout(25000)

  it('optimize remote image', async () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Adler.jpg'
    const data = await abraia.fromUrl(url).toBuffer()
    assert(Buffer.isBuffer(data))
  }).timeout(25000)

  it('optimize unexisting file', () => {
     abraia.fromFile('lion.jpg').toBuffer()
      .catch(err => assert(err instanceof Object))
  }).timeout(25000)

  it('optimize and save image', async () => {
    await abraia.fromStore('lion.jpg').toFile('images/optimized.jpg')
    assert(fs.lstatSync('images/optimized.jpg').isFile())
  }).timeout(25000)

  it('optimize buffer image', async () => {
    const data = await abraia.fromStore('lion.jpg').toBuffer()
    assert(Buffer.isBuffer(data))
  }).timeout(25000)

  it('convert buffer image', async () => {
    const data = await abraia.fromStore('lion.jpg').toBuffer({ fmt: 'webp' })
    assert(Buffer.isBuffer(data))
  }).timeout(25000)

  it('thumb resize image', async () => {
    const filename = 'images/roptim.jpg'
    await abraia.fromFile('images/lion.jpg')
      .resize({ width: 500, height: 500, mode: 'thumb' })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('height resize image', async () => {
    const filename = 'images/tiger_x333.jpg'
    await abraia.fromFile('images/tiger.jpg')
      .resize({ height: 333 })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('smart resize image', async () => {
    const filename = 'images/tiger_333x333.jpg'
    await abraia.fromFile('images/tiger.jpg')
      .resize({ width: 333, height: 333 })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('process branded image', async () => {
    const filename = 'images/tiger_brand.jpg'
    await abraia.fromStore('tiger.jpg')
      .process({ action: 'test.atn' })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('process branded video', async () => {
    const filename = 'images/video_brand.jpg'
    await abraia.fromStore('videos/bigbuckbunny.mp4')
      .process({ action: 'test-video.atn' })
      .toFile(filename)
    assert(fs.lstatSync(filename).isFile())
  }).timeout(25000)

  it('restore stored image', async () => {
    await abraia.fromStore('lion.jpg').toFile('images/lion.bak.jpg')
    assert(fs.lstatSync('images/lion.bak.jpg').isFile())
  }).timeout(25000)

  it('delete stored image', async () => {
    const result = await abraia.fromStore('lion.jpg').delete()
    assert(result.file.name === 'lion.jpg')
  }).timeout(25000)
})
