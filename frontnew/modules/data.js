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
        element: element,
        storageKey: this.module + this._generateId(attr['data-src'].value)
      }

    this._open(attr, options)
  },

  _open: function (attr, options) {
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
    var responseData = app.caches.get(this.storageMechanism, this.storageType, options.storageKey)
    var element = options.element,
      datafilteritem = element.getAttribute('data-filteritem')
    if (datafilteritem) {
      var datafilterkey = element.getAttribute('data-filterkey')
      responseData = this._filter(responseData.data, datafilteritem, datafilterkey)
    }

    var iterate = options.iterate,
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

      var dataget = elements[i].getAttribute('data-get') || false
      var dataset = elements[i].getAttribute('data-set') || false

      if (i % orginalNodeCountAll === 0) j++

      if (dataget) {
        if (dataget.indexOf(':') !== -1) {
          var data = dataget.split(':')
          app.variables.update.attributes(elements[i], elements[i], data[0], this._get(iterateObject[j], data[1]), false)
        } else {
          dom.set(elements[i], this._get(iterateObject[j], dataget), false)
        }
      }

      if (dataset) {
        if (dataset.indexOf(':') !== -1) {
          var data = dataset.split(':'),
            replaceValue = responseData.data[iterate][i][data[1]]
          app.variables.update.attributes(elements[i], elements[i], data[0], replaceValue, false)
        }
      }
    }

    app.attributes.run(elements, ['data-get', 'data-set'])
    this._set(responseData, options)
    this._finish(options)
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

          var pathSegments = element.split('.'),
            replace = response.data
          for (var i = 0; i < pathSegments.length; i++) {
            replace = replace[pathSegments[i]] || ''
          }

          app.variables.update.attributes(options.element, options.element, value, replace, false)
          continue
        }

        dom.set(element, value)
        //app.attributes.run(element)
      }
    }
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