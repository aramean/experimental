document.addEventListener('DOMContentLoaded', function () {
  app.init()
})

window.addEventListener('load', function () {
  app.load()
})

window.addEventListener('popstate', function (event) {
  if (app.library.navigate) app.library.navigate.pop(event)
})

document.addEventListener('click', function (event) {
  if (app.library.navigate) app.library.navigate.open(event)
})

var app = {
  debug: true,
  fileExtension: '.html',
  isFrontpage: document.doctype,
  library: {},

  init: function () {
    console.log('Initializing application...')
    if (app.isFrontpage) {
      app.loadLibraries()
    } else {
      app.loadTemplates()
    }
  },

  load: function () {
    console.log('Starting application...')
    if (app.isFrontpage) {
      app.runAttributes()
    }
  },

  loadLibraries: function (execute) {
    console.log('Loading libraries...')
    var script = dom.get('script[src*=front]'),
      values = script.getAttribute('lib'),
      value = (values) ? values.split(';') : 0,
      total = value.length,
      loaded = 0

    for (var i = 0; i < value.length; i++) {
      var script = document.createElement('script')
      script.name = value[i]
      script.src = 'lib/' + script.name + '.js'
      script.async = false
      script.onload = function () {
        console.log("› " + this.name)
        loaded++
        if (execute && loaded == total) {
          app.runAttributes()
        }
      }

      document.head.appendChild(script)
    }
  },

  loadTemplates: function () {
    console.log('Loading templates...')
    var element = dom.get('template')
    if (element) {
      var attr = element.getAttribute('src'),
        src = attr.split(';')

      app.xhr2({
        urls: src,
        onsuccess: { function: 'app', method: 'renderTemplates' }
      })

    }
  },

  renderTemplates: function (responses) {
    var currentPageBody = document.body.innerHTML

    for (var i = 0; i < responses.length; i++) {
      var responsePageContent = dom.parse(responses[i]),
        responsePageHtml = dom.find(responsePageContent, 'html')

      if (responsePageContent.doctype) {
        dom.set(document.documentElement, responsePageContent.documentElement.innerHTML)
        dom.set('main', currentPageBody)
        app.loadLibraries(true)
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
  },


  xhr2: function (options) {
    var responses = [],
      loaded = 0,
      total = options.urls.length,
      target = options.target ? dom.get(options.target) : options.element,
      load = options.onload,
      timeout = load ? options.timeout || 0 : 0,
      progress = options.onprogress,
      error = options.onerror,
      success = options.onsuccess

    for (var i = 0; i < total; i++) {
      (function (i) {
        var url = options.urls[i],
          urlExtension = (url.indexOf('.') !== -1) ? '' : app.fileExtension

        var xhr = new XMLHttpRequest()
        xhr.open('GET', url + urlExtension)
        xhr.send()

        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 204) {
            responses[i] = xhr.responseText
            loaded++
            if (loaded === total) {
              if (success) window[success.function][success.method](responses)
            }
          } else {
            // Handle any errors here
          }
        }

        xhr.onloadstart = function () {
          //dom.setDisplay('none')
        }

        xhr.onloadend = function () {
          //dom.setDisplay('')
        }

        xhr.onprogress = function () {
          if (progress) dom.set(target, progress.content)
        }

        xhr.onerror = function () {
          if (error) dom.set(target, error)
        }
      })(i)
    }
  },

  xhr: function (request) {
    var target = request.target ? dom.get(request.target) : request.element,
      onprogress = request.onprogress,
      onerror = request.onerror,
      onload = request.onload,
      onloaded = request.onloadend,
      timeout = onload ? onload.timeout || 0 : 0,
      url = request.url,
      urlExtension = (url.indexOf('.') !== -1 || request.urlExtension === false) ? '' : app.fileExtension

    var xhr = new XMLHttpRequest()
    xhr.open(request.method || 'GET', url + urlExtension)
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
          if (target) dom.set(target, xhr.response)
          if (onload && onload.func) window[onload.module][onload.func](onload.arg)
        }, timeout)
      } else {
        dom.set(target, (onerror && onerror.content) ? onerror.content : xhr.statusText)
      }
    }

    xhr.onloadend = function () {
      if (onloaded) {
      }
    }
  },

  runAttributes: function (selector) {
    console.log('Running attributes ' + selector + ' ...')

    var node = dom.get(selector || 'html *', true)

    for (var i = 0; i < node.length; i++) {
      var element = node[i],
        run = (element.attributes.run) ? element.attributes.run.value : ''
      if (run !== 'false') {
        for (var j = 0; j < element.attributes.length; j++) {
          var attribute = element.attributes[j].name
          var value = element.attributes[j].value

          if (app.library[attribute]) {
            console.log('› library.' + attribute)
            app.library.jsonsource(element)
          } else if (dom[attribute]) {
            console.log('› dom.' + attribute)
            dom[attribute](element, value)
          }
        }
      }
    }
  },
}

var dom = {
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
    return element.length == 1 && !list ? element[0] : element
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
   * @return {void}
   */
  setDisplay: function (action) {
    document.documentElement.style.display = action
  },

  /**
   * Set the content of an element.
   * 
   * @function
   * @param {Object} object - The element object to modify.
   * @param {string} value - The value to set as the content of the element.
   * @param {boolean} [replace=false] - If true, remove all HTML tags from the value before setting it as the content.
   * @return {void}
  */
  set: function (object, value, replace) {
    var target = (object instanceof Object) ? object : dom.get(object)
    tag = object.localName,
      type = object.type,
      value = (replace) ? value.replace(/<[^>]+>/g, '') : value

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
   * @return {void} 
   */
  uppercase: function (object, first) {
    object.innerHTML = (!first || first === 'true') ? object.innerHTML.toUpperCase() : object.innerHTML.charAt(0).toUpperCase() + object.innerHTML.slice(1)
  },

  /**
   * Convert the contents of an element to lowercase letters.
   * 
   * @function
   * @param {Object} object - The element object to modify.
   * @return {void}
   */
  lowercase: function (object) {
    object.innerHTML = object.innerHTML.toLowerCase()
  },

  /**
   * Finds the first ancestor of the given element that is an anchor element (`<a>`).
   * 
   * @param {Element} element - The element to start the search from.
   * @return {Element|null} The found anchor element, or `null` if none was found.
   */
  getTagLink: function (element) {
    while (element) {
      if (element.localName === "a") {
        return element
      }
      element = element.parentNode
    }
    return null
  },

  /**
   * Load the content of an external file and insert it into the DOM.
   * @function
   * @param {Object} element - The element to which the external content will be added.
   * @return {void}
   */
  include: function (element) {
    element.id = 'i' + (performance.now() + Math.random()).toString().replace('.', '')
    app.xhr({
      element: element,
      url: element.attributes.include.value,
      onload: { module: 'app', func: 'runAttributes', arg: '#' + element.id + ' *' },
    })
  }
}