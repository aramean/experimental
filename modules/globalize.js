'use strict'

app.module.globalize = {

  _autoload: function (element, options) {
    var config = this.conf(element)
    app.xhr({
      url: [config.folder + '/' + config.language + '.json'],
      response: 'globalize',
      onload: options.onload
    })
  },

  _run: function (response) {
    //this._conf.xhr = JSON.parse(response)
    //var test = dom.get('html [globalize-get]')
    //this._conf.xhr = response
    //console.dir(response)
  },

  get: function () {
    console.warn(this.test)
  },

  conf: function (element) {
    var standard = {
      folder: 'assets/json/globalize',
      language: app.language
    }
    return app.parseConfig('globalize', standard, element)
  },
}