/**
 * @license
 * Copyright (c) Aleptra
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT-style license found in the 
 * LICENSE file in the root directory of this source tree.
 */

var dom = {
  uniqueId: 0,

  /**
   * @namespace parse
   * @memberof dom
   * @desc Object that contains functions for parsing strings and creating DOM nodes.
   */
  parse: {

    /**
     * @function attribute
     * @memberof dom.parse
     * @param {string} string - The string to parse.
     * @return {object} - An object containing key-value pairs parsed from the string.
     * @desc Parses a string into an object by splitting the string by ';' and then by ':'.
     */
    attribute: function (string) {
      var pairs = string ? string.split(';') : '',
        object = {}

      for (var i = 0; i < pairs.length; i++) {
        var keyValue = pairs[i].split(':'),
          key = keyValue[0],
          value = keyValue[1]

        object[key] = value
      }
      return object
    },

    /**
     * @function text
     * @memberof dom.parse
     * @param {string} string - The HTML string to parse.
     * @return {Node} - A DOM node representing the parsed HTML.
     * @desc Parses a string of HTML and return a DOM node.
    */
    text: function (string) {
      var matches = string.match(/<html\s+([^>]*)>/i),
        el = document.createElement('spot')

      if (matches) {
        var attributes = matches[1].trim(),
          attributePairs = attributes.split(/\s+/)

        for (var i = 0; i < attributePairs.length; i++) {
          var pair = attributePairs[i].split('='),
            name = pair[0],
            value = pair[1].slice(1, -1)
          el.setAttribute(name, value)
        }
      }
      el.innerHTML = string
      return el
    },

    json: function (string) {
      try {
        string = { value: JSON.parse(string) }
      } catch (error) {
        string = {
          value: '',
          errorName: error.name,
          errorMessage: error.message
        }
      }
      return string
    }
  },

  /**
   * @function get
   * @memberof dom
   * @param {string} selector - The CSS selector used to select the elements.
   * @param {boolean} [list=undefined] - If true, always return a list of elements, even if only one element matches the selector.
   * @return {Element|Element[]} - Returns a single element if there is only one match and "list" is not set to true, or a list of elements if "list" is set to true or if there are multiple elements that match the selector.
   * @desc Retrieves elements from the document by selector.
   */
  get: function (selector, list) {
    var element = document.querySelectorAll(selector)
    return element.length == 0 ? '' : element.length == 1 && !list ? element[0] : element
  },

  /**
   * @function find
   * @memberof dom
   * @param {Node} node - The node to search within.
   * @param {string} selector - The CSS selector used to select the elements.
   * @return {Element|Element[]} - Returns a single element if there is only one match, or a list of elements if there are multiple elements that match the selector.
   * @desc Retrieves elements from a given node by selector.
   */
  find: function (node, selector) {
    var element = node.querySelectorAll(selector)
    return element.length == 1 ? element[0] : element
  },

  /**
   * @function setDisplay
   * @memberof dom
   * @param {string} action - The value to set for the display property. Valid values include 'none', 'block', 'inline', and others.
   * @desc Sets the display property of the root element.
   */
  setDisplay: function (action) {
    document.documentElement.style.display = action
  },

  bind: function (object, value, attr) {
    var attributes = object.attributes,
      innerHTML = object.innerHTML,
      type = object.tagName.toLowerCase(),
      binding = object.getAttribute('data-bind') || object.getAttribute('bind') || object.getAttribute('var'),
      clonedObject = object.cloneNode(true)

    // Set variable if colon is presented or update innerhtml.

    var bindings = binding.indexOf(':') !== -1 && binding.split(';')

    for (var i = 0; i < bindings.length; i++) {
      var bindingParts = bindings[i].split(':'),
        replaceVariable = bindingParts[0].trim(),
        replaceValue = bindingParts[1].trim(),
        target = replaceValue.substr(1),
        regex = new RegExp('{' + replaceVariable + '}|\\b' + replaceVariable + '\\b', 'g'),
        regex2 = new RegExp('{' + replaceVariable + '}', 'g')

      // Bind query
      if (replaceValue[0] === '?') {
        replaceValue = app.querystrings.get(false, target)
      }

      // Bind global variable
      if (replaceValue[0] === '*') {
        replaceValue = (window.app[target]) ? window.app[target] : ''
      }

      // Bind asset variable
      if (replaceValue[0] === '^') {
        var keys = target.split('.')
        if (app.caches[keys[0]]) {
          var value = app.caches[keys[0]].data
          for (var i = 1; i < keys.length; i++) {
            value = value[keys[i]]
          }
          replaceValue = value
        }
      }

      // Bind element
      if (replaceValue[0] === '#') {
        var binding = dom.get(replaceValue),
          type = binding.type
        switch (type) {
          case 'text':
            binding.addEventListener('input', function () {
              app.variables.update.attributes(object, clonedObject, regex, replaceVariable, this.value, true)
              app.variables.update.content(object, regex, replaceVariable, this.value)
            })
            break
          case 'select-one':
            binding.addEventListener('change', function () {
              var value = this.options[this.selectedIndex].value
              app.variables.update.attributes(object, clonedObject, regex, replaceVariable, this.value, true)
              app.variables.update.content(object, regex, replaceVariable, value)
            })
            break
        }
        continue
      }

      // Replace variables in attributes
      for (var j = 0; j < attributes.length; j++) {
        var attr = attributes[j]
        var value = attr.value
        var defaultValue = ''
        value = value.replace(/:([^&}]+)/g, function (match, capturedGroup) {
          defaultValue = capturedGroup
          return ''
        })

        if (value.indexOf('{' + replaceVariable + '}') !== -1) {
          var newValue = value.replace(regex2, replaceValue === '' ? defaultValue : replaceValue)
          object.setAttribute(attr.name, newValue)
        }
      }

      // Replace variables in innerHTML
      innerHTML = innerHTML.replace(regex, function (match) {
        if (match === '{' + replaceVariable + '}') {
          return replaceValue
        }
        return match
      })

    }

    object.innerHTML = innerHTML
  },

  loader: function (object, value) {
    dom.hide(object)
    if (value) dom.show(value)
  },

  /**
   * Displays a message in a dialog box.
   *
   * @param {string} value - The message to display in the dialog box.
   */
  alert: function (value) {
    alert(value)
  },

  /**
   * Retrieves metadata from a meta tag with the specified name and sets it as the inner HTML of the specified object.
   *
   * @param {HTMLElement} object - The element object to modify.
   * @param {string} name - The name of the meta tag whose content will be retrieved.
   */
  metadata: function (object, name) {
    var value = dom.get('meta[name=' + name + ']')
    object.innerHTML = value.content
  },

  hide: function (object) {
    var el = object instanceof Object ? object : dom.get(object)
    if (el) {
      el.style.cssText = 'display: none !important'
    }
  },

  show: function (object) {
    var el = object instanceof Object ? object : dom.get(object)
    if (el) {
      el.style.cssText = el.style.cssText.replace(/display\s*:\s*[^;]+;/gi, '')
      el.removeAttribute('hide')
    }
  },

  /**
   * @function setUniqueId
   * @memberof dom
   * @param {HTMLElement} element - The element to set the unique id on.
   * @desc Sets a unique id for the given element.
   */
  setUniqueId: function (element) {
    dom.uniqueId++
    element.id = 'id' + dom.uniqueId
  },

  /**
   * @function set
   * @memberof dom
   * @param {Object} object - The element object to modify.
   * @param {string} value - The value to set as the content of the element.
   * @param {boolean} [strip=false] - If true, remove all HTML tags from the value before setting it as the content.
   * @desc Sets the content of an element.
  */
  set: function (object, value, strip, replace) {

    var target = object instanceof Object ? object : dom.get(object),
      tag = object.localName,
      type = object.type,
      value = strip ? value.replace(/<[^>]+>/g, '') : value || ''

    switch (tag) {
      case 'input':
        type == 'checkbox' ? target.checked = value : target.value = value
        break
      case 'img':
        target.src = value
        break
      case 'a':
        if (replace) value = target.href.replace(new RegExp('{' + replace + '}', 'g'), value)
        target.href = value
        break
      case 'select':
        target.setAttribute('select', value)
        break
      default:
        target.innerHTML = value
    }
  },

  hreflocal: function (object) {
    var envLocalhost = (object) ? object.getAttribute('hreflocal') : false,
      envSubdomain = (object) ? object.getAttribute('hrefprod') : false,
      val = (envLocalhost && app.isLocalNetwork) ? envLocalhost : envSubdomain

    if (object)
      object.setAttribute('href', val)
    app.baseUrl = val
  },

  /**
   * @function uppercase
   * @memberof dom
   * @param {Object} object - The element object to modify.
   * @param {boolean} [first=false] - If true, only convert the first character to uppercase. Otherwise, convert the entire contents to uppercase.
   * @desc Converts the contents of an element to uppercase letters.
   */
  uppercase: function (object, first) {
    object.innerHTML = !first || first === 'true' ? object.innerHTML.toUpperCase() : object.innerHTML.charAt(0).toUpperCase() + object.innerHTML.slice(1)
  },

  /**
   * @function lowercase
   * @memberof dom
   * @param {Object} object - The element object to modify.
   * @desc Converts the contents of an element to lowercase letters.
   */
  lowercase: function (object) {
    object.innerHTML = object.innerHTML.toLowerCase()
  },

  /**
   * @function slice
   * @memberof dom
   * @param {Object} object - The element object to modify.
   * @param {string} value - A string representing the start and end indices of the slice.
   * @desc Slices the content of an element and replaces it with the sliced portion.
   */
  slice: function (object, value) {
    var values = value.replace(/\s+/g, '').split(',')
    object.innerHTML = object.innerHTML.slice(values[0], values[1])
  },

  /**
   * @function trim
   * @memberof dom
   * @param {Object} object - The element object to modify.
   * @param {string} value - A string representing the type of trim operation to perform ('left', 'right', or undefined).
   * @desc Trims whitespace from the content of an element based on the value of the `trim` attribute.
   */
  trim: function (object, value) {
    var regex
    switch (value.toLowerCase()) {
      case 'left':
        regex = /^\s+/
        break
      case 'right':
        regex = /\s+$/
        break
      default:
        regex = /^\s+|\s+$/g
    }
    object.innerHTML = object.innerHTML.replace(regex, '')
  },

  afterbegin: function (object, value) {
    object.insertAdjacentText('afterbegin', value)
  },

  afterend: function (object, value) {
    object.insertAdjacentText('afterend', value)
  },

  beforebegin: function (object, value) {
    object.insertAdjacentText('beforebegin', value)
  },

  beforeend: function (object, value) {
    object.insertAdjacentText('beforeend', value)
  },

  insert: function (object, value) {
    var tag = object.localName,
      position = value.slice(0, value.indexOf(":")),
      text = value.slice(value.indexOf(":") + 1),
      beforebegin = position === 'beforebegin' ? text : '',
      afterbegin = position === 'afterbegin' ? text : ''

    switch (tag) {
      case 'input':

        break
      case 'img':
        var src = object.getAttribute('src')
        if (src) object.src = beforebegin + src + afterbegin
        break
      case 'a':
        object.href = beforebegin + object.href + afterbegin
        break
      case 'select':
        object.setAttribute('select', value)
        break
      default:
        object.insertAdjacentText(position, value)
    }
  },

  split: function (object, value) {
    var parts = value.split(';'),
      pattern = parts[0],
      index = parts[1]

    dom.set(object, object.innerHTML.split(pattern)[index])
  },

  /**
   * @function getTagLink
   * @memberof dom
   * @param {Element} element - The element to start the search from.
   * @return {Element|null} The found anchor element, or `null` if none was found.
   * @desc Finds the first ancestor of the given element that is an anchor element (`<a>`).
   */
  getTagLink: function (element) {
    for (var current = element; current; current = current.parentNode) {
      if (current.localName === 'a') return current
    }
    return null
  },

  /**
   * @function include
   * @memberof dom
   * @param {Object} element - The element to which the external content will be added.
   * @desc * Loads the content of an external file and insert it into the DOM.
   */
  include: function (element) {
    app.xhr.get({
      element: element,
      url: element.attributes.include.value,
      onload: {
        run: {
          func: 'app.attributes.run',
          arg: '#' + element.id + ' *'
        }
      }
    })
  },

  stopif: function (element, value) {
    var elementValue = element.innerHTML || '',
      values = value.split(':'),
      condition = values[0],
      attributes = values[1].split(';')

    if (elementValue === condition) {
      for (var i = 0; i < attributes.length; i++)
        element.removeAttribute(attributes[i])
    }
  },

  callif: function (element, value) {
    var elementValue = element.innerHTML || '',
      values = value.split(':'),
      condition = values[0],
      attributes = values[1].split(';')

    if (elementValue === condition) {
      alert('hej')
    }
  },

  vars: function (element, value) {
    if (element.localName === 'script') return
    dom.bind(element, value)
    var value = element.attributes.vars
  }
}

