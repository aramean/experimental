/**
 * @license
 * Copyright © 2020 Aleptra.
 * Josef Gabrielsson
 *
 * This source code is licensed under the MIT-style license found in the 
 * LICENSE file in the root directory of this source tree.
 */

var dom = {
  _replacementMap: {
    'trimleft': 'trim',
    'trimright': 'trim',
    'insertbeforebegin': 'insert',
    'insertafterbegin': 'insert',
    'insertbeforeend': 'insert',
    'insertafterend': 'insert',
    'settext': 'set2',
    'sethref': 'set2',
    'setvalue': 'set2',
    'setsrc': 'set2',
    'bindvar': 'bind',
    'bindquery': 'bind',
    'bindasset': 'bind',
    'bindglobal': 'bind',
    'bindfield': 'bind',
    'ifafterbegin': 'if',
    'ifbeforeend': 'if',
    'resetvalue': 'reset',
    'togglevalue': 'toggle',
    'margintop': 'apply',
    'marginbottom': 'apply',
    'marginleft': 'apply',
    'marginright': 'apply',
    'height': 'apply',
    'width': 'apply',
    'padding': 'apply'
  },
  _uniqueId: 0,
  _bindfieldPos: 0,

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
  toggle: function (el) {
    var ontoggle = el.attributes.ontoggle && el.attributes.ontoggle.value,
      tag = el.localName,
      type = el.type

    if (!el.originalClassList) {
      el.originalClassList = [].slice.call(el.classList).join(' ')
    }

    var match = el.originalClassList.match(/(\S+)\s*_dn\b/)
    if (match) el.classList.toggle(match[0])

    if (ontoggle) {
      var normalize = ontoggle.replace(']', '').split('['),
        run = 'app.element.' + normalize[0]
      runargs = [el, normalize[1]]
      app.call(run, runargs)
    }

    switch (tag) {
      case 'input':
        if (type === 'checkbox') el.value = el.checked === true ? '1' : '0'
        break
    }
  },

  hide: function (object, prop) {
    var el = object instanceof Object ? object : dom.get(object)
    if (el) {
      value = prop ? 'visibility: hidden' : 'display: none'
      el.style.cssText = value + ' !important'
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
   * @function setDisplay
   * @memberof dom
   * @param {string} action - The value to set for the display property. Valid values include 'none', 'block', 'inline', and others.
   * @desc Sets the display property of the root element.
   */
  setDisplay: function (action) {
    document.documentElement.style.display = action
  },

  bind: function (object, value) {
    var attr = object.callAttribute,
      bindings = value.split(';')

    for (var i = 0; i < bindings.length; i++) {
      var binding = bindings[i].split(':'),
        replaceVariable = binding[0],
        replaceValue = binding[1]

      switch (attr) {
        case 'bindvar':
          var bindInclude = this.bind.include ? ';' + this.bind.include : '',
            binding = ((object.getAttribute('bindvar') || object.getAttribute('var')) || '') + bindInclude

          // Set variable if colon is presented or update innerhtml.
          var bindings = binding ? binding.split(';') : []

          for (var i = 0; i < bindings.length; i++) {
            var bindingParts = bindings[i].split(':') || [],
              replaceVariable = bindingParts[0].trim(),
              replaceValue = bindingParts.slice(1).join(':').trim()

            app.variables.update.content(object, replaceVariable, replaceValue, false)
            app.variables.update.attributes(object, replaceVariable, replaceValue, false)
          }

          return
        case 'bindquery':
          replaceValue = app.querystrings.get(false, replaceValue)
          break
        case 'bindglobal':
          var globals = replaceValue.indexOf('.') !== -1 ? app.globals : app // Todo: Remove when globals are moved.
          replaceValue = app.element.getPropertyByPath(globals, replaceValue)
          break
        case 'bindasset':
          var keys = replaceValue.split('.'),
            cache = app.caches.get('window', 'var', keys[0])
          app.log.info()('Binding asset: ' + keys)
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
          break
        case 'bindfield':
          var type = object.tagName.toLowerCase(),
            binding = object.getAttribute('bindfield'),
            bindings = binding ? binding.split(';') : []

          for (var i = 0; i < bindings.length; i++) {
            var bindingParts = bindings[i].split(':') || [],
              replaceVariable = bindingParts[0],
              replaceValue = bindingParts[1]

            var target = dom.get(replaceValue),
              type = target.type,
              name = target.id || target.name,
              bindfieldif = target.attributes && target.attributes.bindfieldif

            var match = binding.match(new RegExp("([^:]+):[#.]" + name)),
              replaceVariableNew = match ? match[1] : '',
              fieldif = bindfieldif && bindfieldif.value.split(':')

            switch (type) {
              case 'text':
                if (object.listener !== object) {
                  this._bindfieldPos++
                  object.bindfieldPos = this._bindfieldPos
                  app.listeners.add(target, 'keyup', function (e) {
                    if ([9, 16, 17, 18, 20, 27, 37, 38, 39, 40, 91, 93].indexOf(e.keyCode) !== -1) return // Ignore keys.
                    target.startBind = true
                    if (fieldif && fieldif[1] !== target.lastPressedKey) {
                      target.startBind = false
                      target.lastPressedKey = false
                    }
                    if (target.startBind) {
                      app.variables.update.attributes(object, replaceVariableNew, this.value, true)
                      app.variables.update.content(object, replaceVariableNew, this.value)
                    }
                    if (target.startSubmit) {
                      var length = target.listeners['keyup'].length
                      if (object.bindfieldPos === length) {
                        app.call(target.startSubmit, [target])
                        target.startSubmit = false
                      }
                    }
                  })

                  object.listener = object
                }
                break
              case 'select-one':
                app.listeners.add(target, 'change', function () {
                  var value = this.options[this.selectedIndex].value
                  app.variables.update.attributes(object, replaceVariableNew, this.value, true, ['bind'])
                  app.variables.update.content(object, replaceVariableNew, value)
                })
                break
            }
          }
          continue
      }

      app.variables.update.attributes(object, replaceVariable, replaceValue, false)
      app.variables.update.content(object, replaceVariable, replaceValue, false)
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
  alert: function (element, value) {
    alert(value)
  },

  focus: function (element, value) {
    if (value) element = dom.get(value)
    element.focus()
  },

  apply: function (element, value) {
    var attr = element.callAttribute.replace(/(top|bottom|left|right)$/g, function (match) {
      return match.charAt(0).toUpperCase() + match.slice(1)
    })

    element.style[attr] = value + 'px'
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

  /**
   * @function setUniqueId
   * @memberof dom
   * @param {HTMLElement} element - The element to set the unique id on.
   * @desc Sets a unique id for the given element.
   */
  setUniqueId: function (element, internal) {
    this._uniqueId++
    var id = this._uniqueId
    if (!internal)
      element.id = 'id' + id
    else
      element.uniqueId = id
  },

  doctitle: function (value) {
    if (!value) return
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
        if (type === 'checkbox') target.checked = value === 'true' ? true : false
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

  bold: function (object, value) {
    object.style.fontWeight = value ? value : 'bold'
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
  trim: function (element, value) {
    var regex,
      attr = element.callAttribute,
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

    element.innerHTML = element.innerHTML.replace(new RegExp(regex, 'g'), '')
  },

  escape: function (element) {
    var escape = app.element.get(element),
      code = escape.charCodeAt(0)

    if (0xD800 <= code && code <= 0xDBFF) {
      low = escape.charCodeAt(1)
      code = ((code - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000
    }

    if (code) app.element.set(element, '&#' + code + ';')
  },

  insert: function (object, value) {
    var tag = object.localName,
      state = object.attributes.statevalue,
      insert = object.callAttribute.replace('insert', '')

    var normal = insert === '2' ? value : '',
      afterbegin = insert === 'afterbegin' ? value : '',
      beforeend = insert === 'beforeend' ? value : ''

    if (state) state.value += value

    if (afterbegin || beforeend || normal) {
      switch (tag) {
        case 'input':
          object.value = afterbegin + object.value + beforeend
          app.listeners.change('input', object, false)
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

  set2: function (object, value) {
    var tag = object.localName
    attr = object.callAttribute
    app.element.set(object, value, attr)
    app.element.onchange(object, attr)

    switch (tag) {
      case 'input':
        app.listeners.change('input', object, false)
        break
    }
  },

  replace: function (object, value) {
    this.insert(object, value)
  },

  reset: function (object, value) {
    var tag = object.localName,
      stateValue = object.attributes.statevalue
    switch (tag) {
      case 'form':
        object.reset()
        break
      case 'input':
        object.value = object.defaultValue
        stateValue ? stateValue.value = object.defaultValue : false
        app.listeners.change('input', object, false)
        break
    }
  },

  remove: function (object) {
    if (object) object.remove()
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
    }

    switch (tag) {
      case 'input':
        stateValue.value = stateValue.value.replace(new RegExp(regex, 'g'), '')
        break
    }
  },

  sanitize: function (object, value) {
    regex = object.value

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
    var bindvar = element.attributes.bindvar
    if (bindvar) dom.bind.include = bindvar.value
    app.xhr.request({
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

  // TODO: Finish
  if: function (object, value) {
    var attr = object.callAttribute
    var value = value.split(';')
    var condition1 = value[0]
    var test = value[1].split(':'),
      newAttr = test[0],
      newValue = test[1]
    var currentAttr = app.element.get(object, newAttr)
    if (condition1) {
      switch (attr) {
        case 'ifbeforeend':
          app.element.set(object, currentAttr + newValue, newAttr)
          break
      }
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

          app.call(identifier[1], { clicked: object, value: identifier[2] })
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
          var attr = existingAttributes[j],
            name = dom._replacementMap[attr.name] || attr.name
          if (attr.name !== 'stop') {
            if (stopValue !== '') {
              stopValue += ';'
            }
            stopValue += name
          }
        }

        // Set the 'stop' attribute with the concatenated value
        child.setAttribute('stop', stopValue)
      }
    }
  },

  start: function (element) {
    element.removeAttribute('stop')
    var children = element.childNodes
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
    dom.stop(element) // Stop all attributes in element .
    var values = value.split(';'),
      start = parseInt(values[0]),
      stop = parseInt(values[1]),
      varName = values[2],
      originalNode = element,
      content = ''

    originalNode.innerHTML = element.originalHtml

    for (var i = start; i <= stop; i++) {
      var innerHtml = originalNode.innerHTML,
        regex = new RegExp('\\{' + varName + '\\}', 'g')

      innerHtml = innerHtml.replace(regex, i) // Todo: Use a function. app.varibales
      content += innerHtml
    }

    element.innerHTML = content

    var elements = app.element.find(element, '*')
    app.attributes.run(elements)
  },

  /*await: function (element, value) {
    if (value) app.await[value] = { element: element, value: value, enable: true }
  }*/

  rerun: function (object, arg) {
    var el = arg || object
    app.attributes.run(el)
  }
}

var app = {
  version: { major: 1, minor: 0, patch: 0, build: 272 },
  module: {},
  plugin: {},
  var: {},
  language: document.documentElement.lang || 'en',
  docMode: document.documentMode || 0,
  isFrontpage: document.doctype ? true : false,
  srcDocTemplate: '',
  srcTemplate: [],
  isLocalNetwork: /localhost|127\.0\.0\.1|::1|\.local|^$/i.test(location.hostname),
  spa: false,
  vars: { total: 0, totalStore: 0, loaded: 0 },
  modules: { total: 0, loaded: 0 },
  await: {},

  /**
   * @namespace load
   * @memberof app
   * @desc
   */
  load: function () {
    this.disable(true)
    window.addEventListener('load', app.start)
  },

  disable: function (bool) {
    var val = bool ? 'hidden' : 'initial'
    document.documentElement.style.cssText = 'visibility:' + val
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
      path: (value.match(/^(.*\/)[^/]+$/) || ['', ''])[1],
      selector: selector
    }

    app.xhr.start()
    app.config.set()
    app.assets.load()

    app.listeners.add(document, 'submit', function (e) {
      app.element.onsubmit(e)
    })

    app.listeners.add(document, 'keydown', function (e) {
      var link = app.element.getTagLink(e.target) || e.target,
        click = link.attributes.click
      switch (e.key) {
        case 'Tab':
          var tab = link.attributes.onchangetab
          if (tab) {
            var val = !click ? tab : click
            val = val.value.split(':')
            app.call(val[0], [link, val[1]])
          }
          break
        case 'Enter':
          var submit = link.attributes.onsubmit
          if (submit) {
            var val = submit.value.split(':')
            link.startSubmit = val[0]
          }
          break
      }
      link.lastPressedKey = e.key
    })

    app.listeners.add(document, 'click', function (e) {
      var link = app.element.getTagLink(e.target) || e.target,
        click = link.attributes.click,
        clicktargetfield = link.attributes.clicktargetfield,
        onclickif = link.attributes.onclickif

      if (click) {
        var val = click.value.split(':'),
          target = clicktargetfield && clicktargetfield.value.split(':'),
          element = target ? dom.get(target[0]) : e.target


        element.callAttribute = val[0]
        element.targetAttribute = target && target[1]
        element.targetField = clicktargetfield

        app.call(val[0], [element, val[1]])

        if (onclickif) dom.bindif(onclickif, { e: link })
      }
    })

    // Listen for all input fields.
    app.listeners.add(document, 'input', function (e) {
      app.listeners.change('input', e.target, false, e)
    })
  },

  /**
   * @namespace call
   * @memberof app
   * @desc
   */
  call: function (run, runargs, options) {
    options = options || { 'before': false, 'after': false }
    run = run.split('.') // convert string to array.

    var run1,
      runargs = Array.isArray(runargs) ? runargs : [runargs], // Ensure runargs is an array
      context = null

    // Before hook
    if (options.before) {
      console.error('calling before once')
      app.call(options.before, runargs)
    }

    app.log.info()('Calling: ' + run + ' ' + runargs)
    try {
      if (run[0] === 'app') {
        run1 = run[1]
      } else if (run[0].indexOf('-') !== -1) {
        run = run[0].split('-')
        run.unshift('app', 'module')
        run1 = 'module'
        context = window[run[0]][run1][run[2]]
      } else {
        run.unshift('dom')
        run1 = dom._replacementMap[run[1]] || run[1]
      }
  
      switch (run.length) {
        case 4:
          return window[run[0]][run1][run[2]][run[3]].apply(context, runargs)
        case 3:
          return window[run[0]][run1][run[2]].apply(context, runargs)
        case 2:
          return window[run[0]][run1].apply(context, runargs)
      }
    } catch (error) {
      app.log.error()('Syntax not found: ' + run1)
    } finally {
      // After hook
      if (options.after) {
        console.error('calling after')
        app.call(options.after, runargs)
      }
    }
  },

  /**
   * @namespace element
   * @memberof app
   * @desc
   */
  element: {
    propertyMap: {
      'input': 'value',
      'textarea': 'value',
      'progress': 'value',
      'select': 'value',
      'audio': 'src',
      'embed': 'src',
      'img': 'src',
      'video': 'src',
      'source': 'src',
      'script': 'src',
      'track': 'src',
      'iframe': 'src',
      'a': 'href',
      'area': 'href',
      'base': 'href',
      'link': 'href',
      'object': 'data',
      'applet': 'code',
      'meta': 'content',
      'optgroup': 'label'
    },

    get: function (element, attr) {
      if (attr) return element.attributes[attr].value
      var target = element.targetAttribute
      if (target) return element.attributes[target].value
      var property = this.propertyMap[element.localName] || 'textContent'
      return element[property]
    },

    set: function (element, value, attr) {
      if (attr) {
        attr = attr.replace('set', '')
        if (attr === 'text')
          element.textContent = value
        else if (attr === 'html')
          element.innerHTML = value
        else
          element.setAttribute(attr, value)
        return
      }

      var property = this.propertyMap[element.localName] || 'textContent'
      element[property] = value
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

    toggle: {
      class: function (options, value) {
        var classes = value.split(' ')
        for (var i = 0; i < classes.length; i++) {
          options.classList.toggle(classes[i])
        }
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
      return element.length === 1 && selector[0] !== '*' ? element[0] : element
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

    getPropertyByPath: function (object, path) {
      var pathSegments = path && path.split('.') || [],
        value = object

      for (var i = 0; i < pathSegments.length; i++) {
        value = value === null || value === undefined ? '' : value[pathSegments[i]]
      }

      return value
    },

    onchange: function (object, value) {
      var onchange = object.getAttribute('onchange' + value.replace('set', ''))
      if (onchange) {
        onchange = onchange.split(':')
        console.log(onchange[0])
        object.callAttribute = onchange[0]
        console.log('onchange')
        app.call(onchange[0], [object, onchange[1]])
      }
    },

    onsubmit: function (e) {
      if (app.adf) app.adf._form(e)
      var srcEl = e.srcElement,
        attr = srcEl.getAttribute('onformsubmit'),
        submit = attr && attr.split(';')
      for (action in submit) {
        var val = submit[action].split(':')
        console.log('onsubmit')
        app.call(val[0], [srcEl, val[1]])
      }
    }
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
        varsDir: 'assets/json/vars',
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

  globals: {
    language: document.documentElement.lang || 'en',
    docMode: document.documentMode || 0,
    isFrontpage: document.doctype ? true : false,

    set: function (name, value) {
      app.globals[name] = value
    },

    get: function (name) {
      return app.globals[name]
    }
  },

  /**
   * @namespace caches
   * @memberof app
   * @desc
   */
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

    set: function (mechanism, type, key, data, status, format) {
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
        'status': status ? status : '',
        'headers': '',
        'globals': app.globals
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

  /**
   * @namespace listeners
   * @memberof app
   * @desc
   */
  listeners: {
    add: function (element, eventType, callback) {

      element.removeEventListener(eventType, callback)
      element.addEventListener(eventType, callback)

      // Track the listener
      element.listeners = element.listeners || {}
      element.listeners[eventType] = (element.listeners[eventType] || []).concat(callback)
    },

    remove: function (element, eventType, callback) {
      element.removeEventListener(eventType, callback)
    },

    change: function (type, object, test) {
      // Todo
      var changeValue = object.attributes.onvaluechange,
        changeValueIf = object.attributes.onvaluechangeif,
        changeStateValue = object.attributes.onstatevaluechange,
        changeStateValueIf = object.attributes.onstatevaluechangeif

      if (changeValue) {
        var beforeChangeValue = object.attributes.onbeforevaluechange,
          afterChangeValue = object.attributes.onaftervaluechange
        var val = changeValue.value.split(':')

        app.call(val[0],
          { clicked: object, value: val[1] },
          { 'before': beforeChangeValue, after: afterChangeValue ? afterChangeValue.value : false }
        )
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
          app.call(action, { clicked: object, value: text })
        }
      }

      if (changeStateValue) {
        var val = changeStateValue.value.split(':')
        app.call(val[0], { clicked: object, state: true, value: val[1] })
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

        dom.doctitle(document.title)

        app.srcDocTemplate = document.body.innerHTML

        app.modules.name = modules
        app.modules.total = modules.length

        app.vars.name = vars
        app.vars.total = vars.length

        this.get.modules()
      } else {
        var templateElement = dom.get('template', true)[0], // Get only the first template element.
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
          app.xhr.request({
            url: app.varsDir + '/' + name + '.json',
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

          app.xhr.request({
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
   * @namespace attributes
   * @memberof app
   * @desc
   */
  attributes: {

    defaultExclude: [
      'alt',
      'checked',
      'class',
      'for',
      'id',
      'name',
      'selected',
      'src',
      'style',
      'target',
      'type',
      'title',
      'value'],

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
            var attrName = attributes[j].name,
              attrValue = attributes[j].value,
              attrFullname = dom._replacementMap[attrName] || attrName
            if (exclude.indexOf(attrFullname) === -1) {
              var name = attrFullname.split('-')

              element.callAttribute = attrName
              if (!element.originalText) element.originalText = element.textContent
              if (!element.originalHtml) element.originalHtml = element.innerHTML
              if (!element.originalOuterHtml) element.originalOuterHtml = element.outerHTML
              if (!element.originalLabel) element.originalLabel = element.label

              if (app.module[name[0]] && name[1]) {
                app.log.info(1)(name[0] + ':' + name[0] + '-' + name[1])
                app.module[name[0]][name[1]] ? app.module[name[0]][name[1]](element) : app.log.error(0)(name[0] + '-' + name[1])
              } else if (dom[name]) {
                app.log.info(1)('dom.' + name)
                dom[name](element, attrValue)
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
      attributes: function (object, replaceVariable, replaceValue, reset, runExclude) {
        if (replaceVariable) {
          if (reset) {
            var originalAttributes = dom.parse.text(object.originalOuterHtml).children[0].attributes,
              originalHtml = object.originalHtml
            app.variables.reset.attributes(object, originalAttributes)
            app.variables.reset.content(object, originalHtml)
          }

          var regex = new RegExp('\\{\\s*' + replaceVariable + '\\s*(?::((?:{[^{}]*}|[^}])+))?\\}', 'g')
          for (var i = 0; i < object.attributes.length; i++) {
            var attr = object.attributes[i]
            // Check if the regex is matched before updating the attribute.
            if (regex.test(attr.value)) {
              // Update the attribute value directly.
              attr.value = attr.value.replace(regex, replaceValue === 0 ? '0' : replaceValue || '$1' || '')
            }
          }

          if (reset) {
            var exclude = ['stop'].concat(runExclude || [])
            app.attributes.run([object], exclude)
          }
        }
      },

      content: function (object, replaceVariable, replaceValue) {
        // Escape special characters in the variable pattern to create a valid regular expression.
        var escapedVariable = replaceVariable.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

        // Create a regular expression using the escaped variable pattern.
        var variableRegex = new RegExp('{' + escapedVariable + '(?::([^}]+))?}', 'g')

        // Replace all occurrences of {variable} with the replacement value.
        var originalContent = object.innerHTML
        var modifiedContent = originalContent.replace(variableRegex, replaceValue === 0 ? '0' : replaceValue || '$1' || '')

        // Update element content only if there were replacements.
        if (originalContent !== modifiedContent) {
          object.innerHTML = modifiedContent
        }
      }
    },

    reset: {
      attributes: function (object, original) {
        for (var i = 0; i < original.length; i++) {
          var attr = original[i]
          object.setAttribute(attr.name, attr.value)
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
    elementSelectors: [
      { name: 'header', class: '', content: '' },
      { name: 'aside:nth-of-type(1)', class: '', content: '' },
      { name: 'main', class: '', content: '' },
      { name: 'aside:nth-of-type(2)', class: '', content: '' },
      { name: 'footer', class: '', content: '' }
    ],
    originalClassList: [],

    render: function () {
      app.log.info()('Rendering templates...')
      var currentPageTitle = document.title,
        currentPageBodyContent = document.body.innerHTML,
        isReload = app.srcTemplate.page,
        srcDoc = app.srcTemplate.url.srcDoc,
        src = app.srcTemplate.url.src

      if (!app.srcDocTemplate) app.srcDocTemplate = app.caches.get('window', 'template', srcDoc).data

      if (srcDoc) {
        var cache = app.caches.get('window', 'template', srcDoc),
          responsePage = dom.parse.text(cache.data, ['title']),
          responsePageScript = app.element.find(responsePage, app.script.selector),
          responsePageContent = responsePage.innerHTML,
          responsePageContentClass = responsePage.className

        for (var i = 0; i < this.elementSelectors.length; i++) {
          var elSelector = this.elementSelectors[i],
            parsedEl = app.element.find(responsePage, elSelector.name),
            content = parsedEl.innerHTML

          if (elSelector.name !== 'main') {
            elSelector.content = content
            dom.set(elSelector.name, content ? content : '')
            app.attributes.run(elSelector.name + ' *')
          }
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
            template = dom.parse.text(app.element.find(html, 'template').innerHTML),
            srcDoc = dom.parse.text(app.srcDocTemplate)

          for (var j = 0; j < this.elementSelectors.length; j++) {
            var elSelector = this.elementSelectors[j],
              parsedEl = app.element.find(template, elSelector.name),
              content = parsedEl.innerHTML,
              classAttr = parsedEl.attributes && parsedEl.attributes.class ? true : false,
              className = parsedEl.className,
              templateEl = dom.get(elSelector.name),
              srcDocEl = app.element.find(srcDoc, elSelector.name)

            if (elSelector.name !== 'main') {
              dom.set(elSelector.name, parsedEl.nodeType === 1 ? content : srcDocEl.innerHTML)
              if (dom.get('template')) app.attributes.run(elSelector.name + ' *')
            }

            templateEl.className = classAttr ? className : srcDocEl.className
          }
        }
      }

      if (responsePageContentClass) document.body.className = responsePageContentClass
      dom.doctitle(currentPageTitle)
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
      var self = this,
        open = XMLHttpRequest.prototype.open,
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
              global = options.global,
              cache = options.cache,
              target = options.target,
              module = options.module,
              format = options.format

            if (global) {
              // Create an object to store all globals
              var obj = {}
              // Loop through the global array
              for (var i = 0; i < global.length; i++) {
                var globalName = global[i]
                obj[globalName] = dom.parse.json(this.responseText).value[globalName]
                app.globals.set(module, obj)
              }
            }

            if (cache) {
              //if (cache && (statusType.success || statusType.redirect)) {
              app.caches.set(cache.type, cache.keyType, cache.key, this.responseText, this.status, cache.format)
            }

            if (type) {
              switch (type) {
                case 'page':
                  var responsePage = dom.parse.text(this.responseText),
                    responsePageTitle = app.element.find(responsePage, 'title').textContent,
                    templateElement = app.element.find(responsePage, 'template'),
                    templateAttr = templateElement && templateElement.attributes,
                    elementSrcDoc = templateAttr && templateAttr.srcdoc && templateAttr.srcdoc.value,
                    elementSrc = templateAttr && templateAttr.src && templateAttr.src.value,
                    templateSrcDoc = target !== 'main' ? elementSrcDoc || false : false,
                    templateSrc = elementSrc && elementSrc.split(';') || []

                  app.modules.total = 0
                  app.templates.total = 0
                  app.templates.loaded = 0
                  app.vars.total = 0
                  self.currentAsset.loaded = 0

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
                    app.isFrontpage = false
                    app.templates.render()
                    app.config.set()
                    app.assets.get.modules()
                  }
                  break
                case 'data':
                  if (self.currentAsset.total === 1) {
                    self.currentAsset.loaded = 0
                  }
                  self.currentAsset.loaded++
                  if (self.currentAsset.loaded === self.currentAsset.total) {
                    var run = this.options.onload2.run
                    app.module[type]._run(run.arg) //Todo: Make app.call work.
                    //app.call(run.func, run.arg)
                    //console.error('run' + self.currentAsset.loaded + '/' + self.currentAsset.total)
                  }
                  break
                case 'fetch':
                  // TODO: Make a function of format
                  app.module[module].fetchedData = format === 'json' ? dom.parse.json(this.responseText).value : this.responseText
                default:
                  return
              }

              if (app.vars.loaded === (app.vars.total + app.vars.totalStore)
                && app.modules.loaded === app.modules.total
                && type !== 'template' && type !== 'data') {

                //console.log('Vars loaded:', app.vars.loaded + '/' + (app.vars.total + app.vars.totalStore))
                //console.log('Modules loaded:', app.modules.loaded + '/' + app.modules.total)

                app.disable(false)
                app.attributes.run()
              }
            }
          }
        }

        open.apply(this, arguments)
      }

      XMLHttpRequest.prototype.send = function (data) {
        if (data) app.log.info()('Data: ' + data)
        send.apply(this, arguments)
      }
    },

    /**
     * @function xhr
     * @memberof app
     * @desc Creates XHR requests and updates the DOM based on the response.
     */
    request: function (options) {
      var method = options.method ? options.method.toUpperCase() : 'GET',
        url = options.url instanceof Array ? options.url : [options.url],
        target = options.target ? dom.get(options.target) : options.element,
        single = options.single,
        cache = options.cache || false,
        headers = options.headers ? dom.parse.attribute(options.headers) : {},
        srcEl = options.srcEl || false,
        enctype = options.enctype ? options.enctype : 'application/json',
        onload = options.onload,
        error = options.error,
        success = options.success,
        loader = options.loader,
        type = options.type,
        run = onload && onload.run && onload.run.func ? onload.run.func : false,
        runarg = onload && onload.run && onload.run.arg

      if (false) {
        console.dir(cache)
        console.log('hej')
      } else {

        var xhr = new XMLHttpRequest(),
          urlExtension = url.indexOf('.') !== -1 || url == '/' || options.urlExtension === false ? '' : app.fileExtension || ''

        xhr.options = options

        if (single) {
          if (this.currentRequest) this.currentRequest.abort()
          this.currentRequest = xhr
        }

        xhr.onabort = function () {
          if (app.spa && loader) app.spa._preloader.reset()
        }

        xhr.onprogress = function (e) {
          if (app.spa && type === 'page') app.spa._preloader.load(e, true)
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
            } else {
              dom.hide(error)
            }

            if (onload) {
              if (run) app.call(run, runarg)
            }

            if (success) {
              //Todo: Move split to app.call. Check for Element reference "#"".
              var val = success.split(':')
              app.call(val[0], [srcEl, val[1]])
            }

          } else if (status.clientError || status.serverError) {
            dom.show(error)
            dom.hide(loader)
            if (error) dom.show(error)
          }
        }

        xhr.onerror = function () {
          if (loader) dom.loader(loader)
          if (error) dom.show(error)
        }

        xhr.open(method, url + urlExtension, true)

        var payload
        if (['POST', 'PUT', 'PATCH'].indexOf(method) !== -1) {

          var json = {}
          if (srcEl.elements) {
            for (var i = 0; i < srcEl.elements.length; i++) {
              var el = srcEl.elements[i]
              json[el.name] = el.value
            }
          } else {
            json[srcEl.name] = srcEl.value
          }

          payload = JSON.stringify(json)
        } else {
          payload = null
          enctype = 'application/x-www-form-urlencoded'
        }

        // Set headers
        headers['Content-type'] = enctype
        for (var header in headers) {
          if (headers.hasOwnProperty(header)) xhr.setRequestHeader(header, headers[header])
        }

        xhr.send(payload)
      }
    }
  },
}

app.load()