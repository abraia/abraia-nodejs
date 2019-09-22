require('dotenv').config()

const fs = require('fs')
const path = require('path')
const assert = require('chai').assert

const { parseOutput, sizeFormat, Client } = require('../client')

describe('client utils', () => {
  it('parse output', () => {
    const output = parseOutput('{name}.{ext}', { name: 'test', ext: 'jpg' })
    assert(output === 'test.jpg')
  })
  
  it('size format', () => {
    const size = sizeFormat(127806)
    assert(size === '124.81 KB')
  })
})

const client = new Client()

describe('client class', () => {
  it('load user', async () => {
    const result = await client.loadUser()
    assert(result instanceof Object)
    assert(result.user.id === 'demo')
  }).timeout(30000)

  it('list files', async () => {
    const result = await client.listFiles('demo/')
    assert.typeOf(result.files, 'array')
    assert.typeOf(result.folders, 'array')
  }).timeout(30000)

  it('create folder', async () => {
    const result = await client.createFolder('demo/test/')
    assert(result instanceof Object)
    assert(result.name === 'test')
    assert(result.path === 'demo/test/')
  }).timeout(30000)

  it('upload remote', async () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Adler.jpg'
    const result = await client.uploadRemote(url, 'demo/')
    assert(result instanceof Object)
    assert(result.name === 'Adler.jpg')
    assert(result.path === 'demo/Adler.jpg')
  }).timeout(30000)

  it('upload file', async () => {
    const filename = path.join(__dirname, '../images/lion.jpg')
    const file = {
      name: 'lion.jpg',
      type: 'image/jpeg',
      size: fs.statSync(filename)['size'],
      stream: fs.createReadStream(filename)
    }
    const result = await client.uploadFile(file, 'demo/lion.jpg')
    assert(result instanceof Object)
    assert(result.name === 'lion.jpg')
    assert(result.path === 'demo/lion.jpg')
  }).timeout(30000)

  it('move file', async () => {
    await client.moveFile('demo/Adler.jpg', 'demo/test/Adler.jpg')
    const result = await client.moveFile('demo/test/Adler.jpg', 'demo/Adler.jpg')
    assert(result instanceof Object)
    assert(result.name === 'Adler.jpg')
    assert(result.path === 'demo/Adler.jpg')
  }).timeout(30000)

  it('download file', async () => {
    const data = await client.downloadFile('demo/lion.jpg')
    assert(Buffer.isBuffer(data))
    assert(data.length === 469840)
  }).timeout(30000)

  it('delete file', async () => {
    const result = await client.deleteFile('demo/Adler.jpg')
    assert(result instanceof Object)
    assert(result.file instanceof Object)
    assert(result.file.name === 'Adler.jpg')
    assert(result.file.source === 'demo/Adler.jpg')
  }).timeout(30000)

  it('transform image', async () => {
    const data = await client.transformImage('demo/lion.jpg', { w: 300 })
    assert(Buffer.isBuffer(data))
  }).timeout(30000)

  it('analyze image', async () => {
    const result = await client.analyzeImage('demo/lion.jpg', { ar: 1 })
    assert(result instanceof Object)
  }).timeout(30000)

  it('transform video', async () => {
    const result = await client.transformVideo('demo/videos/bigbuckbunny.mp4', { fmt: 'jpg' })
    assert(result.path === 'demo/videos/bigbuckbunny.jpg')
  }).timeout(30000)

  it('download non existing file', () => {
    client.downloadFile('demo/Adler.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(30000)

  it('analyze non existing image', () => {
    client.analyzeImage('demo/Adler.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(30000)
})
