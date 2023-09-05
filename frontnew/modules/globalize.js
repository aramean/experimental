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
    this.module = options.name
    var query = app.querystrings.get(false, 'locale')
    if (query) this.locale.set(query)

    var config = app.config.get(this.module, {
      store: true,
      folder: 'assets/json/' + this.module,
      language: this.locale.get(query),
    }, options.element),
      storeKey = this.module + '.' + config.language

    if (app.storage.get(storeKey)) {
      this.responseData = app.storage.get(storeKey)
    } else {
      app.vars.totalStore++
      app.xhr.get({
        url: app.script.path + config.folder + '/' + config.language + '.json',
        response: this.module,
        type: 'var',
        cache: { 
          format: 'json',
          type: 'localstorage',
          key: storeKey,
          ttl: 300
        }
      })
    }
  },

  locale: {
    get: function (query) {
      var storedLanguage = app.storage.get(this.module + '.language'),
        language = storedLanguage || query || app.language
      return language
    },

    set: function (language) {
      app.storage.set(this.module + '.language', language)
    }
  },

  /**
   * @function get
   * @memberof app.module.globalize
   * @param {HTMLElement} element - The element to set the globalized value to.
   * @desc Gets the globalized value and set it to the element.
   */
  get: function (element) {
    var responseData = this.responseData,
      value = element.getAttribute(this.module + '-get'),
      isRoot = value[0] == '/' ? true : false,
      setValue = isRoot ? responseData.data[value.substring(1)] : responseData.data.translations[value]
    dom.set(element, setValue)
  }
}