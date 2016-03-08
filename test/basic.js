/* eslint-env mocha */

'use strict'

const http = require('http')
const should = require('should')
const koa = require('koa')
const request = require('request')
const BasicAuth = require('..').Basic

describe('Basic Access Authentication', function () {
  const app = koa()
  const server = http.createServer()
  let uri

  before(function (done) {
    app.use(BasicAuth('koa-http-auth'))
    app.use(function * (next) {
      if (this.request.auth &&
        this.request.auth.user === 'koa-http-auth.userid' &&
        this.request.auth.password('koa-http-auth:password')) {
        yield next
      } else {
        delete this.request.auth
        this.body = 'Unauthorized'
      }
    })
    app.use(function * () {
      this.body = 'Authenticated'
    })

    server.on('request', app.callback())
    server.listen(0, function (err) {
      if (err) return done(err)
      uri = `http://127.0.0.1:${server.address().port}/`
      done()
    })
  })

  after(function (done) {
    server.close(done)
  })

  it('should response Unauthorized without authorization', function (done) {
    request(uri, (err, response, body) => {
      if (err) return done(err)

      should(response.statusCode).be.equal(401)
      response.headers.should.have.property(
        'www-authenticate', 'Basic realm="koa-http-auth"')
      done()
    })
  })

  it('should response Unauthorized with wrong authorization', function (done) {
    request({
      uri: uri,
      auth: {
        user: 'koa-http-auth.userid',
        password: 'koa-http-auth.wrongpassword'
      }
    }, (err, response, body) => {
      if (err) return done(err)

      should(response.statusCode).be.equal(401)
      response.headers.should.have.property(
        'www-authenticate', 'Basic realm="koa-http-auth"')
      done()
    })
  })

  it('should response content with correct authorization', function (done) {
    request({
      uri: uri,
      auth: {
        user: 'koa-http-auth.userid',
        password: 'koa-http-auth:password'
      }
    }, (err, response, body) => {
      if (err) return done(err)

      should(body).be.equal('Authenticated')
      done()
    })
  })
})
