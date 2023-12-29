'use strict'

app.module.globalize = {

  storageMechanism: 'local',
  storageType: 'module',

  /**
   * @function _autoload
   * @memberof app.module.globalize
   * @param {object} options - The script element to load the configuration for.
   * @desc Autoloads the globalize configuration for a specified script element.
   * @private
   */
  __autoload: function (options) {
    this.module = options.name
    var query = app.querystrings.get(false, 'locale')
    if (query) this.locale.set(query, this)

    var config = app.config.get(this.module, {
      store: true,
      folder: 'assets/json/locales/' + this.module,
      language: this.locale.get(query, this),
    }, options.element)
    
    this.storeKey = this.module + '.' + config.language
    var cache = app.caches.get(this.storageMechanism, this.storageType, this.storeKey)
    if (cache) {
      this.responseData = cache
    } else {
      app.vars.totalStore++
      app.xhr.get({
        url: config.folder + '/' + config.language + '.json',
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
    get: function (query, _this) {
      var storedLanguage = app.caches.get(_this.storageMechanism, _this.storageType, _this.module + '.language'),
        language = (storedLanguage && storedLanguage.data) || query || app.language
      return language
    },

    set: function (language, _this) {
      app.caches.set(_this.storageMechanism, _this.storageType, _this.module + '.language', language)
    }
  },

  /**
   * @function get
   * @memberof app.module.globalize
   * @param {HTMLElement} element - The element to set the globalized value to.
   * @desc Gets the globalized value and set it to the element.
   */
  get: function (element) {
    var responseData = this.responseData || app.caches.get(this.storageMechanism, this.storageType, this.storeKey),
      value = element.getAttribute(this.module + '-get') || element.textContent,
      isRoot = value[0] == '/' ? true : false,
      setValue = isRoot ? responseData.data[value.substring(1)] : responseData.data.translations[value]
    dom.set(element, setValue)
  }
}