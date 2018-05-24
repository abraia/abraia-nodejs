'use strict'

const assert = require('chai').assert
const path = require('path')
const fs = require('fs')

const Client = require('../client')

const client = new Client()

describe('Client', () => {
  it('list stored image files', () => {
    return client.listFiles()
      .then(files => assert.typeOf(files, 'array'))
  }).timeout(10000)

  it('upload an image file', () => {
    const file = fs.createReadStream(path.join(__dirname, '../images/lion.jpg'))
    return client.uploadFile(file)
      .then(data => assert(data.name === 'lion.jpg'))
  }).timeout(10000)

  it('download an image file', () => {
    client.downloadFile('0/lion.jpg')
      .then(data => assert(data.length > 0))
  }).timeout(10000)

  it('remove stored image file', () => {
    client.removeFile('0/lion.jpg')
      .then(data => assert(data instanceof Object))
  }).timeout(10000)

  it('analyze existing image', () => {
    client.analyzeImage('https://abraia.me/images/random.jpg')
      .then(data => {
        console.log(data)
        assert(data instanceof Object)
      })
  }).timeout(10000)

  it('analyze non existing image', () => {
    client.analyzeImage('https://abraia.me/images/0/lion.jpg')
      .catch(err => {
        console.log(err.message)
        assert(err instanceof Object)
      })
  }).timeout(10000)
})
