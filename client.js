const axios = require('axios')
const fs = require('fs')

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
    this.auth = {
      username: apiKey,
      password: apiSecret
    }
  }

  listFiles (path = '') {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/images/${path}`, { auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  uploadFile (file, path = '', type = '', callback = undefined) {
    const source = path.endsWith('/') ? path.slice(0, -1) : path
    const name = (path === '') ? file.split('/').pop() : source.split('/').pop()
    return new Promise((resolve, reject) => {
      axios.post(`${API_URL}/files/${path}`, { name, type }, { auth: this.auth })
        .then(resp => {
          if (resp.status === 201) {
            const uploadURL = resp.data.uploadURL
            const total = fs.statSync(file)['size']
            const stream = fs.createReadStream(file)
            const config = { headers: { 'Content-Type': type, 'Content-Length': total } }
            if (callback instanceof Function) config.onDownloadProgress = callback
            axios.put(uploadURL, stream, config)
              .then(resp => {
                if (resp.status === 200) {
                  resolve({
                    name: name,
                    path: source,
                    source: `${API_URL}/files/${source}`,
                    thumbnail: `${API_URL}/files/${source.slice(0, -name.length) + 'tb_' + name}`
                  })
                } else {
                  reject(resp)
                }
              })
              .catch(err => reject(err))
          } else {
            reject(resp)
          }
        })
        .catch(err => reject(err))
    })
  }

  downloadFile (path, callback = undefined) {
    const config = { responseType: 'arraybuffer' }
    if (callback instanceof Function) config.onDownloadProgress = callback
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/files/${path}`, config)
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  removeFile (path) {
    return new Promise((resolve, reject) => {
      axios.delete(`${API_URL}/files/${path}`, { auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  transformImage (path, params) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/images/${path}`, { params, responseType: 'arraybuffer' })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  analyzeImage (path, params = {}) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/analysis/${path}`, { params, auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  aestheticsImage (path) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/aesthetics/${path}`, { auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  transcodeVideo (path, params) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/video/${path}`, { params, auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }
}

module.exports = Client
