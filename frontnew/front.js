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
    text: function (string, exclude) {
      var el = document.createElement('spot'),
        html = string.match(/<html\s+([^>]*)>/i),
        body = string.match(/<body\s+class="([^"]*)"/i)

      if (html) {
        var attributes = html[1].trim(),
          attributePairs = attributes.split(/\s+/)

        for (var i = 0; i < attributePairs.length; i++) {
          var pair = attributePairs[i].split('='),
            name = pair[0],
            value = pair[1].slice(1, -1)
          el.setAttribute(name, value)
        }
      }

      if (body) {
        el.className = body[1]
      }

      if (exclude) {
        var regexArray = exclude.map(function (tag) {
          return new RegExp('<' + tag + '[^>]*>[\\s\\S]*?</' + tag + '>', 'g')
        })

        for (var i = 0; i < regexArray.length; i++) {
          string = string.replace(regexArray[i], '')
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
    return element.length == 1 && selector != '*' ? element[0] : element
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
    var type = object.tagName.toLowerCase(),
      bindInclude = this.bind.include ? ';' + this.bind.include : '',
      binding = ((object.getAttribute('data-bind') || object.getAttribute('bind') || object.getAttribute('var')) || '') + bindInclude

    // Set variable if colon is presented or update innerhtml.
    var bindings = binding ? binding.split(';') : []

    for (var i = 0; i < bindings.length; i++) {
      var bindingParts = bindings[i].split(':') || [],
        replaceVariable = bindingParts[0].trim(),
        replaceValue = bindingParts[1].trim(),
        target = replaceValue.substring(1),
        regex = new RegExp('{' + replaceVariable + '}|\\b' + replaceVariable + '\\b', 'g')

      // Bind query
      if (replaceValue[0] === '?') {
        replaceValue = app.querystrings.get(false, target)
      }
      // Bind global variable
      else if (replaceValue[0] === '*') {
        replaceValue = app[target] || ''
      }
      // Bind asset variable
      else if (replaceValue[0] === '^') {
        var keys = target.split('.'),
          cache = app.caches.get('window', 'var', keys[0])

        if (cache && cache.data) {
          var value = cache.data
          for (var j = 1; j < keys.length; j++) {
            if (value.hasOwnProperty(keys[j])) {
              value = value[keys[j]]
            } else {
              console.error('Key ' + keys[j] + ' does not exist on the value object')
              return
            }
          }

          replaceValue = value
        }
      }
      // Bind element
      else if (replaceValue[0] === '#') {
        var target = dom.get(replaceValue),
          type = target.type,
          name = target.id || target.name

        var match = binding.match(new RegExp("([^:]+):[#.]" + name)),
          replaceVariableNew = match ? match[1] : '',
          clonedObject = object.cloneNode(true)

        switch (type) {
          case 'text':
            app.listeners.add(target, 'input', function () {
              app.variables.update.attributes(object, clonedObject, replaceVariableNew, this.value, true)
              app.variables.update.content(object, regex, replaceVariableNew, this.value)
            })
            break
          case 'select-one':
            app.listeners.add(target, 'change', function () {
              var value = this.options[this.selectedIndex].value
              app.variables.update.attributes(object, clonedObject, replaceVariableNew, this.value, true)
              app.variables.update.content(object, regex, replaceVariableNew, value)
            })
            break
        }
        continue
      }

      app.variables.update.attributes(object, object, replaceVariable, replaceValue, false)
    }
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

  doctitle: function (value) {
    var value = value instanceof Object ? value.attributes.doctitle.value : value
    app.title = value
    document.title = value
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
        target.innerHTML = value
        break
      case 'select':
        target.setAttribute('select', value)
        break
      case 'title':
        target.innerHTML = value
        console.dir('weee')
        break
      default:
        target.innerHTML = value
    }
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
   * @desc Trims chars from the content of an element.
   */
  trim: function (object, value) {
    var regex,
      values = value.split(';'),
      direction = values[0].toLowerCase(),
      char = values[1] || ' '

    switch (direction) {
      case 'left':
        regex = '^[' + char + '\\t]+'
        break
      case 'right':
        regex = '[' + char + '\\t]+$'
        break
      default:
        regex = '^[' + char + '\\t]+|[' + char + '\\t]+$'
        break
    }

    object.innerHTML = object.innerHTML.replace(new RegExp(regex, 'g'), '')
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

    //@TODO Fix ie bug with reversed attributes.

    var bind = element.attributes.bind
    if (bind) dom.bind.include = bind.value
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

  if: function (element, value) {
    var value = value.split(';') || [],
      operator = value[0].split(':') || [],
      func = value[1]
    //console.log(operator[0] + operator[1] + value[0])
    switch (func) {
      case 'show':
        break
      case 'hide':
        break
      case 'stop':
        break
      case 'call':
        break
    }
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
  version: { major: 1, minor: 0, patch: 0, build: 92 },
  module: {},
  plugin: {},
  var: {},
  language: document.documentElement.lang || 'en',
  title: document.title,
  docMode: document.documentMode || 0,
  isFrontpage: document.doctype ? true : false,
  srcDocTemplate: '',
  srcTemplate: [],
  isLocalNetwork: /localhost|127\.0\.0\.1|::1|\.local|^$/i.test(location.hostname),

  vars: { total: 0, totalStore: 0, loaded: 0 },
  modules: { total: 0, loaded: 0 },

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
      path: (value.match(/^(.*\/)[^/]+$/) || ['', ''])[1],
      selector: selector
    }

    app.xhr.start()
    app.config.set()
    app.assets.load()

    document.addEventListener('keyup', function (e) {
      //console.log('key')
    })
  },

  call: function (run, runarg) {
    app.log.info()('Calling: ' + run + ' ' + runarg)
    console.log('Calling: ' + run + ' ' + runarg)
    if (run.length === 4)
      window[run[0]][run[1]][run[2]][run[3]](runarg)
    else if (run.length === 3)
      window[run[0]][run[1]][run[2]](runarg)
    else if (run.length === 2)
      window[run[0]][run[1]](runarg)
  },

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
      var config = this.get(false, {
        debug: false,
        debugLocalhost: false,
        varsDir: app.script.path
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
    module: {},
    var: {},
    page: {},
    template: {},

    get: function (mechanism, type, key) {
      var data
      switch (mechanism) {
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
          data = app.caches[type][key]
      }
      return data
    },

    set: function (mechanism, type, key, data, format) {
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

      app.caches[type][key] = cacheData

      switch (mechanism) {
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
          templateAttr = templateElement && templateElement.attributes,
          elementSrcDoc = templateAttr && templateAttr.srcdoc && templateAttr.srcdoc.value,
          elementSrc = templateAttr && templateAttr.src && templateAttr.src.value,
          templateSrcDoc = elementSrcDoc || false,
          templateSrc = elementSrc && elementSrc.split(';') || []

        app.srcTemplate = {
          url: {
            srcDoc: templateSrcDoc,
            src: templateSrc
          },
          page: false,
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
            url: 'assets/json/vars/' + name + '.json',
            type: 'var',
            cache: {
              format: 'json',
              keyType: 'var',
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
            if (app.module[this.name].__autoload) {
              app.module[this.name].__autoload({
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
            cache: {
              format: 'html',
              name: 'template',
              keyType: 'template',
              key: currentTemplate,
              extraData: { isStartPage: isStartpage }
            },
          })
        }
      }
    }
  },

  /**
   * @namespace xhr
   * @memberof app
   * @desc
   */
  xhr: {

    currentRequest: null,
    currentAsset: { loaded: 0, total: 1 },

    start: function () {

      var open = XMLHttpRequest.prototype.open,
        send = XMLHttpRequest.prototype.send

      XMLHttpRequest.prototype.open = function () {
        this.onreadystatechange = function () {
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
              cache = options.cache

            if (cache && (statusType.success || statusType.redirect)) {
              app.caches.set(cache.type, cache.keyType, cache.key, this.responseText, cache.format)
            }

            if (type) {
              switch (type) {
                case 'page':
                  var responsePage = dom.parse.text(this.responseText),
                    responsePageTitle = dom.find(responsePage, 'title').textContent,
                    templateElement = dom.find(responsePage, 'template'),
                    templateAttr = templateElement && templateElement.attributes,
                    elementSrcDoc = templateAttr && templateAttr.srcdoc && templateAttr.srcdoc.value,
                    elementSrc = templateAttr && templateAttr.src && templateAttr.src.value,
                    templateSrcDoc = elementSrcDoc || false,
                    templateSrc = elementSrc && elementSrc.split(';') || []

                  app.modules.total = 0
                  app.templates.total = 0
                  app.templates.loaded = 0
                  app.vars.total = 0
                  app.xhr.currentAsset.loaded = 0

                  app.srcTemplate = {
                    url: {
                      srcDoc: templateSrcDoc,
                      src: templateSrc
                    },
                    page: true,
                    total: templateSrc.length + (templateSrcDoc ? 1 : 0)
                  }
                  dom.doctitle(responsePageTitle)
                  dom.bind.include = ''
                  app.assets.get.templates()
                  break
                case 'var':
                  app.vars.loaded++
                  break
                case 'template':
                  app.templates.loaded++
                  if (app.templates.loaded === app.srcTemplate.total) {
                    app.templates.render()
                    app.assets.get.modules()
                  }
                  break
                case 'data':
                  if (app.xhr.currentAsset.total === 1) {
                    app.xhr.currentAsset.loaded = 0
                  }
                  app.xhr.currentAsset.loaded++
                  if (app.xhr.currentAsset.loaded === app.xhr.currentAsset.total) {
                    var run = this.options.onload2.run
                    app.module[type]._run(run.arg)
                    //app.call(run.func, run.arg)
                    console.error('run' + app.xhr.currentAsset.loaded + '/' + app.xhr.currentAsset.total)
                  }
                  break
                default:
                  return
              }

              if (app.vars.loaded === (app.vars.total + app.vars.totalStore)
                && app.modules.loaded === app.modules.total
                && type !== 'template' && type !== 'data') {
                /*
                console.log('Vars loaded:', app.vars.loaded + '/' + (app.vars.total + app.vars.totalStore))
                console.log('Modules loaded:', app.modules.loaded + '/' + app.modules.total)
                */
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

        loader = onprogress && onprogress.preloader ? onprogress.preloader : false,
        type = options.type,
        timeout = onload ? options.onload.timeout || 0 : 0,
        run = onload && onload.run && onload.run.func ? onload.run.func.split('.') : false,
        runarg = onload && onload.run && onload.run.arg

      if (false) {
        console.dir(cache)
        console.log('hej')
      } else {

        var xhr = new XMLHttpRequest(),
          urlExtension = url.indexOf('.') !== -1 || url == '/' || options.urlExtension === false ? '' : app.fileExtension || '',
          spa = app.module.navigate || false

        xhr.options = options
        // Set headers
        /*for (var header in headers) {
          if (headers.hasOwnProperty(header)) xhr.setRequestHeader(header, headers[header])
        }*/

        if (single) {
          if (this.currentRequest) this.currentRequest.abort()
          this.currentRequest = xhr
        }

        xhr.onabort = function () {
          if (spa && loader) spa._preloader.reset()
        }

        xhr.onprogress = function (e) {
          if (spa && type === 'page') spa._preloader.load(e, true)
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
              if (run) app.call(run, runarg)
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

    defaultExclude: ['alt', 'class', 'height', 'id', 'name', 'src', 'style', 'title', 'width'],

    /**
     * @function run
     * @memberof app
     * @param {string|Object} [selector='html *'] - A CSS selector or an object representing elements to be processed.
     * @param {Array} [exclude] - An array of items to be excluded from processing.
     * @desc Runs Front Text Markup Language in elements matching the given selector or provided object.
     */
    run: function (selector, exclude) {
      var selector = selector || 'html *',
        node = typeof selector === 'string' ? dom.get(selector, true) : selector,
        excludes = (exclude || []).concat(this.defaultExclude)

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
        if (app.docMode > 0 && app.docMode <= 11) {
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
      attributes: function (object, clonedObject, replaceVariable, replaceValue, reset) {
        var originalAttributes = []
        var originalContent = clonedObject.innerHTML

        for (var i = 0; i < object.attributes.length; i++) {

          var attr = object.attributes[i]

          originalAttributes.push({
            name: attr.name,
            value: attr.value
          })

          if (attr.name === 'bind') continue
          var regex = new RegExp('\\{\\s*' + replaceVariable + '\\s*\\}', 'g')
          object.setAttribute(attr.name, attr.value
            .replace(/{[^}]*:\s*([^}]+)?}/, replaceValue || '$1')
            .replace(regex, replaceValue)
          )
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
      var query = parser.search.substring(1),
        vars = query.split('&')

      for (var i = 0, len = vars.length; i < len; i++) {
        var pair = vars[i].split('='),
          key = decodeURIComponent(pair[0]),
          value = decodeURIComponent(pair[1] || '')
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
    elements: { 'header': '', 'aside:nth-of-type(1)': '', 'main': '', 'aside:nth-of-type(2)': '', 'footer': '' },

    render: function () {
      app.log.info()('Rendering templates...')
      var currentPageTitle = document.title,
        currentPageBodyContent = document.body.innerHTML,
        isReload = app.srcTemplate.page,
        srcDoc = app.srcTemplate.url.srcDoc,
        src = app.srcTemplate.url.src

      if (srcDoc) {
        var cache = app.caches.get('window', 'template', srcDoc),
          responsePage = dom.parse.text(cache.data, ['title']),
          responsePageScript = dom.find(responsePage, app.script.selector),
          responsePageContent = responsePage.innerHTML,
          responsePageContentClass = responsePage.className

        for (var el in this.elements) {
          var parsedEl = dom.find(responsePage, el),
            content = parsedEl.innerHTML

          this.elements[el] = parsedEl.classList
          if (el !== 'main') dom.set(el, content ? content : '')
        }

        if (!isReload) {
          var scriptAttr = responsePageScript.attributes,
            modules = scriptAttr.module && scriptAttr.module.value.split(';') || [],
            vars = scriptAttr.var && scriptAttr.var.value.split(';') || []

          app.language = responsePage.attributes.lang ? responsePage.attributes.lang.value : app.language
          app.script.element = responsePageScript

          app.modules.name = modules
          app.modules.total = modules.length

          app.vars.name = vars
          app.vars.total = vars.length

          if (app.docMode > 0 && app.docMode < 10) {
            document.open()
            document.write(responsePageContent)
            document.close()
          } else {
            dom.set('html', responsePageContent)
          }

          dom.set('main', currentPageBodyContent)
        }
      }

      if (src) {
        for (var i = 0; i < src.length; i++) {
          var cache = app.caches.get('window', 'template', src[i]),
            html = dom.parse.text(cache.data),
            template = dom.parse.text(dom.find(html, 'template').innerHTML)

          for (var el in this.elements) {
            var parsedEl = dom.find(template, el),
              content = parsedEl.innerHTML,
              classList = parsedEl.classList

            dom.get(el).classList = classList && classList.length > 0 ? classList : this.elements[el]

            if (content) {
              dom.set(el, content)
              if (dom.get('template')) app.attributes.run(el + ' *')
            }
          }
        }
      }

      document.body.className = responsePageContentClass
      dom.doctitle(currentPageTitle)
    }
  }
}


document.addEventListener('DOMContentLoaded', app.start)