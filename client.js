const axios = require('axios')

const API_URL = 'https://api.abraia.me'

class Client {
  constructor () {
    const abraiaKey = process.env.ABRAIA_KEY
    if (abraiaKey) {
      const [apiKey, apiSecret] = Buffer.from(
        abraiaKey, 'base64').toString('binary').split(':')
      this.setApiKeys(apiKey, apiSecret)
    }
  }

  setApiKeys (apiKey, apiSecret) {
    this.auth = { username: apiKey, password: apiSecret }
  }

  loadUser () {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/users`, { auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  listFiles (path = '') {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/files/${path}`, { auth: this.auth })
        .then(resp => {
          const { files, folders } = resp.data
          for (const i in folders) {
            folders[i].path = folders[i].source
            folders[i].source = `${API_URL}/files/${folders[i].source}`
          }
          for (const i in files) {
            files[i].path = files[i].source
            files[i].source = `${API_URL}/images/${files[i].source}`
            files[i].thumbnail = `${API_URL}/files/${files[i].thumbnail}`
          }
          resolve({ files, folders })
        })
        .catch(err => reject(err))
    })
  }

  createFolder (path) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: `${API_URL}/files/${path}`,
        auth: this.auth
      }).then(resp => {
        const folder = resp.data.folder
        folder.path = folder.source
        folder.source = `${API_URL}/files/${folder.source}`
        resolve(folder)
      }).catch(err => reject(err))
    })
  }

  uploadRemote (url, path) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: `${API_URL}/files/${path}`,
        data: { url },
        auth: this.auth
      }).then(resp => {
        if (resp.status === 201) {
          const file = resp.data.file
          file.path = file.source
          file.source = `${API_URL}/files/${file.source}`
          resolve(file)
        } else {
          reject(resp)
        }
      }).catch(err => reject(err))
    })
  }

  uploadFile (file, path = '', callback = undefined) {
    const source = path.endsWith('/') ? path + file.name : path
    const name = source.split('/').pop()
    const type = (file.type) ? file.type : 'binary/octet-stream'
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: `${API_URL}/files/${path}`,
        data: { name, type },
        auth: this.auth
      }).then(resp => {
        if (resp.status === 201) {
          const config = { method: 'put', url: resp.data.uploadURL }
          if (typeof Blob !== 'undefined' && file instanceof Blob) {
            config.data = file
            config.headers = { 'Content-Type': type }
          } else {
            config.data = file.stream
            config.headers = { 'Content-Type': type, 'Content-Length': file.size }
          }
          if (callback instanceof Function) config.onUploadProgress = callback
          axios(config)
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
      }).catch(err => reject(err))
    })
  }

  moveFile (oldPath, newPath) {
    return new Promise((resolve, reject) => {
      axios.post(`${API_URL}/files/${newPath}`, { store: oldPath }, { auth: this.auth })
        .then(resp => {
          const file = resp.data.file
          file.path = file.source
          file.source = `${API_URL}/files/${file.source}`
          resolve(file)
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

  transformImage (path, params = {}) {
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

  aestheticsImage (path, params = {}) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/aesthetics/${path}`, { params, auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  processVideo (path, params = {}) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/videos/${path}`, { params, auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }
}

module.exports = Client
