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
    var $response = this.$response,
      value = element.getAttribute('globalize-get'),
      isRoot = value[0] == '/' ? true : false,
      setValue = isRoot ? $response[value.substring(1)] : $response.translations[value]
    dom.set(element, setValue)
  },

  conf: function (element) {
    var standard = {
      folder: 'assets/json/globalize',
      language: app.language
    }
    return app.parseConfig('globalize', standard, element)
  },
}