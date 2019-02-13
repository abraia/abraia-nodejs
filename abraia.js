const mime = require('mime')
const fs = require('fs')

const Client = require('./client')

const client = new Client()
let userid

const listFiles = async (path = '') => {
  if (!userid) userid = await client.loadUser().then(resp => resp.user.id)
  return client.listFiles(`${userid}/${path}`)
}

const fromFile = async (file) => {
  if (!userid) userid = await client.loadUser().then(resp => resp.user.id)
  const name = (file.path) ? file.path.split('/').pop() : file.split('/').pop()
  const type = mime.getType(name)
  const size = (file.contents) ? file.contents.length : fs.statSync(file)['size']
  const stream = (file.contents) ? file.contents : fs.createReadStream(file)
  return new Promise((resolve, reject) => {
    client.uploadFile({ name, type, size, stream }, `${userid}/${name}`)
      .then(resp => resolve({ path: resp.path, params: { q: 'auto' } }))
      .catch(err => reject(err))
  })
}

const fromUrl = async (url) => {
  if (!userid) userid = await client.loadUser().then(resp => resp.user.id)
  return new Promise((resolve, reject) => {
    client.uploadRemote(url, `${userid}/`)
      .then(resp => resolve({ path: resp.path, params: { q: 'auto' } }))
      .catch(err => reject(err))
  })
}

const fromStore = async (path) => {
  if (!userid) userid = await client.loadUser().then(resp => resp.user.id)
  return new Promise((resolve, reject) => {
    resolve({ path: `${userid}/${path}`, params: {} })
  })
}

const toBuffer = (values) => {
  const type = mime.getType(values.path)
  if (type.split('/')[0] === 'video') {
    return client.processVideo(values.path, values.params)
  } else {
    return client.transformImage(values.path, values.params)
  }
}

const toFile = (path, values) => {
  if (Object.keys(values.params).length && path.split('.').length) {
    values.params.fmt = path.split('.').pop().toLowerCase()
  }
  return new Promise((resolve, reject) => {
    client.transformImage(values.path, values.params)
      .then((data) => {
        fs.writeFileSync(path, data)
        resolve(path)
      })
      .catch(err => reject(err))
  })
}

const resize = (params, values) => {
  return new Promise((resolve) => {
    if (params) {
      if (params.width) values.params.w = params.width
      if (params.height) values.params.h = params.height
      if (params.mode) values.params.m = params.mode
    }
    resolve(values)
  })
}

const remove = (values) => {
  return client.removeFile(values.path)
}

const Api = (previousActions = Promise.resolve()) => {
  return {
    listFiles: (path) => Api(previousActions.then(() => listFiles(path))),
    fromFile: (path) => Api(previousActions.then(() => fromFile(path))),
    fromUrl: (url) => Api(previousActions.then(() => fromUrl(url))),
    fromStore: (path) => Api(previousActions.then(() => fromStore(path))),
    resize: (params) => Api(previousActions.then(data => resize(params, data))),
    remove: () => Api(previousActions.then(data => remove(data))),
    toBuffer: () => Api(previousActions.then(data => toBuffer(data))),
    toFile: (filename) => Api(previousActions.then(data => toFile(filename, data))),
    then: (callback) => Api(previousActions.then(data => callback(data))),
    catch: (callback) => Api(previousActions.catch(data => callback(data)))
  }
}

const api = Api()

module.exports = api
