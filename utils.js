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
