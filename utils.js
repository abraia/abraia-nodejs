module.exports.parseString = (string, params) => {
  String.prototype.interpolate = function (params) {
    const names = Object.keys(params)
    const vals = Object.values(params)
    return new Function(...names, `return \`${this}\`;`)(...vals)
  }
  const template = string.replace(/${/g, '{').replace(/{/g, '${')
  return template.interpolate(params)
}

module.exports.sizeFormat = (bytes = 0, decimals = 2) => {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizes[i]}`
}

const parsePath = (path) => {
  const folder = path.slice(0, path.lastIndexOf('/'));
  const filename = path.slice(folder.length + 1);
  const name = filename.slice(0, filename.lastIndexOf('.'));
  const ext = filename.slice(name.length + 1);
  return { folder, name, ext };
};

module.exports.parseOutput = (path, params) => {
  let { output } = params;
  output = output || '{name}.{ext}';
  let { name, ext } = parsePath(path);
  ext = params.format || ext;
  return this.parseString(output, Object.assign({ name, ext }, params));
};

module.exports.parseQuery = (query) => {
  const params = decodeURIComponent(query).split('&').reduce((prev, curr) => {
    const [name, value] = curr.split('=');
    prev[name] = value;
    return prev;
  }, {});
  return params;
};

module.exports.stringifyParams = (params) => {
  const query = Object.entries(params).map(pair => pair.join('=')).join('&');
  return encodeURI(query).replace(/#/g, '%23');
};

const CSVToMatrix = (csv, delimiter) => {
  const matrix = [];
  csv.split('\n').map(l => (l.trim() === '' ? 0 : matrix.push(l.trim().split(delimiter).map(v => v.trim()))));
  return matrix;
};

const MatrixToJSON = (matrix, from, to) => {
  from = from || 0;
  const jsonResult = matrix.map((a, i) => Object.assign({}, ...matrix[0].map((h, index) => ({ [h]: matrix[i][index] }))));
  return to ? jsonResult.splice(from, to) : jsonResult.splice(from);
};

module.exports.csvToJson = (content) => {
  const matrix = CSVToMatrix(content, ',');
  return MatrixToJSON(matrix, 1);
};

module.exports.parseActionImage = (json) => {
  let path, params;
  if (json.backgroundImage) {
    const [url, query] = json.backgroundImage.src.split('?');
    params = this.parseQuery(query);
    path = url.split('/').slice(4).join('/');
  }
  return { path, params };
};

module.exports.parseActionVideo = (json) => {
  const background = json.background || 'white';
  const videos = json.objects.filter(obj => obj.type === 'video');
  const video = videos.pop();
  let path, params;
  if (video) {
    const { src } = video;
    const width = json.width / json.zoom;
    const height = json.height / json.zoom;
    const videoWidth = video.width * video.scaleX;
    const videoHeight = video.height * video.scaleY;
    const mode = (videoWidth >= width && videoHeight >= height) ? 'crop' : 'pad';
    params = { width, height, mode, background };
    path = src.split('/').slice(4).join('/');
  }
  return { path, params };
};

module.exports.transformActionImage = (path, params, json) => {
  const background = `https://api.abraia.me/images/${path}`;
  if (json.backgroundImage) {
    const [url, query] = json.backgroundImage.src.split('?');
    json.backgroundImage.src = query ? `${background}?${query}` : background;
  } else {
    let id = 0;
    json.objects.forEach((obj) => {
      if (obj.type === 'image' && obj.src.startsWith('http')) {
        const width = Math.round(obj.width * obj.scaleX);
        const height = Math.round(obj.height * obj.scaleY);
        if (id === 0) {
          obj.src = `${background}?width=${width}&height=${height}`;
          obj.cropX = 0;
          obj.cropY = 0;
        }
      }
    });
  }
  return json;
};

// const transformActionVideo = (path, params, json) => {
//   return;
// };
