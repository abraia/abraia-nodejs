#!/usr/bin/env node
const ProgressBar = require('progress')
const program = require('commander')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

const abraia = require('./abraia')

program
  .version('0.1.2')
  .description('Abraia image optimization tool')
  .arguments('<impath>', 'path of image or directory of images to process')
  .option('--width <width>', 'requested image width', parseInt)
  .option('--height <height>', 'requested image height', parseInt)
  .action(function (impath, options) {
    const { width, height } = options
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
      glob(path.join(impath, '*.{jpg,jpeg,png,gif,webp}'), function (er, files) {
        const bar = new ProgressBar('Processing [:bar] :percent :etas', {
          width: 40, total: files.length
        })
        for (let filename of files) {
          const fileSize = fs.statSync(filename).size
          const filePath = path.join(dirname, path.basename(filename))
          console.log(`${filename} -> ${fileSize}`)
          abraia.fromFile(filename).resize({ width, height }).toFile(filePath)
          console.log(`Optimized: ${filePath}`)
          bar.tick()
        }
      })
    }
  })
  .parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit()
}
