const assert = require('chai').assert
const fs = require('fs')

const abraia = require('../abraia')

describe('Abraia', () => {
  it('list stored files', async () => {
    const result = await abraia.listFiles()
    assert(result instanceof Object)
  }).timeout(25000)

  it('upload local file', async () => {
    const result = await abraia.fromFile('images/lion.jpg')
    assert(result.path.endsWith('lion.jpg'))
  }).timeout(25000)

  it('upload remote file', async () => {
    const url = 'https://api.abraia.me/files/demo/birds.jpg'
    const result = await abraia.fromUrl(url)
    assert(result.path.endsWith('birds.jpg'))
  }).timeout(25000)

  it('upload unexisting file', () => {
    abraia.fromFile('lion.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(25000)

  it('optimize image', async () => {
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

  it('restore stored image', async () => {
    await abraia.fromStore('lion.jpg').toFile('images/lion.bak.jpg')
    assert(fs.lstatSync('images/lion.bak.jpg').isFile())
  }).timeout(25000)

  it('remove stored image', async () => {
    const result = await abraia.fromStore('lion.jpg').remove()
    assert(result.file.name === 'lion.jpg')
  }).timeout(25000)
})
