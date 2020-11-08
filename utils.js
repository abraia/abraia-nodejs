const mime = require('mime')

module.exports.getType = (path = '') => {
  if (path.endsWith('.atn')) return 'application/abraia'
  if (path.endsWith('.m3u8')) return 'application/x-mpegURL'
  return mime.getType(path) || ''
}

module.exports.parseString = (string, params) => {
  String.prototype.interpolate = function (params) {
    const names = Object.keys(params)
    const vals = Object.values(params)
    return new Function(...names, `return \`${this}\``)(...vals)
  }
  const template = string.replace(/${/g, '{').replace(/{/g, '${')
  return template.interpolate(params)
}

module.exports.sizeFormat = (bytes, decimals = 2) => {
  if (bytes === undefined) return '';
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizes[i]}`
}

module.exports.dateFormat = (timestamp) => {
  let strDate = '';
  if (timestamp !== undefined) {
    timestamp = timestamp.toString().length > 12 ? timestamp : timestamp * 1000;
    const date = new Date(timestamp);
    strDate = date.toLocaleString('en-GB', { timeZone: 'UTC' });
  }
  return strDate;
};

module.exports.sortFiles = (files, type) => {
  return files.sort((a, b) => b[type] < a[type] ? -1 : b[type] > a[type] ? 1 : 0);
}

module.exports.parseUrl = (src = '') => {
  const [url, query] = src.split('?')
  return { url, query }
}

module.exports.parsePath = (path = '') => {
  const { url } = this.parseUrl(path)
  const dirname = url.substring(0, url.lastIndexOf('/'))
  const folder = dirname && `${dirname}/`
  const filename = url.substring(folder.length)
  const name = filename.substring(0, filename.lastIndexOf('.')) || filename
  const ext = filename.substring(name.length + 1)
  return { folder, name, ext }
}

module.exports.parseOutput = (path, params) => {
  const output = params.output || '{name}.{ext}'
  let { name, ext } = this.parsePath(path)
  ext = params.format || ext
  return this.parseString(output, Object.assign({ name, ext }, params))
}

module.exports.parseQuery = (query) => {
  return decodeURIComponent(query).split('&').reduce((prev, curr) => {
    const [name, value] = curr.split('=')
    prev[name] = value
    return prev
  }, {})
}

module.exports.stringifyParams = (params) => {
  const query = Object.entries(params).map(pair => pair.join('=')).join('&')
  return encodeURI(query).replace(/#/g, '%23')
}

module.exports.parseActionFonts = (json) => {
  return json.objects.filter(obj => obj.type === 'i-text').map(obj => obj.fontFamily)
}

module.exports.parseActionImage = (json) => {
  if (json.backgroundImage) {
    const { url, query } = this.parseUrl(json.backgroundImage.src)
    const path = url.split('/').slice(4).join('/')
    const params = this.parseQuery(query)
    return { path, params }
  }
  return {}
}

module.exports.parseActionVideo = (json) => {
  const background = json.background || 'white'
  const videos = json.objects.filter(obj => obj.type === 'video')
  const video = videos.pop()
  if (video) {
    const { src } = video
    const width = json.width / json.zoom
    const height = json.height / json.zoom
    const videoWidth = video.width * video.scaleX
    const videoHeight = video.height * video.scaleY
    const mode = (videoWidth >= width && videoHeight >= height) ? 'crop' : 'pad'
    const params = { width, height, mode, background }
    const path = src.split('/').slice(4).join('/')
    return { path, params }
  }
  return {}
}

module.exports.transformActionImage = (path, params, json) => {
  const background = `https://api.abraia.me/images/${path}`
  if (json.backgroundImage) {
    const { query } = this.parseUrl(json.backgroundImage.src)
    json.backgroundImage.src = query ? `${background}?${query}` : background
  } else {
    let id = 0
    json.objects.forEach((obj) => {
      if (obj.type === 'image' && obj.src.startsWith('http')) {
        const width = Math.round(obj.width * obj.scaleX)
        const height = Math.round(obj.height * obj.scaleY)
        if (id === 0) {
          obj.src = `${background}?width=${width}&height=${height}`
          obj.cropX = 0
          obj.cropY = 0
          id += 1
        }
      }
    })
  }
  return json
}

module.exports.transformActionVideo = (path, params, json) => {
  const src = `https://api.abraia.me/files/${path}`
  let id = 0
  json.objects.forEach((obj) => {
    if (obj.type === 'video') {
      if (id === 0) {
        // const width = Math.round(obj.width * obj.scaleX)
        // const height = Math.round(obj.height * obj.scaleY)
        // obj.src = `${background}?width=${width}&height=${height}`
        // obj.cropX = 0
        // obj.cropY = 0
        obj.src = src
        id += 1
      }
    }
  })
  return json
}
