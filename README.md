[![npm version](https://badge.fury.io/js/abraia.svg)](https://badge.fury.io/js/abraia)
[![Build Status](https://travis-ci.org/abraia/abraia-nodejs.svg)](https://travis-ci.org/abraia/abraia-nodejs)
[![Coverage Status](https://coveralls.io/repos/github/abraia/abraia-nodejs/badge.svg)](https://coveralls.io/github/abraia/abraia-nodejs)

# Abraia API client for Node.js

Node.js client for [Abraia](https://abraia.me) services. It is used to
intelligently transform and optimize (compress) images for web. Read more at
[https://abraia.me/docs](https://abraia.me/docs).

## Installation

Install the API client:

```sh
npm install --save abraia
```

And define the API Keys as environment variables (`ABRAIA_API_KEY` and
`ABRAIA_API_SECRET`).

```sh
export ABRAIA_API_KEY=your_api_key
export ABRAIA_API_SECRET=your_api_secret
```

## Optimizing images

Optimizing images can be directly performed using the fluent API, without
the need to know anything about image formats and parameters.

```js
const abraia = require('abraia/abraia')

abraia.fromFile('images/lion.jpg').toFile('images/optimized.jpg')
```

This significantly reduces the JPEG image file size from 470kB to 264kB
using our content-aware compression algorithm.

## Resizing images

By default, you can automatically resize and crop your images just specifying the demanded image size.

```js
abraia.fromFile('images/tiger.jpg')
  .resize({ width: 333, height: 333 })
  .toFile('images/tiger_333x333.jpg')
```

![Resized tiger image](https://github.com/abraia/abraia-nodejs/raw/master/images/tiger_503x333.jpg)
![Smart cropped tiger](https://github.com/abraia/abraia-nodejs/raw/master/images/tiger_333x333.jpg)

*Tiger image smart cropped to a square of 333x333 pixels*

Or just resize them specifying the width or the height of the image.

```js
abraia.fromFile('images/tiger.jpg')
  .resize({ height: 333 })
  .toFile('images/tiger_x333.jpg')
```

![Resized tiger image](https://github.com/abraia/abraia-nodejs/raw/master/images/tiger_x333.jpg)

*Tiger image resized to a height of 333 pixels*

## License

This software is licensed under the MIT License. [View the license](LICENSE).
