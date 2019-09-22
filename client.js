// Setting Global follow-redirects maxBodyLength
const followRedirects = require('follow-redirects')
followRedirects.maxBodyLength = 100 * 1024 * 1024  // 100 MB
const axios = require('axios')
const mime = require('mime')

const API_URL = 'https://api.abraia.me'

class APIError extends Error {
  constructor(message, code = 0) {
    super(message)
    this.code = code
  }
}

const createError = (err) => {
  if (err.response)
    return new APIError(err.response.data.message, err.response.status)
  if (err.code === 'ENOTFOUND')
    return new APIError('No Internet Connection')
  return new APIError(err.message)
}

module.exports.sizeFormat = (bytes = 0) => {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

module.exports.Client = class Client {
  constructor() {
    const abraiaKey = process.env.ABRAIA_KEY
    if (abraiaKey) {
      const [apiKey, apiSecret] = Buffer.from(
        abraiaKey, 'base64').toString('binary').split(':')
      this.setApiKeys(apiKey, apiSecret)
    }
  }

  setApiKeys(apiKey, apiSecret) {
    this.auth = { username: apiKey, password: apiSecret }
  }

  async loadUser() {
    try {
      const resp = await axios.get(`${API_URL}/users`, { auth: this.auth })
      return resp.data
    } catch (err) {
      throw createError(err)
    } 
  }

  async listFiles(path = '') {
    try {
      const resp = await axios.get(`${API_URL}/files/${path}`, { auth: this.auth })
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
      return { files, folders }
    } catch (err) {
      throw createError(err)
    }
  }

  async createFolder(path) {
    try {
      const resp = await axios({ method: 'post', url: `${API_URL}/files/${path}`, auth: this.auth })
      const folder = resp.data.folder
      folder.path = folder.source
      folder.source = `${API_URL}/files/${folder.source}`
      return folder
    } catch (err) {
      throw createError(err)
    }
  }

  async uploadRemote(url, path) {
    try {
      const resp = await axios({ method: 'post', url: `${API_URL}/files/${path}`, data: { url }, auth: this.auth })
      if (resp.status === 201) {
        const file = resp.data.file
        file.path = file.source
        file.type = mime.getType(file.name),
        file.source = `${API_URL}/files/${file.source}`
        return file
      }
      throw createError(resp)
    } catch (err) {
      throw createError(err)
    }
  }

  async uploadFile(file, path = '', callback = undefined) {
    const source = path.endsWith('/') ? path + file.name : path
    const name = source.split('/').pop()
    const type = mime.getType(name) || 'binary/octet-stream'
    try {
      const resp = await axios({
        method: 'post',
        url: `${API_URL}/files/${path}`,
        data: (file.md5) ? { name, type, md5: file.md5 } : { name, type },
        auth: this.auth
      })
      if (resp.status === 201) {
        if (resp.data.uploadURL) {
          const config = { method: 'put', url: resp.data.uploadURL }
          if (typeof Blob !== 'undefined' && file instanceof Blob) {
            config.data = file
            config.headers = { 'Content-Type': type }
          } else {
            config.data = file.stream
            config.headers = { 'Content-Type': type, 'Content-Length': file.size }
          }
          if (callback instanceof Function) config.onUploadProgress = callback
          const res = await axios(config)
          if (res.status === 200) {
            return {
              name: name,
              path: source,
              size: file.size,
              type: mime.getType(name),
              source: `${API_URL}/files/${source}`,
              thumbnail: `${API_URL}/files/${source.slice(0, -name.length) + 'tb_' + name}`
            }
          }
        } else {
          const f = resp.data.file
          return {
            name: f.name,
            path: f.source,
            size: f.size,
            type: mime.getType(f.name),
            source: `${API_URL}/files/${f.source}`,
            thumbnail: `${API_URL}/files/${f.thumbnail}`
          }
        }
      }
      throw createError(resp)
    } catch (err) {
      throw createError(err)
    }
  }

  async moveFile(oldPath, newPath) {
    try {
      const resp = await axios.post(`${API_URL}/files/${newPath}`, { store: oldPath }, { auth: this.auth })
      const file = resp.data.file
      file.path = file.source
      file.source = `${API_URL}/files/${file.source}`
      return file
    } catch (err) {
      throw createError(err)
    }
  }

  async downloadFile(path, callback = undefined) {
    const config = { responseType: 'arraybuffer' }
    if (callback instanceof Function) config.onDownloadProgress = callback
    try {
      const resp = await axios.get(`${API_URL}/files/${path}`, config)
      return resp.data
    } catch (err) {
      throw createError(err)
    }
  }

  async deleteFile(path) {
    try {
      const resp = await axios.delete(`${API_URL}/files/${path}`, { auth: this.auth })
      return resp.data
    } catch (err) {
      throw createError(err)
    }
  }

  async transformImage(path, params = {}) {
    if (params.action) {
      params.background = `${API_URL}/images/${path}`
      if (!params.fmt) params.fmt = params.background.split('.').pop()
      path = `${path.split('/')[0]}/${params.action}`
    }
    const config = { params, responseType: 'arraybuffer', auth: this.auth }
    try {
      const resp = await axios.get(`${API_URL}/images/${path}`, config)
      return resp.data
    } catch (err) {
      throw createError(err)
    }
  }

  async analyzeImage(path, params = {}) {
    try {
      const resp = await axios.get(`${API_URL}/analysis/${path}`, { params, auth: this.auth })
      return resp.data
    } catch (err) {
      throw createError(err)
    }
  }

  async transformVideo(path, params = {}, delay = 5000) {
    try {
      const resp = await axios.get(`${API_URL}/videos/${path}`, { params, auth: this.auth })
      const result = resp.data
      return await new Promise(resolve => {
        const timer = setInterval(() => {
          axios.head(`${API_URL}/files/${result.path}`, { auth: this.auth })
            .then((resp) => {
              clearInterval(timer)
              resolve({ path: result.path })
            })
            .catch((err) => {
              if (err.response && err.response.status !== 404) {
                clearInterval(timer)
                resolve({ path: result.path })
              }
            })
        }, delay)
      })
    } catch (err) {
      throw createError(err)
    }
  }
}
