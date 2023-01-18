var app = {
  // existing properties and methods...
  module: {},
  plugin: {},
  queue: [],

  log: function () {
    if (app.debug) Function.prototype.bind.call(console.log, console, '❚').apply(console, arguments)
  },
  error: Function.prototype.bind.call(console.error, '', 'Syntax not found:'),
  language: document.documentElement.lang,
  title: document.title,
  isFrontpage: document.doctype,
  isLocalNetwork: window.location.hostname.match(/localhost|[0-9]{2,3}\.[0-9]{2,3}\.[0-9]{2,3}\.[0-9]{2,3}|::1|\.local|^$/gi),

  /**
   * Start the application.
   * @function
   */
  start: function () {
    app.currentScript = dom.get('script[src*=que]')
    app.debug = true
    isFrontpage: document.doctype,
    app.fileExtension = '.html'

    app.isFrontpage ? app.loadExtensions(app.runAttributes()) : app.loadTemplates()
    console.log('Runnin queue...')
    

    console.log('finish')
  },

   /**
   * Load extensions.
   * @function
   */
   loadExtensions: function (callback) {
    app.log('Loading modules...')

    var scriptElement = this.currentScript,
      values = scriptElement.getAttribute('module'),
      value = values ? values.split(';') : 0,
      total = value.length,
      loaded = 0

    /*var attributes = scriptElement.attributes;
    var confs = {}
    for (var i = 0; i < attributes.length; i++) {
      var name = attributes[i].name;
      if (name.match(/conf$/)) {
        confs[name] = attributes[i].value;
      }
    }

    console.error(confs)*/

    for (var i = 0; i < total; i++) {
      var script = document.createElement('script')
      script.name = value[i]
      script.src = 'modules/' + script.name + '.js'
      script.async = false
      script.onload = function () {
        app.log('› ' + this.name)
        loaded++
        if (app.module[this.name]._autoload) app.module[this.name]._autoload(scriptElement)
        if (total == loaded && callback) callback()
      }

      document.head.appendChild(script)
    }

    if (!total && callback) callback()
  },

  loadTemplates: function () {


    var xhr = app.xhr({
      url: 'index' + app.fileExtension,
      onload: { module: 'app', func: 'loadTemplates', arg: 'ss' }
    })
    app.pushToqueue(xhr);

    var xhr2 = app.xhr({
      url: 'quetemplate.html',
      onload: { module: 'app', func: 'loadTemplates', arg: 'ss' }
    })

    app.pushToqueue(xhr2);
    app.processQueue(app.runAttributes())
  },

  processQueue: function (onComplete) {
    if (app.queue.length > 0) {
      var currentXHR = app.queue.shift();
      currentXHR.onload = function () {
        app.processQueue(onComplete);
      }
      currentXHR.send();
    } else {
      if (onComplete) {
        console.log('whatt')
        onComplete();
      }
    }
  },

  /**
   * Push xhr request to the queue
   * @function
   */
  pushToqueue: function (xhr) {
    app.queue.push(xhr)
    console.dir(xhr)
  },


  xhr: function (state) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', state.url);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        // success
        var data = xhr.responseText;
        if (state.onload) {
          for (var i = 0; i < state.onload.length; i++) {
            var load = state.onload[i];
            app.module[load.module][load.func](data, load.arg);
          }
        }
      } else {
        // error
        console.error(xhr.status + ': ' + xhr.statusText);
      }
    };
    return xhr;
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
            app.module[name[0]][name[1]] ? app.module[name[0]][name[1]](element) : app.error(name[0] + '-' + name[1])
          } else if (dom[name]) {
            app.log('› dom.' + name)
            dom[name](element, value)
          }
        }
      }
    }
  },

  getConfig: function () {
    var attr = app.currentScript ? app.currentScript.getAttribute('conf') : ''
    return dom.parseAttribute(attr)
  },

  parseConfig: function (module, standard, element) {
    var attributeName = module ? module + '-' : ''
    value = element ? element.getAttribute(attributeName + 'conf') : '',
      override = value ? dom.parseAttribute(value) : {},
      final = {}

    for (var prop in standard) {
      final[prop] = override.hasOwnProperty(prop) ? override[prop] : standard[prop]
    }
    return final
  },
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

  parseAttribute: function (string) {
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
  app.start()
})