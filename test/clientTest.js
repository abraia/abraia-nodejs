const fs = require('fs')
const path = require('path')
const assert = require('chai').assert

const Client = require('../client')

const client = new Client()

describe('Client', () => {
  it('create folder', async () => {
    const result = await client.loadUser()
    assert(result instanceof Object)
  }).timeout(25000)

  it('list files', async () => {
    const result = await client.listFiles()
    assert.typeOf(result.files, 'array')
    assert.typeOf(result.folders, 'array')
  }).timeout(25000)

  it('create folder', async () => {
    const result = await client.createFolder('0/test/')
    assert(result instanceof Object)
    assert(result.name === 'test')
    assert(result.path === '0/test/')
  }).timeout(25000)

  it('upload remote', async () => {
    const url = 'https://api.abraia.me/files/demo/birds.jpg'
    const result = await client.uploadRemote(url, '0/')
    assert(result instanceof Object)
    assert(result.name === 'birds.jpg')
    assert(result.path === '0/birds.jpg')
  }).timeout(25000)

  it('upload file', async () => {
    const filename = path.join(__dirname, '../images/lion.jpg')
    const file = {
      name: 'lion.jpg',
      type: 'image/jpeg',
      size: fs.statSync(filename)['size'],
      stream: fs.createReadStream(filename)
    }
    const result = await client.uploadFile(file, '0/lion.jpg')
    assert(result instanceof Object)
    assert(result.name === 'lion.jpg')
    assert(result.path === '0/lion.jpg')
  }).timeout(25000)

  it('download file', async () => {
    const data = await client.downloadFile('0/lion.jpg')
    assert(data.length === 469840)
  }).timeout(25000)

  it('move file', async () => {
    await client.moveFile('0/birds.jpg', '0/test/birds.jpg')
    const result = await client.moveFile('0/test/birds.jpg', '0/birds.jpg')
    assert(result instanceof Object)
    assert(result.name === 'birds.jpg')
    assert(result.path === '0/birds.jpg')
  }).timeout(25000)

  // it('analyze image', async () => {
  //   const result = await client.analyzeImage('0/birds.jpg')
  //   assert(result instanceof Object)
  //   assert.typeOf(result.result, 'object')
  // }).timeout(25000)

  // it('aesthetics image', async () => {
  //   const result = await client.aestheticsImage('0/birds.jpg')
  //   assert(result instanceof Object)
  //   assert(result.result === 6.076241970062256)
  // }).timeout(25000)

  it('remove file', async () => {
    const result = await client.removeFile('0/lion.jpg')
    assert(result instanceof Object)
    assert(result.file instanceof Object)
    assert(result.file.name === 'lion.jpg')
    assert(result.file.source === '0/lion.jpg')
  }).timeout(25000)

  it('download non existing file', () => {
    client.downloadFile('0/lion.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(25000)

  it('analyze non existing image', () => {
    client.analyzeImage('0/lion.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(25000)
})
