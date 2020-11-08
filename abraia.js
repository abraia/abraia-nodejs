const { folder } = require('./config')
const { Client } = require('./client')
const md5File = require('md5-file')
const fs = require('fs')

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
  const md5 = (file.path) ? md5File.sync(file.path) : md5File.sync(file)
  const name = (file.path) ? file.path.split('/').pop() : file.split('/').pop()
  const size = (file.contents) ? file.contents.length : fs.statSync(file)['size']
  const stream = (file.contents) ? file.contents : fs.createReadStream(file)
  const resp = await client.uploadFile({ name, size, md5, stream }, `${userid}/${folder}${name}`)
  return Promise.resolve({ path: resp.path, params: { q: 'auto' } })
}

const fromUrl = async (url) => {
  if (!userid) userid = await userId()
  const resp = await client.uploadRemote(url, `${userid}/${folder}`)
  return Promise.resolve({ path: resp.path, params: { q: 'auto' } })
}

const fromStore = async (path) => {
  if (!userid) userid = await userId()
  return Promise.resolve({ path: `${userid}/${path}`, params: {} })
}

// TODO: Replace params, format param only admited
const toBuffer = async (params, values) => {
  if (params && params.fmt && !values.params.fmt) values.params.fmt = params.fmt
  const data = await client.transformFile(values.path, values.params)
  return data.buffer
}

const toFile = async (path, values) => {
  if (values.params && !values.params.fmt && path.split('.').length) {
    values.params.fmt = path.split('.').pop().toLowerCase()
  }
  const data = await client.transformFile(values.path, values.params)
  fs.writeFileSync(path, data.buffer)
  return Promise.resolve(path)
}

const resize = (params, values) => {
  if (params) {
    if (params.width) values.params.width = params.width
    else delete values.params.width
    if (params.height) values.params.height = params.height
    else delete values.params.height
    if (params.mode) values.params.mode = params.mode
    else delete values.params.mode
  }
  return Promise.resolve(values)
}

const process = (params, values) => {
  if (params) values.params = { ...values.params, ...params }
  return Promise.resolve(values)
}

const remove = (values) => {
  return client.deleteFile(values.path)
}

const Api = (previousActions = Promise.resolve()) => {
  return {
    user: () => previousActions.then(() => user()),
    files: (path) => previousActions.then(() => files(path)),
    fromFile: (path) => Api(previousActions.then(() => fromFile(path))),
    fromUrl: (url) => Api(previousActions.then(() => fromUrl(url))),
    fromStore: (path) => Api(previousActions.then(() => fromStore(path))),
    resize: (params) => Api(previousActions.then(values => resize(params, values))),
    process: (params) => Api(previousActions.then(values => process(params, values))),
    delete: () => previousActions.then(values => remove(values)),
    toBuffer: (params) => previousActions.then(values => toBuffer(params, values)),
    toFile: (filename) => previousActions.then(values => toFile(filename, values))
  }
}

const api = Api()

module.exports = api
