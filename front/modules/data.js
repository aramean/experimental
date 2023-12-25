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
    app.xhr.currentAsset.total = 1
    this._handle(element)

    if (!element.getAttribute("stop")) {
      element.setAttribute("stop", '*')
    }

    if (element.getAttribute('data-srcjoin')) {
      app.xhr.currentAsset.total = 2
      this._handle(element, true)
    }
  },

  _handle: function (element, join) {
    var attr = element.attributes,
      joinSuffix = join ? 'join' : '',
      options = {
        loader: attr.loader && attr.loader.value,
        iterate: attr['data-iterate'] && attr['data-iterate'].value,
        element: element,
        attribute: join ? 'data-srcjoin' : 'data-src',
        storageKey: this.module + this._generateId(attr['data-src'].value) + joinSuffix
      }
    this._open(attr, options)
  },

  _open: function (attr, options) {
    app.xhr.get({
      url: attr[options.attribute].value,
      type: 'data',
      headers: attr['data-header'] && dom.parse.attribute(attr['data-header'].value),
      target: attr.target ? attr.target.value : false,
      onload2: {
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
    var responseData = app.caches.get(this.storageMechanism, this.storageType, options.storageKey.replace('join', ''))
    var element = options.element,
      datamerge = element.getAttribute('data-merge'),
      datafilteritem = element.getAttribute('data-filteritem')

    if (datamerge) {
      var responseDataJoin = app.caches.get(this.storageMechanism, this.storageType, options.storageKey.replace('join', '') + 'join')
      responseData = this._merge(responseData.data, responseDataJoin.data, datamerge)
    }

    if (datafilteritem) {
      var datafilterkey = element.getAttribute('data-filterkey')
      responseData = this._filter(responseData.data, datafilteritem, datafilterkey)
    }

    var iterate = options.iterate,
      responseObject = iterate === 'true' ? responseData.data : app.getPropertyByPath(responseData.data, iterate) || responseData.data,
      total = iterate && responseObject.length - 1 || 0

    if (!iterate) {
      var elements = dom.find(element, '*')

      for (var i = 0; i < elements.length; i++) {
        var dataget = elements[i].getAttribute('data-get')
        if (dataget) {
          var value = app.getPropertyByPath(responseObject, dataget)
          dom.set(elements[i], value, false)
        }
      }

    } else {

      var originalNode = element.cloneNode(true),
        orginalNodeCountAll = dom.find(originalNode, '*').length,
        content = ''

      for (var i = 0; i <= total; i++) {
        content += originalNode.innerHTML
      }

      element.innerHTML = content

      var elements = dom.find(element, '*')
      for (var i = 0, j = -1; i < elements.length; i++) {
        if (i % orginalNodeCountAll === 0) j++

        this._process('data-get', elements[i], responseObject[j])
        this._process('data-set', elements[i], responseObject[j])
      }
    }

    if (element.getAttribute("stop") === "*") dom.start(element)
    this._set(responseData, options)
    this._finish(options)
    app.attributes.run(elements, ['data-get', 'data-set'])
  },

  _process(accessor, element, responseObject) {
    var value = element.getAttribute(accessor) || false
    if (value) {
      if (value.indexOf(':') !== -1) {
        var data = value.split(':')
        app.variables.update.attributes(element, element, data[0], this._get(responseObject, data[1]), false)
      } else {
        dom.set(element, this._get(responseObject, value), false)
      }
    }
  },

  _get: function (obj, value) {
    var result,
      orPaths = value.split('||')

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
          value = response.data[value]
        } else {

          var pathSegments = element.split('.') || [],
            replace = response.data

          for (var j = 0; j < pathSegments.length; j++) {
            replace = replace[pathSegments[j]] || ''
          }

          app.variables.update.attributes(options.element, options.element, value, replace, false)
          var doctitle = options.element.attributes.doctitle || ''
          if (doctitle.value) dom.doctitle(doctitle.value)
          continue
        }

        dom.set(element, value)
      }
    }
  },

  _merge: function (response, responseJoin, merge) {
    response[merge] = responseJoin[merge]
    var filteredResponse = response
    return { data: filteredResponse }
  },

  _filter: function (response, item, key) {
    var parts = (item || '').split(';')
    var filteredResponse = response // Create a deep copy of the response

    var filterConditions = parts.map(function (part) {
      var subParts = (part || '').split(':')
      var keyValuePair = subParts.map(function (part) {
        return part.trim()
      })
      var filterKey = keyValuePair[0],
        filterValue = keyValuePair[1]

      if (filterValue[0] === "'" && filterValue[filterValue.length - 1] === "'") {
        filterValue = filterValue.slice(1, -1)
      }

      // Check if the filterValue is a boolean condition
      if (filterValue === 'true' || filterValue === 'false') {
        // Convert the filterValue to a boolean
        filterValue = filterValue === 'true'
      }

      return function (item) {
        return item[filterKey] === filterValue
      }
    })

    if (filteredResponse[key] && Array.isArray(filteredResponse[key])) {
      var filtered = filteredResponse[key].filter(function (item) {
        return filterConditions.every(function (condition) {
          return condition(item)
        })
      })

      // Update the key with the filtered data
      filteredResponse[key] = filtered
    }

    return { data: filteredResponse }
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