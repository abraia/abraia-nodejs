// Setting Global follow-redirects maxBodyLength
const followRedirects = require('follow-redirects')
followRedirects.maxBodyLength = 100 * 1024 * 1024; // 100 MB
const axios = require('axios')
const mime = require('mime')

const { API_URL } = require('./config')

const createError = (err) => {
  if (err.response)
    return new APIError(err.response.data.message, err.response.status)
  return new APIError('No Internet Connection')
}

class APIError extends Error {
  constructor(message, code = 0) {
    super(message)
    this.code = code
  }
}

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
        .catch(err => reject(createError(err)))
    })
  }

  listFiles(path = '') {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/files/${path}`, { auth: this.auth })
        .then(resp => {
          let { files, folders } = resp.data
          files = files.filter(file => !file.name.startsWith('.'))
          folders = folders.filter(folder => !folder.name.startsWith('.'))
          for (const i in folders) {
            folders[i].path = folders[i].source
            folders[i].source = `${API_URL}/files/${folders[i].source}`
          }
          for (const i in files) {
            files[i].path = files[i].source
            files[i].source = `${API_URL}/images/${files[i].source}`
            files[i].thumbnail = `${API_URL}/files/${files[i].thumbnail}`
            if (files[i].name.endsWith('m3u8')) files[i].type = 'application/x-mpegURL'
            else files[i].type = mime.getType(files[i].name)
          }
          resolve({ files, folders })
        })
        .catch(err => reject(createError(err)))
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
      }).catch(err => reject(createError(err)))
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
      }).catch(err => reject(createError(err)))
    })
  }

  uploadFile (file, path = '', callback = undefined) {
    const source = path.endsWith('/') ? path + file.name : path
    const name = source.split('/').pop()
    const type = mime.getType(name) || 'binary/octet-stream'
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
            .catch(err => reject(createError(err)))
        } else {
          reject(resp)
        }
      }).catch(err => reject(createError(err)))
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
        .catch(err => reject(createError(err)))
    })
  }

  downloadFile (path, callback = undefined) {
    const config = { responseType: 'arraybuffer' }
    if (callback instanceof Function) config.onDownloadProgress = callback
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/files/${path}`, config)
        .then(resp => resolve(resp.data))
        .catch(err => reject(createError(err)))
    })
  }

  deleteFile (path) {
    return new Promise((resolve, reject) => {
      axios.delete(`${API_URL}/files/${path}`, { auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(createError(err)))
    })
  }

  transformImage (path, params = {}) {
    const config = { params, responseType: 'arraybuffer', auth: this.auth }
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/images/${path}`, config)
        .then(resp => resolve(resp.data))
        .catch(err => reject(createError(err)))
    })
  }

  analyzeImage (path, params = {}) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/analysis/${path}`, { params, auth: this.auth })
        .then(resp => resolve(resp.data))
        .catch(err => reject(createError(err)))
    })
  }

  transformVideo (path, params = {}, delay = 5000) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/videos/${path}`, { params, auth: this.auth })
        .then((resp) => {
          const result = resp.data
          const timer = setInterval(() => {
            axios.head(`${API_URL}/files/${result.path}`, { auth: this.auth })
              .then((resp) => {
                console.log(resp)
                clearInterval(timer)
                resolve({ path: result.path })
              })
              .catch((err) => {
                console.log(err)
                if (err.response && err.response.status !== 404) {
                  clearInterval(timer)
                  resolve({ path: result.path })
                }
              })
          }, delay)
        })
        .catch(err => reject(createError(err)))
    })
  }
}

module.exports = Client
