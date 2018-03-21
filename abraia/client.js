'use strict'

const fs = require('fs')
const btoa = require('btoa')
const axios = require('axios')
const FormData = require('form-data')

const API_URL = 'https://abraia.me/api'

class Client {
  constructor (apiKey, apiSecret) {
    const AUTH_TOKEN = 'Basic ' + btoa(apiKey + ':' + apiSecret)
    axios.defaults.headers.common['Authorization'] = AUTH_TOKEN
  }

  listFiles () {
    return new Promise((resolve, reject) => {
      axios.get(API_URL + '/images')
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  removeFile (url) {
    return new Promise((resolve, reject) => {
      axios.delete(url)
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  uploadFile (path) {
    const formData = new FormData()
    formData.append('file', fs.createReadStream(path))
    return new Promise((resolve, reject) => {
      axios.post(API_URL + '/images', formData, {
        headers: formData.getHeaders(),
        onUploadProgress: (progressEvent) => {
          console.log(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        }
      }).then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  downloadFile (url, params) {
    return new Promise((resolve, reject) => {
      axios.get(url, { params, responseType: 'arraybuffer' })
      .then(resp => resolve(resp.data))
      .catch(err => reject(err))
    })
  }
}

module.exports = Client
