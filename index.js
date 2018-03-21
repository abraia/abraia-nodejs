#!/usr/bin/env node
const ProgressBar = require('progress')
const program = require('commander')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

const abraia = require('./abraia/abraia').api
const config = require('./abraia/config')

function prompt (question, callback) {
  process.stdin.resume()
  process.stdout.write(question)
  process.stdin.once('data', function (data) {
    callback(data.toString().trim())
  })
}

function processBatch (impath, {width, height}) {
  if (fs.lstatSync(impath).isFile()) {
    const extname = path.extname(impath)
    const basename = path.basename(impath, extname)
    const filePath = basename + '_o' + extname
    abraia.fromFile(impath).resize({ width, height }).toFile(filePath)
    console.log(`Optimizing: ${filePath}`)
  }

  if (fs.lstatSync(impath).isDirectory()) {
    const dirname = impath.replace(/\/$/, '') + '_o'
    try {
      fs.mkdirSync(dirname)
    } catch (err) {
      if (err.code !== 'EEXIST') throw err
    }
    glob(path.join(impath, '*.{jpg,jpeg,png,gif,webp}'), function (er, files) {
      const bar = new ProgressBar('Processing [:bar] :percent :etas', {
        width: 55, total: files.length
      })
      for (let filename of files) {
        const fileSize = (fs.statSync(filename).size / 1024).toFixed(1)
        const filePath = path.join(dirname, path.basename(filename))
        abraia.fromFile(filename).resize({ width, height }).toFile(filePath)
        console.log(`Optimizing: ${fileSize}KB (${path.basename(filename)})`)
        bar.tick()
      }
    })
  }
}

program
  .version('0.1.3')
  .description('Abraia image optimization tool')

program
  .command('configure')
  .description('configure the access keys')
  .action(function () {
    let {apiKey, apiSecret} = config.loadAuth()
    prompt(`Abraia Api Key [${apiKey}]: `, function (input) {
      apiKey = input === '' ? apiKey : input
      prompt(`Abraia Api Secret [${apiSecret}]: `, function (input) {
        apiSecret = input === '' ? apiSecret : input
        config.saveAuth({apiKey, apiSecret})
        process.exit()
      })
    })
  })

program
  .command('optimize <impath>')
  .description('optimize the image or directory of images')
  .action(impath => processBatch(impath, {width: undefined, height: undefined}))

program
  .command('resize <impath>')
  .description('resize the image or directory of images')
  .option('--width <width>', 'requested image width', parseInt)
  .option('--height <height>', 'requested image height', parseInt)
  .action((impath, options) => processBatch(impath, options))

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit()
}
