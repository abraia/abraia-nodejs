const fs = require('fs')

const Client = require('./client')
const config = require('./config')

const {apiKey, apiSecret} = config.loadAuth()
const client = new Client(apiKey, apiSecret)

// toFile (filename) {
//   this._promise = Promise.all([this._promise]).then(() => {
//     authRequest.get({url: this._url, qs: this._params})
//     .on('error', (err) => console.log(err))
//     .pipe(fs.createWriteStream(filename))
//     .on('finish', () => console.log('Downloaded ', filename))
//   })
// }

function fromFile (path) {
  return new Promise((resolve, reject) => {
    client.uploadFile(path)
      .then((data) => {
        console.log('Uploaded ', path)
        resolve({
          url: config.apiUrl + '/images/' + data['filename'],
          params: { q: 'auto' }
        })
      })
      .catch((err) => {
        console.log(err.message)
        reject(err)
      })
  })
}

function fromUrl (url) {
  return new Promise((resolve, reject) => {
    resolve({
      url: config.apiUrl + '/images',
      params: { url: url, q: 'auto' }
    })
  })
}

function toFile (filename, data) {
  return new Promise((resolve, reject) => {
    client.downloadFile(data.url, data.params)
      .then((data) => {
        fs.writeFileSync(filename, data)
        console.log('Downloaded ', filename)
        resolve(filename)
      })
      .catch(err => reject(err))
  })
}

function resize (params, data) {
  return new Promise((resolve) => {
    if (params.width !== undefined) {
      data.params.w = params.width
    }
    if (params.height !== undefined) {
      data.params.h = params.height
    }
    resolve(data)
  })
}

function remove (url) {
  return new Promise((resolve, reject) => {
    client.deleteFile(url)
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
exports.api = api
