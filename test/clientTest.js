'use strict'

const assert = require('chai').assert
const path = require('path')
const fs = require('fs')

const Client = require('../abraia/client')
const config = require('../abraia/config')

const { apiKey, apiSecret } = config.loadAuth()
const client = new Client(apiKey, apiSecret)

describe('Client', () => {
  it('list stored image files', () => {
    return client.listFiles()
      .then(data => assert.typeOf(data, 'object'))
  }).timeout(10000)

  it('upload an image file', () => {
    return client.uploadFile(path.join(__dirname, '../images/lion.jpg'))
      .then(data => assert(data['filename'].endsWith('lion.jpg')))
  }).timeout(10000)

  it('download an image file', () => {
    const url = 'https://abraia.me/images/random.jpg'
    client.downloadFile(url)
      .then(data => assert(data.length > 0))
  }).timeout(10000)

  it('remove stored image file', () => {
    client.removeFile('https://abraia.me/images/0/lion.jpg')
      .then(data => assert(data instanceof Object))
  }).timeout(10000)
})
