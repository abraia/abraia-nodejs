#!/usr/bin/env node
const program = require('commander')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

const abraia = require('./abraia')

program
  .version('0.1.0')
  .description('Abraia image optimization tool')
  .arguments('<impath>')
  .action(function (impath) {
    if (fs.lstatSync(impath).isFile()) {
      const extname = path.extname(impath)
      const basename = path.basename(impath, extname)
      const filePath = basename + '_o' + extname
      console.log(`Uploading: ${impath}`)
      abraia.fromFile(impath).toFile(filePath)
      console.log(`Optimized: ${filePath}`)
    }
    if (fs.lstatSync(impath).isDirectory()) {
      const dirname = impath.replace(/\/$/, '') + '_o'
      try {
        fs.mkdirSync(dirname)
      } catch (err) {
        if (err.code !== 'EEXIST') throw err
      }
      glob(path.join(impath, '*.{png,gif,jpg,jpeg}'), function (er, files) {
        for (let filename of files) {
          const filePath = path.join(dirname, path.basename(filename))
          console.log(`Uploading: ${filename}`)
          abraia.fromFile(filename).toFile(filePath)
          console.log(`Optimized: ${filePath}`)
        }
      })
    }
  })
  .parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit()
}
