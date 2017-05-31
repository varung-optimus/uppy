'use strict'

require('whatwg-fetch')

/**
 * FTP Plugin
 */
module.exports = class Ftp {
  constructor (opts = {}, params = {}) {
    this.params = Object.assign({}, params)

    // merge default options with the ones set by user
    this.opts = Object.assign({}, opts)
  }

  init () {
  }

  // Get files from FTP service
  list() {
    let headers = new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + this.opts.bearerToken
    })

    let request = new Request(this.opts.host + this.opts.getFilesUrl, {
      method: 'get',
      headers: headers
    });

    return fetch(request)
    .then((res) => {
      return res.json()
    })
  }
}
