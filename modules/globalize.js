'use strict'

app.module.globalize = {

  /**
   * @function _autoload
   * @memberof app.module.globalize
   * @param {HTMLElement} scriptElement - The script element to load the configuration for.
   * @param {Object} options - The options object with the onload callback.
   * @desc Autoloads the globalize configuration for a specified script element.
   * @private
   */
  _autoload: function (options) {
    var config = app.config.get('globalize', {
      folder: 'assets/json/globalize',
      language: app.language
    }, options.element)

    app.xhr.get({
      url: [config.folder + '/' + config.language + '.json'],
      response: 'globalize',
      onload: options.onload
    })
  },

  /**
   * @function get
   * @memberof app.module.globalize
   * @param {HTMLElement} element - The element to set the globalized value to.
   * @desc Gets the globalized value and set it to the element.
   */
  get: function (element) {
    var $response = this.$response,
      value = element.getAttribute('globalize-get'),
      isRoot = value[0] == '/' ? true : false,
      setValue = isRoot ? $response.data[value.substring(1)] : $response.data.translations[value]
    dom.set(element, setValue)
  }
}