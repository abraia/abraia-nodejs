'use strict'

const fs = require('fs')
const btoa = require('btoa')
const request = require('request-promise')

const ABRAIA_API_URL = 'https://abraia.me/api'
const ABRAIA_API_KEY = process.env.ABRAIA_API_KEY ? process.env.ABRAIA_API_KEY : 'demo'
const ABRAIA_API_SECRET = process.env.ABRAIA_API_SECRET ? process.env.ABRAIA_API_SECRET : 'abraia'

// axios.defaults.baseURL = 'https://api.example.com'
const authRequest = request.defaults({
  headers: {'Authorization': 'Basic ' + btoa(ABRAIA_API_KEY + ':' + ABRAIA_API_SECRET)}
})

class Client {
  constructor () {
    this._url = ''
    this._params = {}
    this._promise = undefined
  }

  fromFile (filename) {
    const url = ABRAIA_API_URL + '/images'
    const formData = {file: fs.createReadStream(filename)}
    this._promise = authRequest.post({url, formData})
      .then(body => {
        const resp = JSON.parse(body)
        console.log('Uploaded ', filename)
        this._url = ABRAIA_API_URL + '/images/' + resp['filename']
        this._params = {q: 'auto'}
      })
      .catch(err => {
        console.error('upload failed:', err)
      })
    return this
  }

  fromUrl (url) {
    this._url = ABRAIA_API_URL + '/images'
    this._params = {url: url, q: 'auto'}
    return this
  }

  toFile (filename) {
    if (this._promise !== undefined) {
      this._promise.then(() => {
        authRequest.get({url: this._url, qs: this._params})
          .on('error', (err) => console.log(err))
          .pipe(fs.createWriteStream(filename))
          .on('finish', () => console.log('Downloaded ', filename))
      })
    } else {
      authRequest.get({url: this._url, qs: this._params})
        .on('error', (err) => console.log(err))
        .pipe(fs.createWriteStream(filename))
        .on('finish', () => console.log('Downloaded ', filename))
    }
  }

  resize (params) {
    if (params.width !== undefined) {
      this._params.w = params.width
    }
    if (params.height !== undefined) {
      this._params.h = params.height
    }
    return this
  }
}

module.exports = {
  fromFile (path) {
    return new Client().fromFile(path)
  },

  fromUrl (url) {
    return new Client().fromUrl(url)
  },

  Client
}
