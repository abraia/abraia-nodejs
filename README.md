[![npm version](https://badge.fury.io/js/abraia.svg)](https://badge.fury.io/js/abraia)
[![Build Status](https://travis-ci.org/abraia/abraia-nodejs.svg)](https://travis-ci.org/abraia/abraia-nodejs)
[![Coverage Status](https://coveralls.io/repos/github/abraia/abraia-nodejs/badge.svg?branch=master)](https://coveralls.io/github/abraia/abraia-nodejs?branch=master)

# Abraia API client for Node.js

Node.js client for [Abraia](https://abraia.me) services. It is used to
intelligently transform and optimize (compress) images for web. Read more at
[https://abraia.me/docs](https://abraia.me/docs).

## Installation

Install the API client:

```
npm install --save abraia
```

## Usage

You just need to defiene the API Keys as environment variables (ABRAIA_API_KEY and
ABRAIA_API_SECRET) and use the fluent API.

```js
const abraia = require('abraia/abraia')

abraia.fromFile('images/tiger.jpg')
  .resize({ width: 333, height: 333 })
  .toFile('images/tiger_333x333.jpg')

abraia.fromUrl('https://abraia.me/images/random.jpg')
  .resize({ width: 600 })
  .toFile('images/random_600.jpg')

abraia.fromStore('demo/birds.jpg')
  .toFile('images/birds.jpg')
```

<center>![Resized tiger image](images/tiger_503x333.jpg)
![Smart cropped tiger](images/tiger_333x333.jpg)</center>

## License

This software is licensed under the MIT License. [View the license](LICENSE).
