const fs = require('fs')

const Client = require('./client')

const client = new Client()

function fromFile (path) {
  // const file = fs.createReadStream(path)
  return new Promise((resolve, reject) => {
    client.uploadFile(path)
      .then((data) => {
        console.log(data)
        resolve({ path: data.path, params: { q: 'auto' } })
      })
      .catch(err => reject(err))
  })
}

function fromUrl (url) {
  return new Promise((resolve, reject) => {
    resolve({ path: '', params: { url: url, q: 'auto' } })
  })
}

function toFile (path, values) {
  return new Promise((resolve, reject) => {
    client.transformImage(values.path, values.params)
      .then((data) => {
        fs.writeFileSync(path, data)
        resolve(path)
      })
      .catch(err => reject(err))
  })
}

function resize (params, values) {
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

function remove (path) {
  return new Promise((resolve, reject) => {
    client.removeFile(path)
      .then(data => resolve(data))
      .catch(err => reject(err))
  })
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
