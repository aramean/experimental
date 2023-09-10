'use strict'

app.module.globalize = {

  storageType: 'local',

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
    }, options.element)

    console.dir(options.element)
    
    this.storeKey = this.module + '.' + config.language

    if (app.caches.get(this.storageType, this.storeKey)) {
      this.responseData = app.caches.get(this.storageType, this.storeKey)
    } else {
      app.vars.totalStore++
      app.xhr.get({
        url: app.script.path + config.folder + '/' + config.language + '.json',
        response: this.module,
        type: 'var',
        cache: {
          format: 'json',
          type: this.storageType,
          key: this.storeKey,
          ttl: 300
        }
      })
    }
  },

  locale: {
    get: function (query) {
      var storedLanguage = app.caches.get(this.storageType, this.module + '.language'),
        language = storedLanguage || query || app.language
      return language
    },

    set: function (language) {
      app.caches.set(this.storageType, this.module + '.language', language)
    }
  },

  /**
   * @function get
   * @memberof app.module.globalize
   * @param {HTMLElement} element - The element to set the globalized value to.
   * @desc Gets the globalized value and set it to the element.
   */
  get: function (element) {
    var responseData = this.responseData || app.caches[this.storeKey],
      value = element.getAttribute(this.module + '-get'),
      isRoot = value[0] == '/' ? true : false,
      setValue = isRoot ? responseData.data[value.substring(1)] : responseData.data.translations[value]
    dom.set(element, setValue)
  }
}