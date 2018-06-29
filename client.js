const btoa = require('btoa')
const axios = require('axios')
const FormData = require('form-data')

const API_URL = 'https://api.abraia.me'

class Client {
  constructor () {
    const apiKey = process.env.ABRAIA_API_KEY
    const apiSecret = process.env.ABRAIA_API_SECRET
    if ((apiKey !== undefined) && (apiSecret !== undefined)) {
      this.setApiKeys(apiKey, apiSecret)
    }
  }

  setApiKeys (apiKey, apiSecret) {
    const AUTH_TOKEN = 'Basic ' + btoa(apiKey + ':' + apiSecret)
    axios.defaults.headers.common['Authorization'] = AUTH_TOKEN
  }

  listFiles () {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/images`)
        .then(resp => {
          const files = resp.data.files
          for (const i in files) {
            files[i].path = files[i].source
            files[i].source = `${API_URL}/images/${files[i].source}`
            files[i].thumbnail = `${API_URL}/images/${files[i].thumbnail}`
          }
          resolve(files)
        })
        .catch(err => reject(err))
    })
  }

  uploadFile (file, callback = undefined) {
    const formData = new FormData()
    formData.append('file', file)
    const config = (formData.getHeaders instanceof Function ) ? { headers: formData.getHeaders() } : {}
    config.onUploadProgress = (evt) => (callback instanceof Function) && callback(evt)
    return new Promise((resolve, reject) => {
      axios.post(`${API_URL}/images`, formData, config)
        .then(resp => {
          const file = resp.data.file
          file.path = file.source
          file.source = `${API_URL}/images/${file.source}`
          file.thumbnail = `${API_URL}/images/${file.thumbnail}`
          resolve(file)
        })
        .catch(err => reject(err))
    })
  }

  downloadFile (path, params = {}) {
    const url = (path === '') ? `${API_URL}/images` : `${API_URL}/images/${path}`
    return new Promise((resolve, reject) => {
      axios.get(url, { params, responseType: 'arraybuffer' })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  removeFile (path) {
    return new Promise((resolve, reject) => {
      axios.delete(`${API_URL}/images/${path}`)
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  analyzeImage (url, params = {}) {
    params['url'] = url
    return new Promise((resolve, reject) => {
      axios.get(API_URL + '/analysis', {
        params
      }).then((resp) => {
        if (resp.status === 200) {
          resolve({ status: 'success', result: resp.data.result })
        } else if (resp.status === 201 || resp.status === 202) {
          if (resp.data.status === 'failed' || resp.data.status === 'timeout') {
            reject({ status: 'error', error: 'error processing the image' })
          } else {
            delay(1000).then(() => analyzeImage(url, params))
          }
        } else {
          reject({ status: 'error', error: 'unknown' })
        }
      }).catch(err => reject({ status: 'error', error: err }))
    })
  }
}

module.exports = Client
