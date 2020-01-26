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
