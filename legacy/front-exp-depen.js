/**
 * @license
 * Copyright (c) Aleptra
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT-style license found in the 
 * LICENSE file in the root directory of this source tree.
 */

var config = {
  debug: true,
  fileExtension: '.html',
}

var app = {
  module: {},
  plugin: {},
  dependency: {},
  log: config.debug ? Function.prototype.bind.call(console.log, console, '❚') : Function.prototype,
  isLocalNetwork: window.location.hostname.match(/localhost|[0-9]{2,3}\.[0-9]{2,3}\.[0-9]{2,3}\.[0-9]{2,3}|::1|\.local|^$/gi),
  isFrontpage: document.doctype,

  /**
   * Start the application.
   * @function
   */
  start: function () {
    app.log('Starting application...')
    app.isFrontpage ? app.loadModules(app.runAttributes) : app.loadTemplates()
  },

  /**
   * Load dependencies.
   * @function
   */
  loadDependencies: function () {
    console.log('wee')
    app.xhr({
      url: ['assets/json/globalize/en.json', 'assets/json/globalize/sv.json'],
      onload: [{ module: 'app', func: 'start' }]
    })
  },

  /**
   * Load modules.
   * @function
   */
  loadModules: function (callback) {
    app.log('Loading modules...')
    var scriptElement = dom.get('script[src*=front]'),
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
        app.log('› ' + this.name)
        loaded++
        if (total == loaded && callback) callback()
      }


    console.dir(app.dependency)
    
      document.head.appendChild(script)
    }

    if (!total && callback) callback()
  },

  /**
   * Load templates.
   * @function
   */
  loadTemplates: function (options) {
    app.log('Loading templates...')
    var options = (options) ? options : {},
      element = dom.get('template'),
      srcdoc = !element.length ? element.getAttribute('srcdoc') : '',
      src = !element.length ? element.getAttribute('src') : ''

    if (srcdoc || src) {
      app.log('› ' + srcdoc + ';' + src)

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
   * Render templates.
   * @function
   */
  renderTemplates: function (options) {
    app.log('Rendering templates...')
    var currentPageBody = document.body.innerHTML

    for (var i = 0; i < options.data.length; i++) {
      var responsePageContent = dom.parse(options.data[i]),
        responsePageHtml = dom.find(responsePageContent, 'html')

      if (responsePageContent.doctype) {
        dom.set(document.documentElement, responsePageContent.documentElement.innerHTML)
        dom.set('main', currentPageBody)
        app.loadModules(app.runAttributes)
      } else {

        var template = dom.parse(dom.find(responsePageHtml, 'template').innerHTML),
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
   * Create XHR requests and update the DOM based on the responses.
   * @function
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
      onerror = options.onerror

    for (var i = 0; i < total; i++) {
      (function (i, url) {
        var url = url[i],
          urlExtension = url.indexOf('.') !== -1 || url == '/' || options.urlExtension === false ? '' : config.fileExtension

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

              if (onload && loaded === total) {
                if (onload.func === 'renderTemplates') {
                  window[onload.module][onload.func]({ data: responses, arg: onload.arg })
                } else {
                  if (target) dom.set(target, xhr.response)
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
   * Run Front Text Markup Language in all elements matching a given selector.
   * @function
   * @param {string} [selector='html *'] - A CSS selector for the elements to be processed.
   */
  runAttributes: function (selector) {
    var selector = selector || 'html *',
      node = dom.get(selector, true)
    app.log('Running attributes ' + selector + ' ...')

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
            app.log('› module.' + name)
            app.module[name[0]][name[1]](element)
          } else if (dom[name]) {
            app.log('› dom.' + name)
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
   * Parse a string of HTML and return a DOM node.
   * 
   * @function
   * @param {string} string - The HTML string to parse.
   * @return {Node} - A DOM node representing the parsed HTML.
   */
  parse: function (string) {
    return new DOMParser().parseFromString(string, 'text/html')
  },

  /**
   * Retrieve elements from the document by selector.
   * 
   * @function
   * @param {string} selector - The CSS selector used to select the elements.
   * @param {boolean} [list=undefined] - If true, always return a list of elements, even if only one element matches the selector.
   * @return {Element|Element[]} - Returns a single element if there is only one match and "list" is not set to true, or a list of elements if "list" is set to true or if there are multiple elements that match the selector.
   */
  get: function (selector, list) {
    var element = document.querySelectorAll(selector)
    return element.length == 0 ? '' : element.length == 1 && !list ? element[0] : element
  },

  /**
   * Retrieve elements from a given node by selector.
   * 
   * @function
   * @param {Node} node - The node to search within.
   * @param {string} selector - The CSS selector used to select the elements.
   * @return {Element|Element[]} - Returns a single element if there is only one match, or a list of elements if there are multiple elements that match the selector.
   */
  find: function (node, selector) {
    var element = node.querySelectorAll(selector)
    return element.length == 1 ? element[0] : element
  },

  /**
   * Set the display property of the root element.
   * 
   * @function
   * @param {string} action - The value to set for the display property. Valid values include 'none', 'block', 'inline', and others.
   */
  setDisplay: function (action) {
    document.documentElement.style.display = action
  },

  /**
   * Set a unique id for the given element.
   * @function
   * @param {HTMLElement} element - The element to set the unique id on.
   */
  setUniqueId: function (element) {
    dom.uniqueId++
    element.id = 'id' + dom.uniqueId
  },

  /**
   * Set the content of an element.
   * 
   * @function
   * @param {Object} object - The element object to modify.
   * @param {string} value - The value to set as the content of the element.
   * @param {boolean} [replace=false] - If true, remove all HTML tags from the value before setting it as the content.
  */
  set: function (object, value, replace) {
    var target = object instanceof Object ? object : dom.get(object)
    tag = object.localName,
      type = object.type,
      value = replace ? value.replace(/<[^>]+>/g, '') : value

    switch (tag) {
      case 'input':
        if (type == 'checkbox')
          target.checked = value
        else
          target.value = value
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
   * Convert the contents of an element to uppercase letters.
   * 
   * @function
   * @param {Object} object - The element object to modify.
   * @param {boolean} [first=false] - If true, only convert the first character to uppercase. Otherwise, convert the entire contents to uppercase.
   */
  uppercase: function (object, first) {
    object.innerHTML = !first || first === 'true' ? object.innerHTML.toUpperCase() : object.innerHTML.charAt(0).toUpperCase() + object.innerHTML.slice(1)
  },

  /**
   * Convert the contents of an element to lowercase letters.
   * 
   * @function
   * @param {Object} object - The element object to modify.
   */
  lowercase: function (object) {
    object.innerHTML = object.innerHTML.toLowerCase()
  },

  /**
   * Find the first ancestor of the given element that is an anchor element (`<a>`).
   * 
   * @param {Element} element - The element to start the search from.
   * @return {Element|null} The found anchor element, or `null` if none was found.
   */
  getTagLink: function (element) {
    for (var current = element; current; current = current.parentNode) {
      if (current.localName === 'a')
        return current
    }
    return null
  },

  /**
   * Load the content of an external file and insert it into the DOM.
   * @function
   * @param {Object} element - The element to which the external content will be added.
   */
  include: function (element) {
    app.xhr({
      element: element,
      url: element.attributes.include.value,
      onload: [{ module: 'app', func: 'runAttributes', arg: '#' + element.id + ' *' }],
    })
  }
}

document.addEventListener('DOMContentLoaded', function () {
  app.loadDependencies()
})

window.addEventListener('popstate', function (event) {
  if (app.module.navigate) app.module.navigate.pop(event)
})

document.addEventListener('click', function (event) {
  if (app.module.navigate) app.module.navigate.open(event)
})