const fs = require('fs')
const path = require('path')
const assert = require('chai').assert

const Client = require('../client')

const client = new Client()

describe('Client', () => {
  it('list files', async () => {
    const result = await client.listFiles()
    assert.typeOf(result.files, 'array')
    assert.typeOf(result.folders, 'array')
  }).timeout(10000)

  it('upload file', async () => {
    const file = path.join(__dirname, '../images/lion.jpg')
    const result = await client.uploadFile(file, '0/lion.jpg', 'image/jpeg')
    assert(result instanceof Object)
    assert(result.name === 'lion.jpg')
    assert(result.path === '0/lion.jpg')
  }).timeout(10000)

  it('download file', async () => {
    const data = await client.downloadFile('0/birds.jpg')
    assert(data.length === 47259)
  }).timeout(10000)

  it('analyze image', async () => {
    const result = await client.analyzeImage('0/birds.jpg')
    assert(result instanceof Object)
    assert.typeOf(result.result, 'object')
  }).timeout(25000)

  it('aesthetics image', async () => {
    const result = await client.aestheticsImage('0/birds.jpg')
    assert(result instanceof Object)
    assert(result.result === 6.076241970062256)
  }).timeout(10000)

  it('remove file', async () => {
    const result = await client.removeFile('0/lion.jpg')
    assert(result instanceof Object)
    assert(result.file instanceof Object)
    assert(result.file.name === 'lion.jpg')
    assert(result.file.source === '0/lion.jpg')
  }).timeout(10000)

  it('download non existing file', () => {
    client.downloadFile('0/lion.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(10000)

  it('analyze non existing image', () => {
    client.analyzeImage('0/lion.jpg')
      .catch(err => assert(err instanceof Object))
  }).timeout(10000)
})
