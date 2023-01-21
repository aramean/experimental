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
  language: document.documentElement.lang,
  title: document.title,
  isFrontpage: document.doctype,
  isLocalNetwork: window.location.hostname.match(/localhost|[0-9]{2,3}\.[0-9]{2,3}\.[0-9]{2,3}\.[0-9]{2,3}|::1|\.local|^$/gi),
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
     * @desc Logs information to the console with a prefix '❚' if app.debug is set to 'true'.
     */
    info: function () {
      return (app.debug === 'true') ? console.info.bind(console, '❚') : function () { }
    },

    /**
     * @function error
     * @memberof app.log
     * @returns {function} - The console.error() function or a no-op function if app.debug is not set to 'true'.
     * @desc Logs errors to the console if app.debug is set to 'true'.
     */
    error: function () {
      return (app.debug === 'true') ? console.error.bind(console) : function () { }
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
      var element = scriptElement ? scriptElement : dom.get(app.scriptSelector),
        config = this.get(false, {
          debug: false,
          fileExtension: '.html'
        }, element)

      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          app[prop] = config[prop]
        }
      }
    }
  },

  /**
   * @function loadExtensions
   * @memberof app
   * @param {function} [callback=null] - A callback function to be called when all modules are loaded.
   * @desc Loads extensions(modules) from the `module` attribute of the script element and call autoload function if exists.
   */
  loadExtensions: function (callback) {
    app.log.info()('Loading modules...')

    var scriptElement = dom.get(app.scriptSelector),
      values = scriptElement.getAttribute('module'),
      value = values ? values.split(';') : 0,
      total = value.length,
      loaded = 0

    for (var i = 0; i < total; i++) {
      var script = document.createElement('script')
      script.name = value[i]
      script.src = 'modules/' + script.name + '.js'
      script.async = false
      script.onload = function () {
        app.log.info()('› ' + this.name)
        loaded++
        if (app.module[this.name]._autoload) {
          app.module[this.name]._autoload({
            element: scriptElement,
            onload: this.total == this.loaded ? [{ module: 'app', func: 'runAttributes' }] : ''
          })
        }
      }

      document.head.appendChild(script)
    }

    if (!total && callback) callback()
  },

  /**
   * @function loadTemplates
   * @memberof app
   * @param {object} [options={}] - Object that contains options for the loadTemplates function.
   * @desc Loads templates from the `template` elements with `srcdoc` or `src` attributes and call renderTemplates function if available.
   */
  loadTemplates: function (options) {
    app.log.info()('Loading templates...')
    var options = (options) ? options : {},
      element = dom.get('template'),
      srcdoc = !element.length ? element.getAttribute('srcdoc') : '',
      src = !element.length ? element.getAttribute('src') : ''

    if (srcdoc || src) {
      app.log.info()('› ' + srcdoc + ';' + src)

      var srcdocValue = srcdoc ? srcdoc.split(';') : [],
        srcValue = src ? src.split(';') : []

      app.xhr({
        url: (srcdocValue && !options.disableSrcdoc) ? srcdocValue.concat(srcValue) : srcValue,
        onload: { module: 'app', func: 'renderTemplates', arg: options }
      })
    }

    if (!element || element && !src) app.runAttributes()
  },

  /**
   * @function renderTemplates
   * @memberof app
   * @param {object} options - An object that contains data needed for the renderTemplates function.
   * @param {object} options.data - The data that contains the templates to be rendered.
   * @param {boolean} [options.arg.runAttributes=false] - A flag that indicates whether to call the runAttributes function or not.
   * @desc Renders the templates by setting the innerHTML of the corresponding DOM elements and calls the loadExtensions function if available.
   */
  renderTemplates: function (options) {
    app.log.info()('Rendering templates...')
    var currentPageBody = document.body.innerHTML

    for (var i = 0; i < options.data.length; i++) {
      var responsePageContent = dom.parse.text(options.data[i]),
        responsePageHtml = dom.find(responsePageContent, 'html'),
        responsePageScript = dom.find(responsePageContent, app.scriptSelector)

      if (responsePageContent.doctype) {
        app.config.set(responsePageScript)
        dom.set(document.documentElement, responsePageContent.documentElement.innerHTML)
        dom.set('main', currentPageBody)
        app.language = responsePageContent.documentElement.lang
        app.loadExtensions(app.runAttributes)
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

    if (options.arg.runAttributes) app.runAttributes()
  },

  /**
   * @function xhr
   * @memberof app
   * @desc Creates XHR requests and updates the DOM based on the response.
   */
  xhr: function (options) {
    var responses = [],
      loaded = 0,
      url = options.url instanceof Array ? options.url : [options.url],
      total = url.length,
      target = options.target ? dom.get(options.target) : options.element,
      onload = options.onload,
      timeout = onload ? options.onload.timeout || 0 : 0,
      onprogress = options.onprogress,
      onerror = options.onerror,
      response = options.response

    for (var i = 0; i < total; i++) {
      (function (i, url) {
        var url = url[i],
          urlExtension = url.indexOf('.') !== -1 || url == '/' || options.urlExtension === false ? '' : app.fileExtension

        var xhr = new XMLHttpRequest()
        xhr.open('GET', url + urlExtension)
        xhr.send()

        xhr.onprogress = function () {
          if (onprogress) dom.set(target, onprogress.content)
        }

        xhr.onerror = function () {
          if (onerror) dom.set(target, onerror)
        }

        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 204) {
            setTimeout(function () {
              responses[i] = xhr.responseText
              loaded++

              if (target) dom.set(target, xhr.response)
              if (response) app.module[response].$response = JSON.parse(xhr.responseText)

              if (onload && loaded === total) {
                if (onload.func === 'renderTemplates') {
                  window[onload.module][onload.func]({ data: responses, arg: onload.arg })
                } else {
                  for (var j = 0; j < onload.length; j++) {
                    window[onload[j].module][onload[j].func](onload[j].arg)
                  }
                }
              }
            }, timeout)
          } else {
            if (target) dom.set(target, xhr.statusText)
          }
        }
      })(i, url)
    }
  },

  /**
   * @function runAttributes
   * @memberof app
   * @param {string} [selector='html *'] - A CSS selector for the elements to be processed.
   * @desc Runs Front Text Markup Language in all elements matching a given selector.
   */
  runAttributes: function (selector) {
    var selector = selector || 'html *',
      node = dom.get(selector, true)
    app.log.info()('Running attributes ' + selector + ' ...')

    for (var i = 0; i < node.length; i++) {
      var element = node[i],
        run = element.attributes.run ? element.attributes.run.value : '',
        include = element.attributes.include ? element.attributes.include.value : ''

      if (include) dom.setUniqueId(element)

      if (run !== 'false') {
        for (var j = 0; j < element.attributes.length; j++) {
          var name = element.attributes[j].name.split('-'),
            value = element.attributes[j].value

          if (app.module[name[0]] && name[1]) {
            app.log.info()('› module.' + name)
            app.module[name[0]][name[1]] ? app.module[name[0]][name[1]](element) : app.log.error()(name[0] + '-' + name[1])
          } else if (dom[name]) {
            app.log.info()('› dom.' + name)
            dom[name](element, value)
          }
        }
      }
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
        type == 'checkbox' ? target.checked = value : target.value = value;
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
    app.xhr({
      element: element,
      url: element.attributes.include.value,
      onload: [{ module: 'app', func: 'runAttributes', arg: '#' + element.id + ' *' }],
    })
  }
}

window.addEventListener('popstate', function (event) {
  if (app.module.navigate) app.module.navigate._pop(event)
})

document.addEventListener('click', function (event) {
  if (app.module.navigate) app.module.navigate._open(event)
})

document.addEventListener('DOMContentLoaded', function () {
  app.config.set(dom.get(app.scriptSelector))
  app.isFrontpage ? app.loadExtensions(app.runAttributes) : app.loadTemplates()
})