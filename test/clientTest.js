require('dotenv').config()

const assert = require('chai').assert
const fs = require('fs')

const { Client } = require('../client')

const client = new Client()

describe('client class', () => {
  it('load user', async () => {
    const result = await client.loadUser()
    assert(result instanceof Object)
    assert(result.user.id === 'demo')
  }).timeout(5000)

  it('list files', async () => {
    const result = await client.listFiles('demo/')
    assert.typeOf(result.files, 'array')
    assert.typeOf(result.folders, 'array')
  }).timeout(30000)

  it('create folder', async () => {
    const result = await client.createFolder('demo/test/')
    assert(result.name === 'test')
    assert(result.path === 'demo/test/')
  }).timeout(5000)

  it('upload remote', async () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Adler.jpg'
    const result = await client.uploadRemote(url, 'demo/')
    assert(result.name === 'Adler.jpg')
    assert(result.path === 'demo/Adler.jpg')
  }).timeout(30000)

  it('upload file', async () => {
    const file = {
      name: 'lion.jpg',
      type: 'image/jpeg',
      size: fs.statSync('images/lion.jpg')['size'],
      stream: fs.createReadStream('images/lion.jpg')
    }
    const result = await client.uploadFile(file, 'demo/lion.jpg')
    assert(result.name === 'lion.jpg')
    assert(result.path === 'demo/lion.jpg')
  }).timeout(30000)

  // it('upload public file', async () => {
  //   const file = {
  //     name: 'lion.jpg',
  //     type: 'image/jpeg',
  //     size: fs.statSync('images/lion.jpg')['size'],
  //     stream: fs.createReadStream('images/lion.jpg')
  //   }
  //   const result = await client.uploadFile(file, 'demo/lion.jpg', null, { public: true})
  //   console.log(result)
  //   assert(result.name === 'lion.jpg')
  //   assert(result.path === 'demo/lion.jpg')
  // }).timeout(30000)

  it('move file', async () => {
    await client.moveFile('demo/Adler.jpg', 'demo/test/Adler.jpg')
    const result = await client.moveFile('demo/test/Adler.jpg', 'demo/Adler.jpg')
    assert(result.name === 'Adler.jpg')
    assert(result.path === 'demo/Adler.jpg')
  }).timeout(30000)

  it('download file', async () => {
    const data = await client.downloadFile('demo/lion.jpg')
    assert(Buffer.isBuffer(data))
    assert(data.length === 469840)
  }).timeout(30000)

  it('delete file', async () => {
    const { file } = await client.deleteFile('demo/Adler.jpg')
    assert(file.name === 'Adler.jpg')
    assert(file.source === 'demo/Adler.jpg')
  }).timeout(5000)

  it('check file', async () => {
    const result = await client.checkFile('demo/lion.jpg')
    assert(result === true)
  }).timeout(5000)

  it('publish file', async () => {
    const result = await client.publishFile('demo/lion.jpg')
    assert(result.name === 'lion.jpg')
    assert(result.source === 'demo/lion.jpg')
  }).timeout(5000)

  it('load metadata', async () => {
    const meta = await client.loadMetadata('demo/lion.jpg')
    assert(meta.MIMEType === 'image/jpeg')
    assert(meta.ImageSize === '1920x1280')
  }).timeout(5000)

  it('analyze image', async () => {
    const result = await client.analyzeImage('demo/lion.jpg', { ar: 1 })
    assert(result instanceof Object)
  }).timeout(30000)

  it('transform image', async () => {
    const data = await client.transformImage('demo/lion.jpg', { width: 300 })
    assert(Buffer.isBuffer(data))
  }).timeout(30000)

  it('transform video', async () => {
    const result = await client.transformVideo('demo/videos/bigbuckbunny.mp4', { format: 'jpg' })
    assert(result.path.startsWith('demo/videos/bigbuckbunny'))
  }).timeout(30000)

  it('transform action', async () => {
    const [path, params] = await client.transformAction('demo/lion.jpg', { action: 'test.atn' })
    assert(path === 'demo/lion.jpg')
    assert(params.action === 'lion.atn')
  }).timeout(30000)

  it('transform media', async () => {
    const data = await client.transformMedia('demo/videos/bigbuckbunny.mp4', { format: 'jpg' })
    assert(Buffer.isBuffer(data))
  }).timeout(30000)

  it('transform file', async () => {
    // TODO: Review to fix undefined format
    const file = await client.transformFile('demo/videos/bigbuckbunny.mp4', { output: 'bigbuckbunny.jpg', format: 'jpg' })
    assert(Buffer.isBuffer(file.buffer))
  }).timeout(30000)

  it('download non existing file', () => {
    client.downloadFile('demo/Adler.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(30000)

  it('analyze non existing image', () => {
    client.analyzeImage('demo/Adler.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(5000)
})
