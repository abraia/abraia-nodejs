// Setting Global follow-redirects maxBodyLength
const followRedirects = require('follow-redirects')
followRedirects.maxBodyLength = 100 * 1024 * 1024  // 100 MB
const axios = require('axios')
const mime = require('mime')

const utils = require('./utils')

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

const saveAction = async (client, path, params, json) => {
  const userid = path.split('/')[0];
  const output = utils.parseOutput(path, params);
  const folder = path.slice(0, path.lastIndexOf('/'));
  const name = `${output.slice(0, output.lastIndexOf('.'))}.atn`;
  const stream = JSON.stringify(json);
  const size = stream.length;
  const file = await client.uploadFile({ name, size, stream }, `${folder}/${name}`);
  return file.path.slice(userid.length + 1); // action file
};

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

  async analyzeImage(path, params = {}) {
    return await this.getApi(`${API_URL}/analysis/${path}`, params)
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

  async transformVideo(path, params = {}, delay = 5000) {
    if (params.action) {
      params.overlay = await this.createOverlay(path, params)
      // const video = await transformActionVideo(client, path, params)
      // if (video.params) params = Object.assign(params, video.params)
    }
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

  async transformAction(path, params) {
    if (path.endsWith('.atn') || params.action) {
      let action = path;
      if (params.action) {
        const userid = path.split('/')[0];
        action = `${userid}/${params.action}`;
      }
      let json = await this.getApi(`${API_URL}/files/${action}`)
      const video = utils.parseActionVideo(json)
      if (path.endsWith('.atn') && video.path) path = video.path
      if (video.params) params = Object.assign(params, video.params)
      const type = mime.getType(path)
      // console.log(json)
      if (type && type.startsWith('video')) {
        // const video = await transformActionVideo(client, action, params)
        // TODO: save action video
      } else if (type && type.startsWith('image')) {
        json = await utils.transformActionImage(path, params, json)
        params.action = await saveAction(this, path, params, json)
      }
      // console.log(json)
    }
    return [path, params]
  }

  async transformMedia(path, params) {
    const type = mime.getType(path)
    if (type && type.startsWith('video')) {
      const result = await this.transformVideo(path, params)
      return this.downloadFile(result.path)
    } else {
      return this.transformImage(path, params)
    }
  }
}
