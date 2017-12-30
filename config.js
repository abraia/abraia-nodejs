const os = require('os')
const fs = require('fs')
const path = require('path')

const configFile = path.join(os.homedir(), '.abraia')

const config = {
  apiUrl: 'https://abraia.me/api',

  loadAuth: function () {
    const apiKey = process.env.ABRAIA_API_KEY
    const apiSecret = process.env.ABRAIA_API_SECRET
    const config = {apiKey, apiSecret}
    if (fs.existsSync(configFile) && (apiKey === undefined || apiSecret === undefined)) {
      const lines = fs.readFileSync(configFile).toString().split('\n')
      lines.map(line => {
        const [key, value] = line.split(':').map(v => v.trim())
        if (key === 'abraia_api_key') config.apiKey = value
        if (key === 'abraia_api_secret') config.apiSecret = value
      })
    }
    return config
  },

  saveAuth: function ({apiKey, apiSecret}) {
    const content = `abraia_api_key: ${apiKey}\n` +
      `abraia_api_secret: ${apiSecret}\n`
    fs.writeFileSync(configFile, content, (err) => {
      if (err) throw err
    })
  }
}

module.exports = config
