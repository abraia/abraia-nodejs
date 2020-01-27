[![Npm Version](https://img.shields.io/npm/v/abraia.svg?style=flat-square)](https://www.npmjs.com/package/abraia)
[![Build Status](https://img.shields.io/travis/abraia/abraia-nodejs.svg?style=flat-square)](https://travis-ci.org/abraia/abraia-nodejs)
[![Coverage Status](https://img.shields.io/coveralls/github/abraia/abraia-nodejs.svg?style=flat-square)](https://coveralls.io/github/abraia/abraia-nodejs)

# Abraia API client for Node.js

Node.js client for [Abraia](https://abraia.me) services, focus on image and
video optimization for fashion ecommerce and multichannel marketing.

- [Image optimization for web](https://abraia.me/docs/image-optimization).
- [Video optimization for web](https://abraia.me/docs/video-optimization).

Get the best image and video quality with the minimal file size.

## Installation

Install the API client:

```sh
npm install --save abraia
```

Get your [free API key](https://abraia.me/docs/getting-started) and set the
`ABRAIA_KEY` environment variable every time you start a terminal/console
session. On Windows, use `set` instead of `export`.

```sh
export ABRAIA_KEY=your_api_key
```

For a persistent configuration use your system options to set your `ABRAIA_KEY`.

## Optimizing images

Using the fluent API, to optimize your images you just need to specify the input
and output file name, and the image will be smartly optimized for a web best
performance.

```js
const abraia = require('abraia/abraia')

abraia.fromFile('images/lion.jpg').toFile('images/optimized.jpg')
```

For instance, the previous code significantly reduces the JPEG image file size
from 470kB to 264kB using our content-aware compression algorithm.

You can also optimize PNG, GIF and WebP images, or convert them from one format
to another just changing the file name extension.

```js
abraia.fromFile('images/jaguar.png').toFile('images/jaguar8.png')
abraia.fromFile('images/jaguar.png').toFile('images/jaguar.jpg')
```

![PNG jaguar](https://github.com/abraia/abraia-nodejs/raw/master/images/jaguar.png)
![PNG8 jaguar](https://github.com/abraia/abraia-nodejs/raw/master/images/jaguar8.png)
![JPEG jaguar](https://github.com/abraia/abraia-nodejs/raw/master/images/jaguar.jpg)

This automatically optimizes the PNG image from 45KB to 15.8KB or convert it to
JPEG (14.1KB) with a white background replacing the transparent one.

## Resizing and cropping images

Moreover, Abraia services implement high quality resize and [smart cropping](
https://abraia.me/docs/smart-cropping) options. You can automatically resize and
crop your images just specifying the demanded image size.

```js
abraia.fromFile('images/tiger.jpg')
  .resize({ width: 333, height: 333 })
  .toFile('images/tiger_333x333.jpg')
```

![Resized tiger image](https://github.com/abraia/abraia-nodejs/raw/master/images/tiger_503x333.jpg)
![Smart cropped tiger](https://github.com/abraia/abraia-nodejs/raw/master/images/tiger_333x333.jpg)

*Tiger image smart cropped to a square of 333x333 pixels*

For a typical image resizing you just need to specify the width or the height of
the final image.

```js
abraia.fromFile('images/tiger.jpg')
  .resize({ height: 333 })
  .toFile('images/tiger_x333.jpg')
```

![Resized tiger image](https://github.com/abraia/abraia-nodejs/raw/master/images/tiger_x333.jpg)

*Tiger image resized to a height of 333 pixels*

## Editing and branding images

Abraia implements a [graphical web editor](https://abraia.me/console/) to work with templates,
which enables full image editing automation.

```js
abraia.fromFile('images/tiger.jpg')
  .process({ action: 'test.atn' })
  .toFile('images/tiger_brand.jpg')
```

![Branded tiger image](https://github.com/abraia/abraia-nodejs/raw/master/images/tiger_brand.jpg)

## License

This software is licensed under the MIT License. [View the license](LICENSE).
