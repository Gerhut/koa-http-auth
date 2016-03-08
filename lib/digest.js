'use strict'

const assert = require('assert')
const crypto = require('crypto')

const randomHexString = (bytes) => crypto.randomBytes(bytes).toString('hex')
const md5 = (data) => crypto.createHash('md5').update(data).digest('hex')
const unquote = (string) => string.match(/^"(.*)"$/)[1]

/**
 * Equal-Comma-ize an object into a string.
 */
const ECize = (object) => Object.keys(object)
  .map((key) => `${key}=${object[key]}`).join(',')

/**
 * un-Equal-Comma-ize a string into an object.
 */
const unECize = (string, keys) => {
  const object = Object.create(null)
  string.split(',').forEach((keyValue) => {
    keyValue = keyValue.trim()

    const index = keyValue.indexOf('=')
    if (index === -1) return

    const key = keyValue.slice(0, index)
    const value = keyValue.slice(index + 1)
    if (keys.indexOf(key) === -1) return

    object[key] = value
  })
  return object
}

module.exports = function (realm) {
  return function * (next) {
    let authorization = this.header['authorization']
    if (authorization != null && authorization.slice(0, 7) === 'Digest ') {
      try {
        const digestResponse = unECize(authorization.slice(7), [
          'username', 'realm', 'nonce', 'uri', 'response'
        ])

        digestResponse.username = unquote(digestResponse.username)
        digestResponse.realm = unquote(digestResponse.realm)
        digestResponse.nonce = unquote(digestResponse.nonce)
        digestResponse.uri = unquote(digestResponse.uri)
        digestResponse.response = unquote(digestResponse.response)

        assert(digestResponse.uri === this.originalUrl)
        assert(digestResponse.realm === realm)

        this.request.auth = {
          user: digestResponse.username,
          password: (test) => {
            return md5(`${
              md5(`${digestResponse.username}:${realm}:${test}`)
            }:${digestResponse.nonce}:${
              md5(`${this.method}:${this.originalUrl}`)
            }`) === digestResponse.response
          }
        }
      } catch (e) {
        delete this.request.auth
      }
    }

    yield next

    if (this.request.auth == null) {
      this.status = 401
      this.set('WWW-Authenticate', 'Digest ' + ECize({
        realm: `"${realm}"`,
        nonce: `"${randomHexString(8)}"`
      }))
    }
  }
}
