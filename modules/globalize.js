'use strict'

app.module.globalize = {

/**
 * Autoloads the globalize configuration for a specified script element.
 * @function _autoload
 * @memberof app.module.globalize
 * @param {HTMLElement} scriptElement - The script element to load the configuration for.
 * @param {Object} options - The options object with the onload callback.
 * @private
 */
  _autoload: function (test, options) {
    var config = this.conf(options.element)
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