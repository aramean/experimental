'use strict'

app.module.globalize = {

  _autoload: function (scriptElement) {
    var config = this.conf(scriptElement)
    console.warn(config)
    app.xhr({
      url: [config.folder + '/' + config.language + '.json'],
    })
  },

  conf: function (element) {
    var standard = {
      folder: 'assets/json/globalize',
      language: app.language
    }
    return app.parseConfig('globalize', standard, element)
  },
}