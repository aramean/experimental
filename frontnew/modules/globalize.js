'use strict'

app.module.globalize = {

  storageMechanism: 'local',
  storageType: 'module',

  /**
   * @function _autoload
   * @memberof app.module.globalize
   * @param {HTMLElement} scriptElement - The script element to load the configuration for.
   * @param {Object} options - The options object with the onload callback.
   * @desc Autoloads the globalize configuration for a specified script element.
   * @private
   */
  __autoload: function (options) {
    this.module = options.name
    var query = app.querystrings.get(false, 'locale')
    if (query) this.locale.set(query)

    var config = app.config.get(this.module, {
      store: true,
      folder: 'assets/json/' + this.module,
      language: this.locale.get(query),
    }, options.element)
    
    this.storeKey = this.module + '.' + config.language
    var cache = app.caches.get(this.storageMechanism, this.storageType, this.storeKey)
    if (cache) {
      this.responseData = cache
    } else {
      app.vars.totalStore++
      app.xhr.get({
        url: app.script.path + config.folder + '/' + config.language + '.json',
        response: this.module,
        type: 'var',
        cache: {
          format: 'json',
          keyType: this.storageType,
          type: this.storageMechanism,
          key: this.storeKey,
          ttl: 300
        }
      })
    }
  },

  locale: {
    get: function (query) {
      var storedLanguage = app.caches.get(this.storageMechanism, 'module', this.module + '.language'),
        language = storedLanguage || query || app.language
      return language
    },

    set: function (language) {
      alert(this.storageType)
      app.caches.set(this.storageMechanism, 'module', this.module + '.language', language)
    }
  },

  /**
   * @function get
   * @memberof app.module.globalize
   * @param {HTMLElement} element - The element to set the globalized value to.
   * @desc Gets the globalized value and set it to the element.
   */
  get: function (element) {
    var responseData = this.responseData || app.caches['module'][this.storeKey],
      value = element.getAttribute(this.module + '-get'),
      isRoot = value[0] == '/' ? true : false,
      setValue = isRoot ? responseData.data[value.substring(1)] : responseData.data.translations[value]
    dom.set(element, setValue)
  }
}