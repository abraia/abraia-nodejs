// Setting Global follow-redirects maxBodyLength
const followRedirects = require('follow-redirects')
followRedirects.maxBodyLength = 500 * 1024 * 1024  // 500 MB
const axios = require('axios')

const utils = require('./utils')

const API_URL = 'https://api.abraia.me'

const dataFolder = (name, source) => {
  return { name, path: source, source: `${API_URL}/files/${source}` }
}

const dataFile = (name, source, size, date) => {
  // files[i].type = utils.getType(files[i].name)
  // files[i].source = `${API_URL}/images/${files[i].source}`
  // files[i].thumbnail = `${API_URL}/files/${files[i].thumbnail}`
  // md5
  return {
    name, path: source, source: `${API_URL}/files/${source}`,
    size, date, type: utils.getType(name),
    thumbnail: `${API_URL}/files/${source.slice(0, -name.length) + 'tb_' + name}`
  }
}

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
      return this.getApi(`${API_URL}/users`)
    throw new APIError('Unauthorized', 401)
  }

  async listFiles(path = '') {
    let { files, folders } = await this.getApi(`${API_URL}/files/${path}`)
    files = files.filter(file => !file.name.startsWith('.'))
    folders = folders.filter(folder => !folder.name.startsWith('.'))
    folders = folders.map(({ name, source }) => dataFolder(name, source))
    files = files.map(({ name, source, size, date }) => dataFile(name, source, size, date))
    return { files, folders }
  }

  async createFolder(path) {
    const { folder } = await this.postApi(`${API_URL}/files/${path}`)
    return dataFolder(folder.name, folder.source)
  }

  async uploadRemote(url, path) {
    const { file } = await this.postApi(`${API_URL}/files/${path}`, { url })
    return dataFile(file.name, file.source, file.size, file.date)
  }

  async uploadFile(file, path = '', callback = undefined, params = {}) {
    if (file.size && file.size > followRedirects.maxBodyLength) throw new APIError('File too long', 400);
    const source = path.endsWith('/') ? path + file.name : path
    const name = source.split('/').pop()
    const type = utils.getType(name) || 'binary/octet-stream'
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
      if (callback instanceof Function) callback({ loaded: result.file.size, total: result.file.size })
      return dataFile(result.file.name, result.file.source, result.file.size, result.file.date)
    }
  }

  async moveFile(oldPath, newPath) {
    const { file } = await this.postApi(`${API_URL}/files/${newPath}`, { store: oldPath })
    return dataFile(file.name, file.source)
  }

  async downloadFile(path, callback = undefined) {
    const config = { responseType: 'arraybuffer' }
    if (callback instanceof Function) config.onDownloadProgress = callback
    // return this.getApi(`${API_URL}/files/${path}`, undefined, config)
    const resp = await axios.get(`${API_URL}/files/${path}`, config)
    return resp.data
  }

  async deleteFile(path) {
    return this.deleleApi(`${API_URL}/files/${path}`)
  }

  async checkFile(path) {
    return this.headApi(`${API_URL}/files/${path}`)
  }

  async publishFile(path) {
    return this.getApi(`${API_URL}/files/${path}`, { access: 'public' })
  }

  async loadMetadata(path) {
    return this.getApi(`${API_URL}/metadata/${path}`)
  }

  async removeMetadata(path) {
    return this.deleleApi(`${API_URL}/metadata/${path}`)
  }

  async transformImage(path, params = {}) {
    if (params.action) {
      params.background = `${API_URL}/images/${path}`
      if (!params.fmt) params.fmt = params.background.split('.').pop()
      path = `${path.split('/')[0]}/${params.action}`
    }
    const config = { responseType: 'arraybuffer' }
    return this.getApi(`${API_URL}/images/${path}`, params, config)
  }

  async createOverlay(path, params) {
    const userid = path.split('/')[0]
    const action = `${userid}/${params.action}`
    const name = `overlay-${action.split('/').pop().split('.')[0]}.png`
    const overlay = `${path.slice(0, path.lastIndexOf('/'))}/${name}`
    const buffer = await this.transformImage(action, { format: 'png' })
    const file = { name, size: buffer.length, stream: buffer }
    await this.uploadFile(file, overlay)
    return overlay
  }

  async transformVideo(path, params = {}, callback = undefined, delay = 5000) {
    let check
    let processing = 0
    if (params.output) {
      const userid = path.split('/')[0]
      const output = `${userid}/${params.output}`
      await this.deleteFile(output)
    }
    if (params.action && !params.overlay) params.overlay = await this.createOverlay(path, params)
    // TODO: Review to fix undefined format
    const result = await this.getApi(`${API_URL}/videos/${path}`, params)
    return new Promise(resolve => {
      const timer = setInterval(async () => {
        processing += delay / 1000
        // TODO: Review to check snapshot faster (images)
        if (processing > 20) check = await this.headApi(`${API_URL}/files/${result.path}`)
        if (callback instanceof Function) {
          const progress = processing / (60 + (params.to || 300))
          callback(progress)
        }
        if (check) {
          clearInterval(timer)
          if (params.action) await this.deleteFile(params.overlay)
          resolve({ path: result.path })
        }
      }, delay)
    })
  }

  async saveAction(path, params, json) {
    const userid = path.split('/')[0]
    const output = utils.parseOutput(path, params)
    const folder = path.slice(0, path.lastIndexOf('/'))
    const name = `${output.slice(0, output.lastIndexOf('.'))}.atn`
    const stream = JSON.stringify(json)
    const size = stream.length
    const file = await this.uploadFile({ name, size, stream }, `${folder}/${name}`)
    return file.path.slice(userid.length + 1) // action file
  }

  async transformAction(path, params) {
    if (path.endsWith('.atn') || params.action) {
      const userid = path.split('/')[0]
      const action = params.action ? `${userid}/${params.action}` : path
      // let json = await this.getApi(`${API_URL}/files/${action}`)
      const resp = await axios.get(`${API_URL}/files/${action}`)
      let json = resp.data
      const video = utils.parseActionVideo(json)
      if (path.endsWith('.atn') && video.path) {
        params.action = path.slice(path.indexOf('/') + 1)
        path = video.path
      }
      if (video.params) params = Object.assign(params, video.params)
      if (utils.getType(path).startsWith('video')) {
        // const video = await transformActionVideo(client, action, params)
        // TODO: save action video
      }
      if (utils.getType(path).startsWith('image')) {
        json = await utils.transformActionImage(path, params, json)
        params.action = await this.saveAction(path, params, json)
      }
    }
    return [path, params]
  }

  async transformMedia(path, params, callback = undefined) {
    if (utils.getType(path).startsWith('video')) {
      const result = await this.transformVideo(path, params, callback)
      return this.downloadFile(result.path)
    } else {
      return this.transformImage(path, params)
    }
  }

  async transformFile(path, params, callback = undefined) {
    [path, params] = await this.transformAction(path, params)
    params.output = utils.parseOutput(path, params)
    const buffer = await this.transformMedia(path, params, callback)
    const name = params.output.split('/').pop()
    return { buffer, name, type: utils.getType(name) }
  }
}
