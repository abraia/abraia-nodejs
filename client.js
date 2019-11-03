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

const dataFile = (name, source, size) => {
  return {
    name, size,
    path: source,
    type: mime.getType(name),
    source: `${API_URL}/files/${source}`,
    thumbnail: `${API_URL}/files/${source.slice(0, -name.length) + 'tb_' + name}`
  }
}

module.exports.parseOutput = (output, params) => {
  String.prototype.interpolate = function (params) {
    const names = Object.keys(params)
    const vals = Object.values(params)
    return new Function(...names, `return \`${this}\`;`)(...vals)
  }
  const template = output.replace(/${/g, '{').replace(/{/g, '${')
  return template.interpolate(params)
}

module.exports.sizeFormat = (bytes = 0, decimals = 2) => {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizes[i]}`
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

  async getApi(url, params = {}, config = {}) {
    try {
      const resp = await axios.get(url, { params, ...config, auth: this.auth })
      return resp.data
    } catch (err) {
      throw createError(err)
    }
  }

  async postApi(url, data, params = {}) {
    try {
      const resp = await axios({ method: 'post', url, data, params, auth: this.auth })
      return resp.data
    } catch (err) {
      throw createError(err)
    }
  }

  async deleleApi(url) {
    try {
      const resp = await axios.delete(url, { auth: this.auth })
      return resp.data
    } catch (err) {
      throw createError(err)
    }
  }

  async headApi(url) {
    try {
      await axios.head(url, { auth: this.auth })
      return true
    } catch (err) {
      if (err.response && err.response.status === 404) return false
      return true
    }
  }

  async loadUser() {
    if (this.auth.username && this.auth.password) 
      return await this.getApi(`${API_URL}/users`)
    return new APIError('Unauthorized', 401)
  }

  async listFiles(path = '') {
    let { files, folders } = await this.getApi(`${API_URL}/files/${path}`)
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
  }

  async createFolder(path) {
    const { folder } = await this.postApi(`${API_URL}/files/${path}`)
    folder.path = folder.source
    folder.source = `${API_URL}/files/${folder.source}`
    return folder
  }

  async uploadRemote(url, path) {
    const { file } = await this.postApi(`${API_URL}/files/${path}`, { url })
    const { name, source, size } = file
    return dataFile(name, source, size)
  }

  async uploadFile(file, path = '', callback = undefined, params = {}) {
    const source = path.endsWith('/') ? path + file.name : path
    const name = source.split('/').pop()
    const type = mime.getType(name) || 'binary/octet-stream'
    const data = (file.md5) ? { name, type, md5: file.md5 } : { name, type }
    const result = await this.postApi(`${API_URL}/files/${path}`, data, params)
    if (result.uploadURL) {
      const config = { method: 'put', url: result.uploadURL, headers: { 'Content-Type': type } }
      if (typeof Blob !== 'undefined' && file instanceof Blob) {
        config.data = file
      } else {
        config.data = file.stream
        config.headers['Content-Length'] = file.size
      }
      if (params.access === 'public') config.headers['x-amz-acl'] = 'public-read'
      if (callback instanceof Function) config.onUploadProgress = callback
      const res = await axios(config)
      if (res.status === 200) return dataFile(name, source, file.size)
    } else {
      if (callback instanceof Function) callback({ loaded: result.file.size })
      return dataFile(result.file.name, result.file.source, result.file.size)
    }
  }

  async moveFile(oldPath, newPath) {
    const { file } = await this.postApi(`${API_URL}/files/${newPath}`, { store: oldPath })
    file.path = file.source
    file.source = `${API_URL}/files/${file.source}`
    return file
  }

  async downloadFile(path, callback = undefined) {
    const config = { responseType: 'arraybuffer' }
    if (callback instanceof Function) config.onDownloadProgress = callback
    // return await this.getApi(`${API_URL}/files/${path}`, undefined, config)
    const resp = await axios.get(`${API_URL}/files/${path}`, config)
    return resp.data
  }

  async deleteFile(path) {
    return await this.deleleApi(`${API_URL}/files/${path}`)
  }

  async checkFile(path) {
    return await this.headApi(`${API_URL}/files/${path}`)
  }

  async transformImage(path, params = {}) {
    if (params.action) {
      params.background = `${API_URL}/images/${path}`
      if (!params.fmt) params.fmt = params.background.split('.').pop()
      path = `${path.split('/')[0]}/${params.action}`
    }
    const config = { responseType: 'arraybuffer' }
    return await this.getApi(`${API_URL}/images/${path}`, params, config)
  }

  async analyzeImage(path, params = {}) {
    return await this.getApi(`${API_URL}/analysis/${path}`, params)
  }

  async transformVideo(path, params = {}, delay = 5000) {
    const result = await this.getApi(`${API_URL}/videos/${path}`, params)
    return await new Promise(resolve => {
      const timer = setInterval(async () => {
        const check = await this.headApi(`${API_URL}/files/${result.path}`)
        if (check) {
          clearInterval(timer)
          resolve({ path: result.path })
        }
      }, delay)
    })
  }
}
