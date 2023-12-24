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

    if (selector.clicked) {
      selector = selector.clicked
    }

    var regex = /\[(\d+)\]/,
      match = selector && selector.match(regex)

    if (match) {
      var index = match[1],
        selector = selector.replace(regex, '')
    }

    var elements = document.querySelectorAll(selector)

    if (elements.length === 0)
      return ''
    else if (match)
      return elements[index]
    else
      return list ? elements : (elements.length === 1 ? elements[0] : elements)
  },

  /**
   * @function toggle
   * @memberof dom
   */
  toggle: function (selector) {
    var el = dom.get(selector),
      ontoggle = el.attributes.ontoggle && el.attributes.ontoggle.value

    if (!el.originalClassList) {
      el.originalClassList = [].slice.call(el.classList).join(' ')
    }

    var match = el.originalClassList.match(/(\S+)\s*_dn\b/)
    if (match) el.classList.toggle(match[0])

    if (ontoggle) {
      var normalize = ontoggle.replace(']', '').split('['),
        func = ('app.' + normalize[0]).split('.'),
        arg = { selector: selector, val: normalize[1] }
      app.call(func, arg)
    }
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

    // click or not
    if (object.clicked) {
      var value = object.value,
        target = object.clicked,
        tag = target.localName
    } else {
      var target = object instanceof Object ? object : dom.get(object),
        tag = object.localName,
        type = object.type,
        value = strip ? value.replace(/<[^>]+>/g, '') : value || ''
    }

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

  resize: function (object, value) {
    object.style.resize = value
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
      attr = object.callAttribute,
      char = value || ' '

    switch (attr) {
      case 'trimleft':
        regex = '^[' + char + '\\t]+'
        break
      case 'trimright':
        regex = '[' + char + '\\t]+$'
        break
      default:
        regex = '^[' + char + '\\t]+|[' + char + '\\t]+$'
    }

    object.innerHTML = object.innerHTML.replace(new RegExp(regex, 'g'), '')
  },

  insert2: function (object, value) {

    var attr = object.callAttribute,
      tag = object.localName,
      insert = attr && attr.replace('insert', '')

    var normal = insert === '2' ? value : '',
      afterbegin = insert === 'afterbegin' ? value : '',
      beforeend = insert === 'beforeend' ? value : ''

    if (afterbegin || beforeend || normal) {
      switch (tag) {
        case 'input':
          object.value = afterbegin + object.value + beforeend
          app.change('input', object, false)
          break
        case 'img':
          var src = object.getAttribute('src')
          if (src) object.src = afterbegin + src + beforeend
          break
        case 'a':
          object.href = afterbegin + object.href + beforeend
          break
        case 'select':
          object.setAttribute('select', value)
          break
        default:
          object.textContent = afterbegin + object.textContent + beforeend
      }
    } else {
      object.insertAdjacentText(insert, value)
    }
  },

  insert: function (object, value) {
    var tag = object.localName,
      pos,
      text,
      afterbegin,
      beforebegin

    // click or not
    if (object.clicked) {
      var obj = object.clicked.split(';')
      pos = obj[0]
      part2 = obj[1]

      var identifier = part2.match(/([^[]+)\[(\S+)\]/)
      var target = dom.get(identifier[1])

      tag = target.localName
      text = identifier[2]

      object = target

      object.attributes.statevalue.value =
        pos === 'beforebegin'
          ? text + object.attributes.statevalue.value
          : object.attributes.statevalue.value + text
    } else {
      pos = value.slice(0, value.indexOf(":"))
      text = value.slice(value.indexOf(":") + 1)
    }

    beforebegin = pos === 'beforebegin' ? text : ''
    afterbegin = pos === 'afterbegin' ? text : ''

    switch (tag) {
      case 'input':
        object.value = beforebegin + object.value + afterbegin
        app.change('input', object, false)
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
        object.textContent = beforebegin + object.textContent + afterbegin
    }
  },

  set2: function (object, value) {
    var attr = object.callAttribute,
      tag = object.localName
    //set = attr.replace('set', '')

    switch (tag) {
      case 'input':
      case 'progress':
        object.value = value
        app.change('input', object, false)
        break
      case 'img':
      case 'video':
      case 'track':
        object.src = value
        break
      case 'a':
        object.href = value
        break
      case 'select':
        object.setAttribute('select', value)
        break
      default:
        object.textContent = object.textContent
    }
  },

  replace: function (object, value) {
    this.insert(object, value)
  },

  state: function (object, value) {
    var val = object.clicked.split(':'),
      parts = val[0].split(';')
    action = parts[0]

    switch (action) {
      case 'add':
        console.log(action)
        //this.insert(object, value)
        break
    }
  },

  compute: function (object) {

    console.dir(object)
    var obj = object.clicked.split(';'),
      element = dom.get(obj[1]),
      computeValue = element.attributes.statevalue,
      onBeforeCompute = element.attributes.onbeforecompute,
      onAfterCompute = element.attributes.onaftercompute

    if (onBeforeCompute) {
      var val = onBeforeCompute.value.split(':')
      console.dir(val)
      app.call(['dom', val[0]], val[1])
    }

    if (computeValue) {
      var compute = computeValue.value.replace(/\b0+(\d+)/, '$1').replace(/,/g, '.')
      var result = eval(compute)
      element.value = String(result).replace(/\./g, ',')
      element.attributes.statevalue.value = result
    }

    if (onAfterCompute) {
      var val = onAfterCompute.value.split(':')
      console.dir(val)
      app.call(['dom', val[0]], val[1])
    }
  },

  remove: function (object, value) {

  },

  reset: function (object, value) {
    var tag = object.localName

    // click or not
    if (object.clicked) {
      var obj = object.clicked.split(';'),
        part2 = obj[1],
        identifier = part2.match(/([^[]+)\[(\S+)\]/),
        object = dom.get(identifier[1]),
        tag = object.localName
    }

    switch (tag) {
      case 'input':
        object.value = object.defaultValue
        object.attributes.statevalue.value = object.defaultValue
        app.change('input', object, false)
        break
    }
  },

  format: function (object, value) {
    var tag = object.localName,
      stateValue = object.textContent

    if (object.clicked) {
      value = object.value
      object = object.clicked
      tag = object.localName
      stateValue = object.attributes.statevalue
    }

    switch (value) {
      case 'compute':
        regex = /([=+\-*/])(?=[=+\-*/])/
        break
      case 'age':
        var input = stateValue
        var formats = [
          /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/,
          /(\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})/,
          /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2}):(\d{1,2}):(\d{1,2})/,
          /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2}):(\d{1,2})/,
          /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2})/,
          /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/,
          /(\d{4}) ([a-zA-Z]+) (\d{1,2})/,
          /(\d{4}) ([a-zA-Z]+)/,
          /(\d{4}) (\d{1,2}) (\d{1,2})/,
          /(\d{4})(\d{2})(\d{2})/
        ]

        for (var i = 0; i < formats.length; i++) {
          var match = input.match(formats[i])
          if (match) {
            var year = parseInt(match[1], 10)
            var month = parseInt(match[2], 10) - 1
            var day = parseInt(match[3], 10)
            var birthdateObject = new Date(year, month, day)

            if (birthdateObject) {
              var age = new Date() - birthdateObject
              var calculatedAge = new Date(age).getUTCFullYear() - 1970
              object.textContent = calculatedAge
            }

            break
          }
        }
        break
    }

    switch (tag) {
      case 'input':
        stateValue.value = stateValue.value.replace(new RegExp(regex, 'g'), '')
        break
    }
  },

  sanitize: function (object, value) {
    regex = object.value

    if (object.state) {
      //var object = object.clicked
      //console.error('hej')
      //var stateValue = object.attributes.stateValue
      //stateValue.value = 'sss'
    }

    if (object.clicked) {

      var object = object.clicked,
        value = object.value
    }

    object.value = value.replace(new RegExp(regex, 'g'), '')
  },

  split: function (object, value) {
    var parts = value.split(';'),
      pattern = parts[0],
      index = parts[1]

    dom.set(object, object.innerHTML.split(pattern)[index])
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

  bindif: function (object, options) {
    var test = object.value,
      test2 = test.split(';')

    var parts = test2[0].split(':'),
      target = dom.get(parts[0]),
      condition = test2[1],
      type = target.type

    switch (type) {
      case 'text':
        if (target.value === parts[1]) {
          var identifier = condition.match(/([^[]+)\[(\S+)\]/)

          console.dir(identifier)
          console.log(condition)

          app.call(['dom', identifier[1]], { clicked: object, value: identifier[2] })
        }
        break
      case 'select-one':
        app.listeners.add(target, 'change', function () {
          var value = this.options[this.selectedIndex].value
        })
        break
    }
  },

  stop: function (element) {
    var children = element.childNodes
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      if (child.nodeType === 1) { // Check if it's an element node
        var existingAttributes = child.attributes,
          stopValue = ''

        // Concatenate existing attribute names to the stopValue, excluding 'stop'
        for (var j = 0; j < existingAttributes.length; j++) {
          var attr = existingAttributes[j]
          if (attr.name !== 'stop') {
            if (stopValue !== '') {
              stopValue += ';'
            }
            stopValue += attr.name
          }
        }

        // Set the 'stop' attribute with the concatenated value
        child.setAttribute('stop', stopValue)
      }
    }
  },

  start: function (element) {
    element.removeAttribute('stop');
    var children = element.childNodes;
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      if (child.nodeType === 1) { // Check if it's an element node
        child.removeAttribute('stop')
        this.start(child) // Recursively remove 'stop' attribute from child's children
      }
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

  var: function (element, value) {
    if (element.localName === 'script') return
  },

  iterate: function (element, value) {
    var values = value.split(';'),
      start = parseInt(values[0]),
      stop = parseInt(values[1]),
      vari = values[2]

    var originalNode = element.cloneNode(true),
      content = ''
    for (var i = start; i <= stop; i++) {
      content += originalNode.innerHTML
    }

    element.innerHTML = content

    var elements = dom.find(element, '*')
    for (var i = 0; i <= stop - start; i++) {
      if (elements[i]) {
        app.variables.update.attributes(elements[i], '', 'i', start + i, false);
      }
    }

    app.attributes.run(elements, ['iterate'])
  }
}

var app = {
  version: { major: 1, minor: 0, patch: 0, build: 131 },
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
  replacementMap: {
    'trimleft': 'trim',
    'trimright': 'trim',
    'insertbeforebegin': 'insert2',
    'insertafterbegin': 'insert2',
    'insertbeforeend': 'insert2',
    'insertafterend': 'insert2',
    'sethref': 'set2',
    'setvalue': 'set2',
    'setsrc': 'set2'
  },
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

    app.listeners.add(document, 'keyup', function (e) {
      //console.log('key')
    })

    app.listeners.add(document, 'click', function (e) {
      var link = app.getTagLink(e.target),
        click = link && link.attributes.click,
        onclickif = link && link.attributes.onclickif
      if (click) {
        var val = click.value.split(':')
        app.call(['dom', val[0]], { clicked: val[1] })
        if (onclickif) {
          dom.bindif(onclickif, { e: link })
        }
      }
    })

    // Listen for all input fields.
    app.listeners.add(document, 'input', function (e) {
      console.log('listen for all ')
      app.change('input', e.target, false)
    })

  },

  call: function (run, runargs) {
    app.log.info()('Calling: ' + run + ' ' + runargs)

    var run1 = app.replacementMap[run[1]] || run[1]

    // Ensure runargs is an array
    runargs = Array.isArray(runargs) ? runargs : [runargs]

    switch (run.length) {
      case 4:
        window[run[0]][run1][run[2]][run[3]].apply(null, runargs)
        break
      case 3:
        window[run[0]][run1][run[2]].apply(null, runargs)
        break
      case 2:
        window[run[0]][run1].apply(null, runargs)
    }
  },

  add: {
    style: function (options) {
      var _ = this._(options, ':')
      _.el.style[action[0]] = _.action[1]
    },

    class: function (options) {
      var _ = this._(options, ' ')
      for (var i = 0; i < _.action.length; i++) {
        _.el.classList.add(_.action[i])
      }
    }
  },

  change: function (event, object) {

    // Todo
    var changeValue = object.attributes.onvaluechange,
      changeValueIf = object.attributes.onvaluechangeif,
      changeStateValue = object.attributes.onstatevaluechange,
      changeStateValueIf = object.attributes.onstatevaluechangeif

    if (changeStateValue) {
      var val = changeStateValue.value.split(':')
      app.call(['dom', val[0]], { clicked: object, state: true, value: val[1] })
    }

    if (changeStateValueIf) {
      var val = changeStateValueIf.value.split(';'),
        attr = object.value

      var element = dom.get('#result'),
        elValue = element.attributes.statevalue.value

      // Check if statevalue contains an operator followed by a number
      var match = elValue.match(/([\+\-\*\/])(\d+)$/)

      if (match) {
        // Keep the numeric part following the last operator in the input value
        element.value = match[2]
      }
    }

    if (changeValue) {
      var val = changeValue.value.split(':')
      app.call(['dom', val[0]], { clicked: object, value: val[1] })
    }

    if (changeValueIf) {
      var val = changeValueIf.value.split(';'),
        attr = object.value

      var identifier = val[2].match(/(\w+)\[([^\]]+)\]/g) || []

      var target = dom.get(val[1]),
        object = target,
        isNegative = val[0][0] === '!',
        newVal = isNegative ? val[0].substring(1) : val[0],
        regex = /(\w+)\[([^\]]+)\]/

      var statement, text, action

      if (attr === newVal && identifier[1]) {
        statement = identifier[1].match(regex)
      } else {
        statement = identifier[0].match(regex)
      }

      if (!identifier[1] && attr !== newVal) {
        return
      } else {
        text = statement[2]
        action = statement[1]
        app.call(['dom', action], { clicked: object, value: text })
      }
    }
  },

  toggle: {
    class: function (options) {
      var _ = app.attributes.parse(options, ' ')
      for (var i = 0; i < _.action.length; i++) {
        _.el.classList.toggle(_.action[i])
      }
    }
  },

  /**
   * @function getTagLink
   * @memberof app
   * @param {Element} element - The element to start the search from.
   * @return {Element|null} The found anchor element, or `null` if none was found.
   * @desc Finds the first ancestor of the given element that is an anchor element (`<a>`).
   */
  getTagLink: function (element) {
    for (var current = element; current; current = current.parentNode) {
      var type = current.localName
      if (type === 'a' || type === 'button') return current
    }
    return null
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
        varsDir: app.script.path,
        storageKey: false,
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
      if (app.storageKey) key = app.storageKey + '_' + key
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
      if (app.storageKey) key = app.storageKey + '_' + key
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
                    app.config.set()
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
                    //console.error('run' + app.xhr.currentAsset.loaded + '/' + app.xhr.currentAsset.total)
                  }
                  break
                default:
                  return
              }

              if (app.vars.loaded === (app.vars.total + app.vars.totalStore)
                && app.modules.loaded === app.modules.total
                && type !== 'template' && type !== 'data') {

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
            var attributeName = attributes[j].name
            element.callAttribute = attributeName

            // Replace with mapped value if applicable.
            attributeName = app.replacementMap[attributeName] || attributeName

            var name = attributeName.split('-'),
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
    },

    parse: function (options, delimiter) {
      var el = dom.get(options.selector),
        action = options.val.split(delimiter)
      return { el: el, action: action }
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

          var regex = new RegExp('\\{\\s*' + replaceVariable + '\\s*(?::([^}]+))?\\}', 'g')
          object.setAttribute(attr.name, attr.value.replace(regex, function (match, defaultValue) {
            return replaceValue === 0 ? '0' : replaceValue || defaultValue || ''
          }))
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