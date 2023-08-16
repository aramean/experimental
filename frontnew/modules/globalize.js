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
    var query = app.querystrings.get(false, 'locale')
    if (query) this.locale.set(query)

    var config = app.config.get('globalize', {
      store: true,
      folder: 'assets/json/globalize',
      language: this.locale.get(query),
    }, options.element),
      storeKey = 'globalize.' + config.language

    if (app.storage.get(storeKey)) {
      this.$response = app.storage.get(storeKey)
      app.attributes.run()
    } else {
      app.xhr.get({
        url: [config.folder + '/' + config.language + '.json'],
        response: 'globalize',
        store: storeKey,
        onload: options.onload
      })
    }
  },

  locale: {
    get: function (query) {
      var storedLanguage = app.storage.get('globalize.language'),
        language = storedLanguage || query || app.language
      return language
    },

    set: function (language) {
      app.storage.set('globalize.language', language)
    }
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