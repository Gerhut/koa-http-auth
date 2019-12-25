'use strict'

module.exports = function (realm) {
  const challenge = `Basic realm="${realm}"`
  return function * (next) {
    let authorization = this.header['authorization']
    if (authorization != null && authorization.slice(0, 6) === 'Basic ') {
      authorization = Buffer.from(authorization.slice(6), 'base64').toString('utf8')
      const splitIndex = authorization.indexOf(':')
      if (splitIndex > -1) {
        const user = authorization.slice(0, splitIndex)
        const password = authorization.slice(splitIndex + 1)
        this.request.auth = {
          user: user,
          password: (test) => test === password
        }
      }
    }

    yield next

    if (this.request.auth == null) {
      this.status = 401
      this.response.set('WWW-Authenticate', challenge)
    }
  }
}
