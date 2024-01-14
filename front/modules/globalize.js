'use strict'

app.module.globalize = {
  storageMechanism: 'local',
  storageType: 'module',
  defaultFolder: 'assets/json/locales/',

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
      folder: this.defaultFolder + this.module,
      language: this.locale.get(query, this),
    }, options.element)

    document.documentElement.setAttribute("lang", config.language)
    app.language = config.language
    this.defaultFolder = config.folder
    this.storeKey = this.module + '.' + config.language

    var cache = app.caches.get(this.storageMechanism, this.storageType, this.storeKey)
    if (cache) {
      this.responseData = cache
    } else {
      app.vars.totalStore++
      this.locale.load(config, this)
    }
  },

  locale: {
    load: function (config, _this) {
      var test = app.xhr.get({
        url: config.folder + '/' + config.language + '.json',
        response: _this.module,
        type: 'var',
        cache: {
          format: 'json',
          keyType: _this.storageType,
          type: _this.storageMechanism,
          key: _this.storeKey,
          ttl: 300
        }
      })
    },

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
      target = element.getAttribute(this.module + '-target'),
      isRoot = value[0] == '/' ? true : false,
      setValue = isRoot ? responseData.data[value.substring(1)] : responseData.data.translations[value]
    if (setValue) app.element.set(element, setValue, target ? target : 'settext')
  },

  set: function (value) {
    var value = value.clicked,
      optionValue = value.options[value.selectedIndex].value

    var config = {
      store: true,
      folder: this.defaultFolder,
      language: optionValue,
    }
    
    app.language = config.language
    this.storeKey = this.module + '.' + config.language

    this.locale.set(config.language, this)
    this.locale.load(config, this)

    var cache = app.caches.get(this.storageMechanism, this.storageType, this.storeKey)
    if (cache) {
      this.responseData = cache
    }
    app.attributes.run('html *')
  }
}