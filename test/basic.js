/* eslint-env mocha */

'use strict'

const koa = require('koa')
const supertest = require('supertest')
const BasicAuth = require('..').Basic

describe('Basic Access Authentication', function () {
  const app = koa()

  before(function () {
    app.use(BasicAuth('koa-http-auth'))
    app.use(function * (next) {
      if (this.request.auth &&
        this.request.auth.user === 'koa-http-auth.userid' &&
        this.request.auth.password('koa-http-auth.password')) {
        yield next
      } else {
        delete this.request.auth
        this.body = 'Unauthorized'
      }
    })
    app.use(function * () {
      this.body = 'Authenticated'
    })
  })

  it('should response Unauthorized without authorization', function (done) {
    supertest(app.listen())
      .get('/')
      .expect(401)
      .expect('WWW-Authenticate', 'Basic realm="koa-http-auth"')
      .end(done)
  })

  it('should response Unauthorized with wrong authorization', function (done) {
    supertest(app.listen())
      .get('/')
      .auth('koa-http-auth.userid', 'koa-http-auth.wrongpassword')
      .expect(401)
      .expect('WWW-Authenticate', 'Basic realm="koa-http-auth"')
      .end(done)
  })

  it('should response content with correct authorization', function (done) {
    supertest(app.listen())
      .get('/')
      .auth('koa-http-auth.userid', 'koa-http-auth.password')
      .expect(200)
      .expect('Authenticated')
      .end(done)
  })
})