var app = {
  module: {},
  plugin: {},
  var: {},
  language: document.documentElement.lang || 'en',
  title: document.title,
  docMode: document.documentMode || '',
  isFrontpage: document.doctype ? true : false,
  srcDocTemplate: '',
  srcTemplate: [],
  baseUrl: '',
  isLocalNetwork: /localhost|127\.0\.0\.1|::1|\.local|^$/i.test(location.hostname),

  caches: { template: {}, var: {}, module: {} },
  vars: { total: 0, totalStore: 0, loaded: 0 },
  modules: { total: 0, loaded: 0 },

  /**
   @namespace log
   @memberof app
   @desc Object that contains functions for logging information and errors to the console.
   */
  log: {

    /**
     * @function info
     * @memberof app.log
     * @returns {function} - The console.info() function or a no-op function if app.debug is not set to 'true'.
     * @desc Logs information to the console if app.debug is set to 'true'.
     */
    info: function (prefix) {
      return app.debug === 'true' || app.debug === 'localhost' && app.isLocalNetwork ? console.info.bind(console, prefix ? ' ❱' : '❚') : function () { }
    },

    /**
     * @function error
     * @memberof app.log
     * @returns {function} - The console.error() function or a no-op function if app.debug is not set to 'true'.
     * @desc Logs errors to the console if app.debug is set to 'true'.
     */
    error: function (code) {
      return app.debug === 'true' || app.debug === 'localhost' && app.isLocalNetwork ? console.error.bind(console, code === 0 ? ' Syntax not found:' : '') : function () { }
    },

    /**
     * @function warn
     * @memberof app.log
     * @returns {function} - The console.warn() function or a no-op function if app.debug is not set to 'true'.
     * @desc Logs warnings to the console if app.debug is set to 'true'.
     */
    warn: function (code) {
      return app.debug === 'true' || app.debug === 'localhost' && app.isLocalNetwork ? console.warn.bind(console, code === 0 ? ' ?:' : '') : function () { }
    }
  },

  /**
   * @namespace config
   * @memberof app
   * @desc Object that contains functions to get and set configurations.
   */
  config: {

    /**
     * @function get
     * @memberof app.config
     * @param {string} module - The name of the module.
     * @param {object} standard - The standard configuration object.
     * @param {object} element - The DOM element.
     * @returns {object} final - The final configuration object.
     * @desc Gets the configuration from the DOM element and overrides the standard configuration.
     */
    get: function (module, standard, element) {
      var value = module ? element.getAttribute(module + '-conf') : element.getAttribute('conf'),
        override = value ? dom.parse.attribute(value) : {},
        final = {}
      for (var prop in standard) {
        final[prop] = override.hasOwnProperty(prop) ? override[prop] : standard[prop]
      }

      return final
    },

    /**
     * @function set
     * @memberof app.config
     * @param {object} [scriptElement=null] - The script DOM element.
     * @desc Sets the configuration to the app object.
     */
    set: function (scriptElement) {
      dom.hreflocal(dom.get('head base'))
      var config = this.get(false, {
        debug: false,
        debugLocalhost: false,
        //fileExtension: '.html'
      }, scriptElement || app.script.element)

      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          app[prop] = config[prop]
        }
      }
    }
  },

  caches: {

    get: function (type, key) {
      var data
      switch (type) {
        case 'local':
          data = JSON.parse(localStorage.getItem(key))
          break
        case 'session':
          data = JSON.parse(sessionStorage.getItem(key))
          break
        case 'cookie':
          data = document.cookie
          break
        default:
          data = app.caches[key]
      }
      return data
    },

    set: function (type, format, key, data) {
      switch (format) {
        case 'xml':
          data = new DOMParser().parseFromString(data, 'text/xml')
          break
        case 'json':
          var json = dom.parse.json(data)
          data = json.value
          this.responseError = json.errorMessage
          break
      }

      var cacheData = {
        'data': data,
        'headers': ''
      }

      app.caches[key] = cacheData

      switch (type) {
        case 'local':
          localStorage.setItem(key, JSON.stringify(cacheData))
          break
        case 'session':
          sessionStorage.setItem(key, JSON.stringify(cacheData))
          break
        case 'cookie':
          document.cookie = cacheData.data
          break
      }
    }
  },

  listeners: {
    add: function (element, eventType, callback) {
      element.removeEventListener(eventType, callback)
      element.addEventListener(eventType, callback)
    }
  },

  /**
   * @namespace assets
   * @memberof app
   * @desc
   */
  assets: {
    load: function () {
      if (app.isFrontpage) {
        var scriptAttr = app.script.element.attributes,
          modules = scriptAttr.module && scriptAttr.module.value.split(';') || [],
          vars = scriptAttr.var && scriptAttr.var.value.split(';') || []

        app.modules.name = modules
        app.modules.total = modules.length

        app.vars.name = vars
        app.vars.total = vars.length

        this.get.modules()
      } else {
        var templateElement = dom.get('template'),
          templateAttr = templateElement && templateElement.attributes.src,
          templateSrcDoc = templateElement && templateElement.getAttribute('srcdoc') || false,
          templateSrc = templateElement && templateAttr && templateElement.getAttribute('src').split(';') || []

        app.srcTemplate = {
          url: {
            srcDoc: templateSrcDoc,
            src: templateSrc
          },
          total: templateSrc.length + (templateSrcDoc ? 1 : 0)
        }

        this.get.templates()
      }
    },

    get: {
      vars: function () {
        app.log.info()('Loading vars...')
        for (var j = 0; j < app.vars.total; j++) {
          var name = app.vars.name[j]
          app.log.info(1)(name)
          app.xhr.get({
            url: app.script.path + 'assets/json/vars/' + name + '.json',
            type: 'var',
            cache: {
              format: 'json',
              key: name
            }
          })
        }
      },

      /**
       * @function load
       * @memberof app
       * @param {function} [runAttributes] - A flag to indicate if the runAttributes function should be called after all modules are loaded.
       * @desc Loads extensions(modules) from the `module` attribute of the script element and call autoload function if exists.
       */
      modules: function () {
        app.log.info()('Loading modules...')
        for (var i = 0; i < app.modules.total; i++) {
          var script = document.createElement('script')
          script.name = app.modules.name[i]
          script.src = app.script.path + 'modules/' + script.name + '.js'
          script.async = true
          script.onload = function () {
            app.log.info(1)(this.name)
            app.modules.loaded++
            app.module[this.name].conf = function () { }
            if (app.module[this.name]._autoload) {
              app.module[this.name]._autoload({
                element: app.script.element,
                name: this.name
              })
            }
            if (app.modules.loaded === app.modules.total) {
              app.assets.get.vars()
            }
          }

          document.head.appendChild(script)
        }
      },

      /**
       * @function load
       * @memberof app
       * 
       */
      templates: function () {
        app.log.info()('Loading templates...')
        var src = app.srcTemplate.url.src,
          srcDoc = app.srcTemplate.url.srcDoc,
          hasStartpage = srcDoc ? -1 : 0

        for (var i = 0; i < app.srcTemplate.total; i++) {
          var isStartpage = srcDoc && i === 0 ? true : false,
            currentTemplate = isStartpage ? srcDoc : src[i + hasStartpage]
          app.xhr.get({
            url: app.script.path + currentTemplate + '.html',
            type: 'template',
            onload: {
              run: {
                func: 'app.templates.render'
              }
            },
            cache: {
              format: 'html',
              name: 'template',
              key: currentTemplate,
              extraData: { isStartPage: isStartpage }
            },
          })
        }
      }
    }
  },

  /**
   * @namespace start
   * @memberof app
   * @desc
   */
  start: function () {
    var selector = 'script[src*=front]',
      element = dom.get(selector),
      value = element.attributes.src.value

    app.script = {
      element: element,
      path: (value.match(/^(\.\.\/)+/) || [''])[0],
      selector: selector
    }

    app.xhr.start()
    app.config.set()
    app.assets.load()
  },

  /**
   * @namespace xhr
   * @memberof app
   * @desc
   */
  xhr: {

    currentRequest: null,
    currentRequestCount: 0,

    start: function () {

      var open = XMLHttpRequest.prototype.open,
        send = XMLHttpRequest.prototype.send

      XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        this.onreadystatechange = function (e) {
          if (this.readyState === 4) {
            var statusType = {
              informational: this.status >= 100 && this.status <= 199,
              success: this.status >= 200 && this.status <= 299,
              redirect: this.status >= 300 && this.status <= 399,
              clientError: this.status >= 400 && this.status <= 499,
              serverError: this.status >= 500 && this.status <= 599
            }

            this.statusType = statusType

            var options = this.options,
              type = options.type,
              name = options.name,
              extra = options.extra,
              cache = options.cache

            if (cache && statusType.success) {
              app.caches.set(cache.type, cache.format, cache.key, this.responseText)
            }

            if (type) {
              app.log.warn()('(XHR) ' + options.type + ' intercepted:', url)
              switch (type) {
                case 'page':
                  var responsePage = dom.parse.text(this.responseText)
                  var responsePageTitle = dom.find(responsePage, 'title').textContent,
                    templateElement = dom.find(responsePage, 'template'),
                    templateAttr = templateElement && templateElement.attributes.src,
                    templateSrc = templateElement && templateAttr && templateElement.getAttribute('src').split(';') || []

                  app.modules.total = 0
                  app.templates.total = 0
                  app.templates.loaded = 0
                  app.vars.total = 0

                  app.srcTemplate = {
                    url: {
                      srcDoc: '',
                      src: templateSrc
                    },
                    total: templateSrc.length
                  }
                  document.title = responsePageTitle
                  app.assets.get.templates()
                  break
                case 'var':
                  app.vars.loaded++
                  break
                case 'template':
                  app.templates.loaded++
                  break
              }

              // Check if all requests have finished loading
              if (
                app.vars.loaded === (app.vars.total + app.vars.totalStore) &&
                app.modules.loaded === app.modules.total
              ) {
                //console.log('Vars loaded:', app.vars.loaded + '/' + (app.vars.total + app.vars.totalStore))
                //console.log('Modules loaded:', app.modules.loaded + '/' + app.modules.total)
                app.attributes.run()
              }

            }
          }
        }

        open.apply(this, arguments)
      }

      XMLHttpRequest.prototype.send = function (data) {
        if (data) console.log(data)
        send.apply(this, arguments)
      }
    },

    /**
     * @function xhr
     * @memberof app
     * @desc Creates XHR requests and updates the DOM based on the response.
     */
    get: function (options) {
      var url = options.url instanceof Array ? options.url : [options.url],
        target = options.target ? dom.get(options.target) : options.element,
        single = options.single,
        cache = options.cache || false,
        headers = options.headers || {},

        onload = options.onload,
        error = options.error,
        onprogress = options.onprogress,

        timeout = onload ? options.onload.timeout || 0 : 0,
        loader = onprogress && onprogress.loader ? dom.get(onprogress.loader) : false,
        run = onload && onload.run && onload.run.func ? onload.run.func.split('.') : false,
        runarg = onload && onload.run && onload.run.arg

      if (false) {
        console.dir(cache)
        console.log('hej')
      } else {

        // Abort the previous request if it exists
        if (single && this.currentRequest) {
          //xhr.currentRequest.abort()
        }

        var xhr = new XMLHttpRequest(),
          urlExtension = url.indexOf('.') !== -1 || url == '/' || options.urlExtension === false ? '' : app.fileExtension || ''
        xhr.options = options
        // Set headers
        /*for (var header in headers) {
          if (headers.hasOwnProperty(header)) xhr.setRequestHeader(header, headers[header])
        }*/

        //if (single) this.currentRequest = xhr

        xhr.onabort = function () {
          //if (preloader && app.module.navigate) app.module.navigate._preloader.reset(preloader)
        }

        xhr.onprogress = function (e) {
          //if (preloader && app.module.navigate) app.module.navigate._preloader.load(preloader, e)
          //if (onprogress) target ? dom.set(target, onprogress.content) : ''
        }

        xhr.onload = function () {
          var status = this.statusType

          if (status.informational || status.success || status.redirect) {

            /*var headers = xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)
            var headerMap = {}
            for (var i = 0; i < headers.length; i++) {
              var parts = headers[i].split(": ")
              var header = parts[0]
              var value = parts.slice(1).join(": ")
              headerMap[header] = value
            }*/

            var responseData = this.responseText,
              responseError = this.responseError

            if (target) {
              dom.set(target, responseData)
            }

            if (responseError) {
              dom.show(error)
            }

            if (onload) {

              if (run) {
                app.log.info()('Calling: ' + run)

                runarg = run[1] === 'templates' && run[2] === 'render' ? { data: responseData, arg: runarg } : runarg

                if (run.length === 4)
                  window[run[0]][run[1]][run[2]][run[3]](runarg)
                else if (run.length === 3)
                  window[run[0]][run[1]][run[2]](runarg)
                else if (run.length === 2)
                  window[run[0]][run[1]](runarg)
              }
            }

          } else if (status.clientError || status.serverError) {
            if (loader) dom.loader(loader)
            if (error) dom.show(error)
          }
        }

        xhr.onerror = function () {
          if (loader) dom.loader(loader)
          if (error) dom.show(error)
        }

        xhr.open('GET', url + urlExtension, true)
        xhr.send(null)
      }
    }
  },

  /**
   * @namespace attributes
   * @memberof app
   * @desc
   */
  attributes: {

    defaultExclude: ['id', 'name', 'class', 'title', 'alt'],

    /**
     * @function run
     * @memberof app
     * @param {string} [selector='html *'] - A CSS selector for the elements to be processed.
     * @desc Runs Front Text Markup Language in all elements matching a given selector.
     */
    run: function (selector, exclude) {
      var selector = selector || 'html *',
        node = typeof selector === 'string' ? dom.get(selector, true) : selector,
        excludes = exclude ? exclude.concat(this.defaultExclude) : this.defaultExclude
      app.log.info()('Running attributes (' + selector + ') ...')
      for (var i = 0; i < node.length; i++) {
        var element = node[i],
          attributes = element.attributes,

          run = attributes.run ? attributes.run.value : false,
          stop = attributes.stop ? attributes.stop.value.split(';') : [],
          include = attributes.include ? attributes.include.value : '',
          exclude = stop && excludes.indexOf('stop') === -1 ? excludes.concat(stop) : excludes

        if (include) dom.setUniqueId(element)

        // Fix IE attribute bug.
        if (app.docMode >= 9) {
          var array = Array.prototype.slice.call(attributes)
          attributes = array.reverse()
        }

        if (run !== 'false') {
          for (var j = 0; j < attributes.length; j++) {
            var attributeName = attributes[j].name,
              name = attributes[j].name.split('-'),
              value = attributes[j].value
            if (exclude.indexOf(attributeName) === -1) {
              if (app.module[name[0]] && name[1]) {
                app.log.info(1)(name[0] + ':' + name[0] + '-' + name[1])
                app.module[name[0]][name[1]] ? app.module[name[0]][name[1]](element) : app.log.error(0)(name[0] + '-' + name[1])
              } else if (dom[name]) {
                app.log.info(1)('dom.' + name)
                dom[name](element, value)
              }
            } else {
              app.log.warn(1)(name + " [Skipping]")
            }
          }
        }
      }
    }
  },

  /**
   * @namespace variables
   * @memberof app
   * @desc
   */
  variables: {
    update: {
      attributes: function (object, clonedObject, regex, replaceVariable, replaceValue, reset) {

        var originalAttributes = []
        var originalContent = clonedObject.innerHTML

        for (var i = 0; i < object.attributes.length; i++) {

          var attr = object.attributes[i]

          originalAttributes.push({
            name: attr.name,
            value: attr.value
          })

          if (attr.name == 'bind') continue
          var newValue = attr.value.replace(regex, function (match) {
            if (match === '{' + replaceVariable + '}')
              return replaceValue
          })
          object.setAttribute(attr.name, newValue)
        }

        if (reset) {
          app.attributes.run([object], ['bind', 'stop'])
          app.variables.reset.attributes(object, originalAttributes)
          app.variables.reset.content(object, originalContent)
        }
      },

      content: function (object, regex, replaceVariable, replaceValue) {
        var innerHTML = object.innerHTML.replace(regex, function (match) {
          if (match === '{' + replaceVariable + '}') {
            return replaceValue
          }
          return match
        })

        object.innerHTML = innerHTML
      }
    },

    reset: {
      attributes: function (object, original) {
        for (var i = 0; i < object.attributes.length; i++) {
          var attr = object.attributes[i]
          object.setAttribute(attr.name, original[i].value)
        }
      },

      content: function (object, original) {
        object.innerHTML = original
      }
    }
  },

  /**
   * @namespace querystrings
   * @memberof app
   * @desc
   */
  querystrings: {
    get: function (url, param) {
      var parser = document.createElement('a')
      parser.href = url || window.location.href
      var query = parser.search.substring(1)
      var vars = query.split('&')

      for (var i = 0, len = vars.length; i < len; i++) {
        var pair = vars[i].split('=')
        var key = decodeURIComponent(pair[0])
        var value = decodeURIComponent(pair[1] || '')
        if (key === param) return value
      }

      return ''
    }
  },

  /**
   * @namespace templates
   * @memberof app
   * @desc
   */
  templates: {
    loaded: 0,
    total: 0,
    elements: ['header', 'aside:nth-of-type(1)', 'aside:nth-of-type(2)', 'footer'],

    render: function () {
      if (app.templates.loaded === app.srcTemplate.total) {
        //app.log.info()('Rendering templates...')
        var currentPageTitle = document.title,
          currentPageBody = document.body.innerHTML
        var srcDoc = app.srcTemplate.url.srcDoc,
          src = app.srcTemplate.url.src
        console.dir(srcDoc)
        if (srcDoc) {
          var responsePage = dom.parse.text(app.caches[srcDoc].data),
            responsePageScript = dom.find(responsePage, app.script.selector),
            responsePageContent = responsePage.innerHTML

          for (var j = 0; j < this.elements.length; j++) {
            var el = dom.find(responsePage, this.elements[j]).innerHTML
            //if (el) {
            dom.set(this.elements[j], el)
            //app.attributes.run(this.elements[j] + ' *')
            //}
          }

          var scriptAttr = responsePageScript.attributes,
            modules = scriptAttr.module && scriptAttr.module.value.split(';') || [],
            vars = scriptAttr.var && scriptAttr.var.value.split(';') || []

          app.language = responsePage.attributes.lang ? responsePage.attributes.lang.value : app.language
          app.script.element = responsePageScript

          app.modules.name = modules
          app.modules.total = modules.length

          app.vars.name = vars
          app.vars.total = vars.length

          // Fix IE bug.
          if (app.docMode >= 9) {
            document.open()
            document.write(responsePageContent)
            document.close()
          } else {
            dom.set('html', responsePageContent)
          }

          dom.set('main', currentPageBody)
        }

        if (src) {
          for (var i = 0; i < src.length; i++) {
            var html = dom.parse.text(app.caches[src[i]].data),
              template = dom.parse.text(dom.find(html, 'template').innerHTML)

            for (var j = 0; j < this.elements.length; j++) {
              var el = dom.find(template, this.elements[j]).innerHTML

              if (el) {
                dom.set(this.elements[j], el)
                app.attributes.run(this.elements[j] + ' *')
              }
            }
          }
        }

        document.title = currentPageTitle
        app.assets.get.modules()
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  app.start()
})