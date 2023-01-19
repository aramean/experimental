'use strict'

app.module.globalize = {

  _autoload: function (scriptElement, options) {
    var config = this.conf(scriptElement)
    app.xhr({
      url: [config.folder + '/' + config.language + '.json'],
      response: 'globalize',
      onload: options.onload
    })
  },

  get: function (element) {
    var value = element.getAttribute('globalize-get')
    dom.set(element, this.test.translations[value])
  },

  conf: function (element) {
    var standard = {
      folder: 'assets/json/globalize',
      language: app.language
    }
    return app.parseConfig('globalize', standard, element)
  },
}