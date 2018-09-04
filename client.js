const btoa = require('btoa')
const axios = require('axios')
const request = require('request')
const fs = require('fs')

const API_URL = 'https://api.abraia.me'

class Client {
  constructor () {
    const apiKey = process.env.ABRAIA_API_KEY
    const apiSecret = process.env.ABRAIA_API_SECRET
    if ((apiKey !== undefined) && (apiSecret !== undefined)) {
      this.setApiKeys(apiKey, apiSecret)
    }
  }

  setApiKeys (apiKey, apiSecret) {
    const AUTH_TOKEN = 'Basic ' + btoa(apiKey + ':' + apiSecret)
    axios.defaults.headers.common['Authorization'] = AUTH_TOKEN
  }

  listFiles (path = '') {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/images/${path}`)
        .then(resp => {
          const { files, folders } = resp.data
          for (const i in folders) {
            folders[i].path = folders[i].source
            folders[i].source = `${API_URL}/images/${folders[i].source}`
          }
          for (const i in files) {
            files[i].path = files[i].source
            files[i].source = `${API_URL}/images/${files[i].source}`
            files[i].thumbnail = `${API_URL}/images/${files[i].thumbnail}`
          }
          resolve({ files, folders })
        })
        .catch(err => reject(err))
    })
  }

  uploadFile (file, path = '', type = '', callback = undefined) {
    let loaded = 0
    const total = fs.statSync(file)['size']
    const source = path.endsWith('/') ? path.slice(0, -1) : path
    const name = (path === '') ? file.split('/').pop() : source.split('/').pop()
    return new Promise((resolve, reject) => {
      request.post({
        url: `${API_URL}/files/${path}`,
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization']
        },
        body: { name, type },
        json: true
      }, (err, resp, body) => {
        if (err) console.log(err)
        if (resp.statusCode === 200) {
          const uploadURL = body.uploadURL
          const stream = fs.createReadStream(file)
          stream.pipe(request.put({
            url: uploadURL,
            headers: {
              'Content-Length': total
            }
          }, (err, resp, body) => {
            if (err) reject(err)
            if (resp.statusCode === 200) {
              resolve({
                name: name,
                path: source,
                source: `${API_URL}/files/${source}`,
                thumbnail: `${API_URL}/files/${source.slice(0, -name.length) + 'tb_' + name}`
              })
            } else {
              reject(resp)
            }
          }))
          stream.on('data', (chunk) => {
            loaded += chunk.length
            if (callback instanceof Function) callback({ loaded, total })
          })
        } else {
          reject(resp)
        }
      })
    })
  }

  downloadFile (path, callback = undefined) {
    // const query = Object.entries(params).map(pair => pair.join('=')).join('&')
    // const parsed = encodeURI(query).replace('#', '%23')
    // console.log(query)
    // const fullPath = query.length ? `${API_URL}/images/${path}?${parsed}` : `${API_URL}/images/${path}`
    // console.log(fullPath)
    let total = undefined
    let loaded = 0
    return new Promise((resolve, reject) => {
      request.get({
        url: `${API_URL}/files/${path}`,
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization']
        },
        encoding: null
      }, (err, resp, buffer) => {
        if (err) reject(err)
        resolve(buffer)
      }).on('data', (chunk) => {
        loaded += chunk.length
        if (callback instanceof Function) callback({ loaded, total })
      }).on('response', (resp) => {
        if (resp.statusCode !== 200) reject(resp)
        total = resp.headers['content-length']
      })
    })
  }

  removeFile (path) {
    return new Promise((resolve, reject) => {
      axios.delete(`${API_URL}/files/${path}`)
        .then(resp => {
          const file = resp.data.file
          //file.path = file.source
          //file.source = `${API_URL}/files/${file.source}`
          //resolve(file)
          resolve(file)
        })
        .catch(err => reject(err))
    })
  }

  transformImage (path, params = {}) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/images/${path}`, { params, responseType: 'arraybuffer' })
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }

  analyzeImage (path, params = {}) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/analysis/${path}`, {
        params
      }).then((resp) => {
        if (resp.status === 200) {
          resolve({ status: 'success', result: resp.data.result })
        } else {
          resolve({ status: 'error', error: 'error processing the image' })
        }
      }).catch(err => reject({ status: 'error', error: err }))
    })
  }

  aestheticsImage (path) {
    return new Promise((resolve, reject) => {
      axios.get(`${API_URL}/aesthetics/${path}`)
        .then(resp => resolve(resp.data))
        .catch(err => reject(err))
    })
  }
}

module.exports = Client
