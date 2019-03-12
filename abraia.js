const mime = require('mime')
const fs = require('fs')

const { folder } = require('./config')
const Client = require('./client')

const client = new Client()
let userid

const userId = async () => {
  try {
    const resp = await user()
    return resp.id
  } catch (e) {
    return undefined
  }
}

const user = async () => {
  const resp = await client.loadUser()
  return resp.user
}

const files = async (path = '') => {
  if (!userid) userid = await userId()
  return client.listFiles(`${userid}/${path}`)
}

const fromFile = async (file) => {
  if (!userid) userid = await userId()
  const name = (file.path) ? file.path.split('/').pop() : file.split('/').pop()
  const type = mime.getType(name)
  const size = (file.contents) ? file.contents.length : fs.statSync(file)['size']
  const stream = (file.contents) ? file.contents : fs.createReadStream(file)
  return new Promise((resolve, reject) => {
    client.uploadFile({ name, type, size, stream }, `${userid}/${folder}${name}`)
      .then(resp => resolve({ path: resp.path, params: { q: 'auto' } }))
      .catch(err => reject(err))
  })
}

const fromUrl = async (url) => {
  if (!userid) userid = await userId()
  return new Promise((resolve, reject) => {
    client.uploadRemote(url, `${userid}/${folder}`)
      .then(resp => resolve({ path: resp.path, params: { q: 'auto' } }))
      .catch(err => reject(err))
  })
}

const fromStore = async (path) => {
  if (!userid) userid = await userId()
  return new Promise((resolve, reject) => {
    resolve({ path: `${userid}/${path}`, params: {} })
  })
}

const toBuffer = (params, values) => {
  if (params && params.fmt) values.params.fmt = params.fmt
  const type = mime.getType(values.path)
  if (type && type.split('/')[0] === 'video') {
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
    user: () => Api(previousActions.then(() => user())),
    files: (path) => Api(previousActions.then(() => files(path))),
    fromFile: (path) => Api(previousActions.then(() => fromFile(path))),
    fromUrl: (url) => Api(previousActions.then(() => fromUrl(url))),
    fromStore: (path) => Api(previousActions.then(() => fromStore(path))),
    resize: (params) => Api(previousActions.then(values => resize(params, values))),
    remove: () => Api(previousActions.then(values => remove(values))),
    toBuffer: (params) => Api(previousActions.then(values => toBuffer(params, values))),
    toFile: (filename) => Api(previousActions.then(values => toFile(filename, values))),
    then: (callback) => Api(previousActions.then(data => callback(data))),
    catch: (callback) => Api(previousActions.catch(data => callback(data)))
  }
}

const api = Api()

module.exports = api
