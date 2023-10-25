'use strict'

app.module.data = {

  storageMechanism: 'window',
  storageType: 'module',
  storageKey: '',

  __autoload: function (options) {
    this.module = options.name
  },

  bind: function (element) {
    var value = element.getAttribute('data-bind')
    dom.bind(element, value, 'data-bind')
  },

  src: function (element) {
    var attr = element.attributes,
      options = {
        loader: attr.loader && attr.loader.value,
        iterate: attr.iterate && attr.iterate.value,
        element: element
      }

    this._open(attr, options)
  },

  _open: function (attr, options) {
    options.storageKey = this.module + this._generateId(attr['data-src'].value)
    app.xhr.get({
      url: attr['data-src'].value,
      headers: attr['data-header'] && dom.parse.attribute(attr['data-header'].value),
      target: attr.target ? attr.target.value : false,
      onload: {
        run: {
          func: 'app.module.data._run',
          arg: options
        },
        timeout: (attr.timeout) ? attr.timeout.value : 0
      },
      cache: {
        mechanism: this.storageMechanism,
        format: 'json',
        keyType: this.storageType,
        key: options.storageKey
      },
      onprogress: { content: (attr.progresscontent) ? attr.progresscontent.value : '' },
      loader: attr.loader && attr.loader.value,
      error: attr.error && attr.error.value,
      success: attr.success && attr.success.value
    })
  },

  _run: function (options) {
    var responseData = app.caches.get(this.storageMechanism, this.storageType, options.storageKey),
      element = options.element,
      iterate = options.iterate,
      iterateObject = iterate === 'true' ? responseData.data : responseData.data[iterate] || responseData.data,
      total = iterate && iterateObject.length - 1 || 0

    var originalNode = element.cloneNode(true),
      orginalNodeCountAll = dom.find(originalNode, '*').length,
      content = ''

    for (var i = 0; i <= total; i++) {
      content += originalNode.innerHTML
    }

    element.innerHTML = content

    var elements = dom.find(element, '*')
    for (var i = 0, j = -1; i < elements.length; i++) {

      var dataget = elements[i].getAttribute('data-get')

      if (i % orginalNodeCountAll === 0) j++

      if (dataget) {
        if (dataget.indexOf(':') !== -1) {
          var data = dataget.split(':')
          app.variables.update.attributes(elements[i], elements[i], data[0], this._get(iterateObject[j], data[1]), false)
        } else {
          dom.set(elements[i], this._get(iterateObject[j], dataget), false)
        }
      }
    }

    app.attributes.run(elements, ['data-get'])
    this._set(responseData, options)
    this._finish(options)
  },

  _get: function (obj, valueString) {
    var result,
      orPaths = valueString.split('||')

    for (var i = 0; i < orPaths.length; i++) {
      var andPaths = orPaths[i].trim().split('&&'),
        tempResult = []

      for (var j = 0; j < andPaths.length; j++) {
        var tempObj = obj,
          keys = andPaths[j].trim().split('.'),
          valid = true

        for (var k = 0; k < keys.length; k++) {
          if (tempObj.hasOwnProperty(keys[k])) {
            tempObj = tempObj[keys[k]]
          } else {
            valid = false
            break
          }
        }

        if (valid) {
          tempResult.push(tempObj)
        } else {
          break
        }
      }

      if (tempResult.length === andPaths.length) {
        result = tempResult.join(' ')
        break
      }
    }

    return result
  },

  _set: function (response, options) {
    var set = options.element.getAttribute('data-set')

    if (set) {
      var keys = set.split(';')

      for (var i = 0; i < keys.length; i++) {
        var values = keys[i].split(':'),
          element = values[1],
          value = values[0]

        if (values[0][0] === '^') {
          value = response.headers[value.substring(1)]
        } else if (values[0] === '*length') {
          value = response.data.length
        } else if (values[1][0] === '#' || values[1][0] === '.') {
          value = response.data[values[0]]
        } else {
          app.log.error(0)(values)
        }

        dom.set(element, value)
        //app.attributes.run(element)
      }
    }
  },

  _generateId: function (str) {
    var hash = 0
    for (var i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    }
    return hash
  },

  _finish: function (options) {
    if (options.loader) {
      dom.show(options.element)
      dom.hide(options.loader)
    }
  }
}