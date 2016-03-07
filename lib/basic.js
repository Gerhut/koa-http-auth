'use strict'

module.exports = function (realm) {
  const challenge = `Basic realm="${realm}"`
  return function * (next) {
    let authorization = this.header['authorization']
    if (authorization != null && authorization.slice(0, 6) === 'Basic ') {
      authorization = new Buffer(authorization.slice(6), 'base64').toString('utf8')
      authorization = authorization.split(':')
      const user = authorization[0]
      const password = authorization[1]
      this.request.auth = {
        user: user,
        password: (test) => test === password
      }
    }

    yield next

    if (this.request.auth == null) {
      this.status = 401
      this.response.set('WWW-Authenticate', challenge)
    }
  }
}
