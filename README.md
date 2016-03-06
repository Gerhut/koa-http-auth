# koa-http-auth

Simple [HTTP Authentication](https://tools.ietf.org/html/rfc2617) middleware
of koa

## Install

    $ npm install koa-http-auth

## Usage

```javascript
const koa = require('koa')
const BasicAuth = require('koa-http-auth').Basic

const app = koa()
app.use(BasicAuth('Simple Application'))

app.use(function * (next) {
  if (this.request.auth == null) { // No authorization provided
    this.body = 'Please log in.'
    return // Middleware will auto give 401 response
  }

  if (this.request.auth.userid !== 'user' ||
    this.request.auth.password !== 'password') {
    this.body = 'Invalid user.'
    delete this.request.auth // Delete request.auth ...
    return // ... will make middleware give 401 response too.
  }

  this.body = 'Welcome back!'
  yield next
})
```
