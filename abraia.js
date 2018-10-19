const path = require('path')
const fs = require('fs')

const Client = require('./client')

const client = new Client()
let userid

const fromFile = async (file) => {
  // const file = fs.createReadStream(path)
  if (!userid) userid = await client.check()
  const basename = file.split('/').pop()
  // console.log(path.join(userid, basename))
  return new Promise((resolve, reject) => {
    client.uploadFile(file, path.join(userid, basename)) //, 'image/jpeg')
      .then(resp => resolve({ path: resp.path, params: { q: 'auto' } }))
      .catch(err => reject(err))
  })
}

const fromUrl = (url) => {
  return new Promise((resolve, reject) => {
    resolve({ path: '', params: { url: url, q: 'auto' } })
  })
}

const toFile = (path, values) => {
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
    if (params.width !== undefined) {
      values.params.w = params.width
    }
    if (params.height !== undefined) {
      values.params.h = params.height
    }
    if (params.mode !== undefined) {
      values.params.m = params.mode
    }
    resolve(values)
  })
}

const remove = (path) => {
  return client.removeFile(path)
}

const Api = (previousActions = Promise.resolve()) => {
  return {
    listFiles: (callback) => Api(previousActions.then(listFiles).then(data => callback(data))),
    fromFile: (path) => Api(previousActions.then(() => fromFile(path))),
    fromUrl: (url) => Api(previousActions.then(() => fromUrl(url))),
    resize: (params) => Api(previousActions.then(data => resize(params, data))),
    remove: () => Api(previousActions.then(data => remove(data.url))),
    toFile: (filename) => Api(previousActions.then(data => toFile(filename, data))),
    then: (callback) => Api(previousActions.then(data => callback(data)))
  }
}

const api = Api()

module.exports = api
