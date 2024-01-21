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

    this.locale.update(config, this)

    var cache = app.caches.get(this.storageMechanism, this.storageType, this.storeKey)
    if (cache) {
      this.cachedData = cache
    } else {
      app.vars.totalStore++
      this.locale.load(config, this)
    }
  },

  locale: {
    load: function (config, _this, run) {
      var options = {
        url: config.folder + '/' + config.language + '.json',
        type: 'var',
        module: _this.module,
        format: 'json',
        cache: {
          format: 'json',
          keyType: _this.storageType,
          type: _this.storageMechanism,
          key: _this.storeKey,
          ttl: 300
        },
        onload: {}
      }

      if (run) {
        options.type = 'fetch'
        options.onload.run = {
          func: 'app.attributes.run',
          arg: 'html *:not([include]'
        }
      }

      app.xhr.get(options)
    },

    get: function (query, _this) {
      var storedLanguage = app.caches.get(_this.storageMechanism, _this.storageType, _this.module + '.language'),
        language = (storedLanguage && storedLanguage.data) || query || app.language
      return language
    },

    set: function (config, _this) {
      app.caches.set(_this.storageMechanism, _this.storageType, _this.module + '.language', config.language)
    },

    update: function (config, _this) {
      _this.storeKey = _this.module + '.' + config.language
      app.language = config.language
      document.documentElement.setAttribute('lang', config.language)
      document.documentElement.setAttribute('dir', 'ltr')
    }
  },

  /**
   * @function get
   * @memberof app.module.globalize
   * @param {HTMLElement} element - The element to set the globalized value to.
   * @desc Gets the globalized value and set it to the element.
   */
  get: function (element) {
    element.textContent = element.originalText
    if (element.renderedText) element.textContent = element.renderedText

    var value = element.getAttribute(this.module + '-get') || element.textContent,
      isRoot = value[0] == '/' ? true : false,
      target = element.getAttribute(this.module + '-target')

    if (this.fetchedData) {
      var fetchedData = this.fetchedData,
        setValue = fetchedData.translations[value]
    } else {
      var cachedData = this.cachedData || app.caches.get(this.storageMechanism, this.storageType, this.storeKey),
        setValue = isRoot ? cachedData.data[value.substring(1)] : cachedData.data.translations[value]
    }

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

    this.locale.update(config, this)
    this.locale.set(config, this)
    this.locale.load(config, this, true)
  }
}