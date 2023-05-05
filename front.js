/**
 * @license
 * Copyright (c) Aleptra
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT-style license found in the 
 * LICENSE file in the root directory of this source tree.
 */

var app = {
  module: {},
  plugin: {},
  var: {},
  language: document.documentElement.lang,
  title: document.title,
  isFrontpage: document.doctype,
  baseUrl: '',
  isLocalNetwork: /localhost|127\.0\.0\.1|::1|\.local|^$/i.test(location.hostname),
  scriptSelector: 'script[src*=front]',

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
      var element = scriptElement ? scriptElement : dom.get(app.scriptSelector),
        config = this.get(false, {
          debug: false,
          debugLocalhost: false,
          fileExtension: '.html'
        }, element)

      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          app[prop] = config[prop]
        }
      }
    }
  },

  listeners: {
    add: function (binding, type, value) {
      binding.addEventListener(type, function () {
        console.log('test')
      })
    }
  },

  /**
   * @namespace assets
   * @memberof app
   * @desc
   */
  assets: {

    load: function () {
      app.log.info()('Loading assets...')
      this.get.vars()
      this.get.modules()
    },

    get: {
      vars: function () {
        app.log.info(1)('Loading vars...')

        var scriptElement = dom.get(app.scriptSelector),
          vars = scriptElement.attributes.var ? scriptElement.attributes.var.value.split(';') : false,
          varsTotal = vars.length || 0,
          varsLoaded = 0

        for (var j = 0; j < varsTotal; j++) {
          app.log.info(1)(vars[j])
          varsLoaded++
          app.xhr.get({
            url: 'assets/json/vars/' + vars[j] + '.json',
            response: 'test',
            onload: {
              run: { func: 'app.assets.set.vars', arg: vars[j] }
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

        var scriptElement = dom.get(app.scriptSelector),
          modules = scriptElement.attributes.module ? scriptElement.attributes.module.value.split(';') : false,
          modulesTotal = modules.length || 0,
          modulesLoaded = 0

        for (var i = 0; i < modulesTotal; i++) {
          var script = document.createElement('script')
          script.name = modules[i]
          script.src = 'modules/' + script.name + '.js'
          script.async = false
          script.onload = function () {
            app.log.info(1)(this.name)
            modulesLoaded++
            app.module[this.name].conf = function () { }
            if (app.module[this.name]._autoload) {
              app.module[this.name]._autoload({
                element: scriptElement,
                onload: this.modulesTotal == this.modulesLoaded ? { run: { func: 'app.attributes.run' } } : ''
              })
            }
          }

          document.head.appendChild(script)
        }

        if (!modulesTotal) app.attributes.run()
      },
    },

    set: {
      vars: function (arg) {
        app.var[arg] = this.$response
      }
    },
  },

  /**
   * @namespace templates
   * @memberof app
   * @desc
   */
  templates: {

    /**
     * @function load
     * @memberof app
     * @param {object} [options={}] - Object that contains options for the loadTemplates function.
     * @desc Loads templates from the `template` elements with `srcdoc` or `src` attributes and call renderTemplates function if available.
     */
    load: function (options) {
      app.log.info()('Loading templates...')
      var options = (options) ? options : {},
        element = dom.get('template'),
        srcdoc = element && element.getAttribute('srcdoc'),
        src = element && element.getAttribute('src')

      if (srcdoc || src) {
        app.log.info(1)(srcdoc + ';' + src)

        var srcdocValue = srcdoc ? srcdoc.split(';') : [],
          srcValue = src ? src.split(';') : []

        app.xhr.get({
          url: (srcdocValue && !options.disableSrcdoc) ? srcdocValue.concat(srcValue) : srcValue,
          onload: { run: { func: 'app.templates.render', arg: options } }
        })
      }

      if (options.runAttributes && !src) app.attributes.run()
    },

    /**
     * @function render
     * @memberof app
     * @param {object} options - An object that contains data needed for the renderTemplates function.
     * @param {object} options.data - The data that contains the templates to be rendered.
     * @param {boolean} [options.arg.runAttributes=false] - A flag that indicates whether to call the runAttributes function or not.
     * @desc Renders the templates by setting the innerHTML of the corresponding DOM elements and calls the loadExtensions function if available.
     */
    render: function (options) {
      app.log.info()('Rendering templates...')
      var currentPageBody = document.body.innerHTML,
        data = options.data || []

      for (var i = 0; i < data.length; i++) {
        var responsePageContent = dom.parse.text(options.data[i]),
          responsePageHtml = dom.find(responsePageContent, 'html'),
          responsePageScript = dom.find(responsePageContent, app.scriptSelector)

        if (responsePageContent.doctype) {
          dom.set(document.documentElement, responsePageContent.documentElement.innerHTML)
          dom.set('main', currentPageBody)
          app.language = responsePageContent.documentElement.lang
          app.config.set(responsePageScript)
          app.assets.load()
        } else {

          var template = dom.parse.text(dom.find(responsePageHtml, 'template').innerHTML),
            templateHeader = dom.find(template, 'header').innerHTML,
            templateAside0 = dom.find(template, 'aside:nth-of-type(1)').innerHTML,
            templateAside1 = dom.find(template, 'aside:nth-of-type(2)').innerHTML,
            templateFooter = dom.find(template, 'footer').innerHTML

          if (templateHeader) dom.set('header', templateHeader)
          if (templateAside0) dom.set('aside:nth-of-type(1)', templateAside0)
          if (templateAside1) dom.set('aside:nth-of-type(2)', templateAside1)
          if (templateFooter) dom.set('footer', templateFooter)
        }
      }

      if (options.arg.runAttributes) app.attributes.run()
    },
  },

  /**
   * @namespace xhr
   * @memberof app
   * @desc
   */
  xhr: {

    currentRequest: null,

    /**
     * @function xhr
     * @memberof app
     * @desc Creates XHR requests and updates the DOM based on the response.
     */
    get: function (options) {
      var responses = [],
        loaded = 0,
        url = options.url instanceof Array ? options.url : [options.url],
        total = url.length,
        target = options.target ? dom.get(options.target) : options.element,
        single = options.single,
        response = options.response,

        onload = options.onload,
        onprogress = options.onprogress,
        onerror = options.onerror,

        timeout = onload ? options.onload.timeout || 0 : 0,
        preloader = onprogress && onprogress.preloader ? dom.get(onprogress.preloader) : false,
        run = onload.run && onload.run.func ? onload.run.func.split('.') : false,
        runarg = onload.run && onload.run.arg

      // Abort the previous request if it exists
      if (single && this.currentRequest) {
        this.currentRequest.abort()
      }

      for (var i = 0; i < total; i++) {
        (function (i, url) {
          var url = url[i],
            urlExtension = url.indexOf('.') !== -1 || url == '/' || options.urlExtension === false ? '' : app.fileExtension

          var xhr = new XMLHttpRequest()
          xhr.open('GET', url + urlExtension, true)

          if (single) app.xhr.currentRequest = xhr

          xhr.onabort = function () {
            if (preloader && app.module.navigate) app.module.navigate._preloader.reset(preloader)
          }

          xhr.onprogress = function (e) {
            if (preloader && app.module.navigate) app.module.navigate._preloader.load(preloader, e)
            if (onprogress) target ? dom.set(target, onprogress.content) : ''
          }

          xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 204) {
              //setTimeout(function () {
              responses[i] = xhr.responseText
              loaded++

              if (target) dom.set(target, xhr.response)

              if (response === 'test') {
                app.assets.set.$response = JSON.parse(xhr.responseText)
              } else if (response) {
                app.module[response].$response = JSON.parse(xhr.responseText)
              }

              if (onload && loaded === total) {

                if (run) {
                  app.log.info()('Calling: ' + run)

                  runarg = run[1] === 'templates' && run[2] === 'render' ? { data: responses, arg: runarg } : runarg

                  if (run.length === 4)
                    window[run[0]][run[1]][run[2]][run[3]](runarg)
                  else if (run.length === 3)
                    window[run[0]][run[1]][run[2]](runarg)
                  else if (run.length === 2)
                    window[run[0]][run[1]](runarg)
                }
              }
              //}, timeout)
            } else {
              if (target) dom.set(target, xhr.statusText)
            }
          }

          xhr.onerror = function () {
            if (onerror && target) dom.set(target, onerror)
          }

          xhr.send()
        })(i, url)
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

      app.log.info()('Running attributes ' + selector + ' ...')
      for (var i = 0; i < node.length; i++) {
        var element = node[i],
          run = element.attributes.run ? element.attributes.run.value : false,
          stop = element.attributes.stop ? element.attributes.stop.value.split(';') : false,
          include = element.attributes.include ? element.attributes.include.value : '',
          exclude = stop && excludes.indexOf('stop') === -1 ? exclude.concat(stop) : excludes

        if (include) dom.setUniqueId(element)

        if (run !== 'false') {
          for (var j = 0; j < element.attributes.length; j++) {
            var attributeName = element.attributes[j].name,
              name = element.attributes[j].name.split('-'),
              value = element.attributes[j].value

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
  }
}

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
      return new DOMParser().parseFromString(string, 'text/html')
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

  bind: function (object, value) {
    var attributes = object.attributes,
      innerHTML = object.innerHTML,
      type = object.tagName.toLowerCase(),
      binding = object.getAttribute('bind'),
      clonedObject = object.cloneNode(true)

    if (binding.indexOf(':') !== -1) {
      var bindings = binding.split(';')

      for (var i = 0; i < bindings.length; i++) {
        var bindingParts = bindings[i].split(':'),
          replaceVariable = bindingParts[0].trim(),
          replaceValue = bindingParts[1].trim(),
          target = replaceValue.substr(1),
          regex = new RegExp('{' + replaceVariable + '}|\\b' + replaceVariable + '\\b', 'g')

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
          var keys = target.split('.'),
            value = keys.reduce(function (obj, key) {
              return obj[key]
            }, app.var)

          replaceValue = value
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
          if (attr.value.indexOf('{' + replaceVariable + '}') !== -1) {
            var newValue = attr.value.replace(regex, replaceValue)
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

  /**
   * @function set
   * @memberof dom
   * @param {Object} object - The element object to modify.
   * @param {string} value - The value to set as the content of the element.
   * @param {boolean} [replace=false] - If true, remove all HTML tags from the value before setting it as the content.
   * @desc Sets the content of an element.
  */
  set: function (object, value, replace) {
    var target = object instanceof Object ? object : dom.get(object),
      tag = object.localName,
      type = object.type,
      value = replace ? value.replace(/<[^>]+>/g, '') : value || '?'

    switch (tag) {
      case 'input':
        type == 'checkbox' ? target.checked = value : target.value = value
        break
      case 'img':
        target.src = value
        break
      case 'a':
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
      onload: { run: { func: 'app.attributes.run', arg: '#' + element.id + ' *' } }
    })
  }
}

window.addEventListener('popstate', function (event) {
  if (app.module.navigate) app.module.navigate._pop(event)
})

document.addEventListener('click', function (event) {
  if (app.module.navigate) app.module.navigate._click(event)
})

document.addEventListener('DOMContentLoaded', function () {
  app.config.set(dom.get(app.scriptSelector))
  app.isFrontpage ? app.assets.load() : app.templates.load()
})