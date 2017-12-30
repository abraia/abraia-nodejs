const fs = require('fs')
const btoa = require('btoa')
const request = require('request-promise')

const config = require('./config')

const {apiKey, apiSecret} = config.loadAuth()
const authRequest = request.defaults({
  headers: {'Authorization': 'Basic ' + btoa(apiKey + ':' + apiSecret)}
})

// + var fileSize = fs.statSync(file).size;
// + var fileStream = fs.createReadStream(file);
// + var barOpts = {
// +   width: 20,
// +   total: fileSize,
// +   clear: true
// + };
// + var bar = new ProgressBar(' uploading [:bar] :percent :etas', barOpts);
// +
// + fileStream.on('data', function (chunk) {
// +   bar.tick(chunk.length);
// + });

class Client {
  constructor () {
    this._url = ''
    this._params = {}
    this._promise = undefined
  }

  fromFile (filename) {
    const url = config.apiUrl + '/images'
    const formData = {file: fs.createReadStream(filename)}
    this._promise = authRequest.post({url, formData})
      .then(body => {
        const resp = JSON.parse(body)
        console.log('Uploaded ', filename)
        this._url = config.apiUrl + '/images/' + resp['filename']
        this._params = {q: 'auto'}
      })
      .catch(err => {
        console.error('upload failed:', err)
      })
    return this
  }

  fromUrl (url) {
    this._url = config.apiUrl + '/images'
    this._params = {url: url, q: 'auto'}
    return this
  }

  toFile (filename) {
    this._promise = Promise.all([this._promise]).then(() => {
      authRequest.get({url: this._url, qs: this._params})
        .on('error', (err) => console.log(err))
        .pipe(fs.createWriteStream(filename))
        .on('finish', () => console.log('Downloaded ', filename))
    })
    return this
  }

  resize (params) {
    this._promise = Promise.all([this._promise]).then(() => {
      if (params.width !== undefined) {
        this._params.w = params.width
      }
      if (params.height !== undefined) {
        this._params.h = params.height
      }
    })
    return this
  }
}

module.exports = {
  fromFile (path) {
    return new Client().fromFile(path)
  },

  fromUrl (url) {
    return new Client().fromUrl(url)
  },

  Client
}
