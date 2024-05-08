'use strict'

app.module.data = {

  _intervalTimers: {},
  storageMechanism: 'window',
  storageType: 'module',
  storageKey: '',
  defaultInterval: 500,

  __autoload: function (options) {
    this.module = options.name

    console.error(document.forms)
    for (var i = 0; i < document.forms.length; i++) {
      var form = document.forms[i]
      console.log('josef')
      form.addEventListener("submit", myListener, false)
    }

    // Override form submission with Ajax
    function myListener(e) {
      alert('hej')
      // Prevent the default form submission
      e.preventDefault();
    }
  },

  bind: function (element) {
    var value = element.getAttribute('data-bind')
    dom.bind(element, value, 'data-bind')
    app.variables.update.attributes(element, 'l', 'eng', false)
  },

  src: function (element) {
    var self = this
    dom.setUniqueId(element, true)
    var interval = element.getAttribute('data-interval') || this.interval,
      loader = element.getAttribute('data-loader'),
      error = element.getAttribute('data-error')

    dom.hide(error)

    if (loader) {
      dom.show(loader)
      dom.hide(element)
    }

    //if (!element.getAttribute('stop')) element.setAttribute('stop', '*')

    if (!self._intervalTimers[element.uniqueId]) {
      self._intervalTimers[element.uniqueId] = setTimeout(function () {
        try {
          app.xhr.currentAsset.total = 1
          self._handle(element)
          if (element.getAttribute('data-srcjoin')) {
            app.xhr.currentAsset.total = 2
            self._handle(element, true)
          }
        } catch (error) {
          console.error('data-interval error:', error)
        }
      }, interval)
    }
  },

  _handle: function (element, join) {
    var attr = element.attributes,
      iterate = attr['data-iterate'],
      loader = attr['data-loader'],
      src = attr['data-src'],
      joinSuffix = join ? 'join' : '',
      options = {
        loader: loader && loader.value,
        iterate: iterate && iterate.value,
        element: element,
        attribute: join ? 'data-srcjoin' : 'data-src',
        storageKey: this.module + this._generateId(src.value) + joinSuffix
      }
    this._open(attr, options)
  },

  _open: function (attr, options) {
    var error = attr['data-error'],
      empty = attr['data-empty'],
      header = attr['data-header'],
      loader = attr['data-loader'],
      success = attr.success,
      timeout = attr.timeout,
      target = attr.target,
      progresscontent = attr.progresscontent

    app.xhr.get({
      url: attr[options.attribute].value,
      type: 'data',
      headers: header && dom.parse.attribute(header.value),
      target: target ? target.value : false,
      onload2: {
        run: {
          func: 'app.module.data._run',
          arg: options
        },
        timeout: (timeout) ? timeout.value : 0
      },
      global: {
        globalize: {
          iso639: 'iso639'
        }
      },
      cache: {
        mechanism: this.storageMechanism,
        format: 'json',
        keyType: this.storageType,
        key: options.storageKey
      },
      onprogress: { content: (progresscontent) ? progresscontent.value : '' },
      loader: loader && loader.value,
      error: error && error.value,
      empty: empty && empty.value,
      success: success && success.value
    })
  },

  _run: function (options) {
    var responseData = app.caches.get(this.storageMechanism, this.storageType, options.storageKey.replace('join', ''))
    var element = options.element,
      datamerge = element.getAttribute('data-merge'),
      datafilteritem = element.getAttribute('data-filteritem'),
      datareplace = element.getAttribute('data-replace'),
      datasort = element.getAttribute('data-sort'),
      datastatus = element.getAttribute('data-status'),
      dataempty = element.getAttribute('data-empty'),
      datasuccess = element.getAttribute('data-success'),
      selector = '*:not([data-iterate-skip]'

    if (responseData) {
      if (datamerge) {
        var responseDataJoin = app.caches.get(this.storageMechanism, this.storageType, options.storageKey.replace('join', '') + 'join')
        if (responseDataJoin)
          responseData = this._merge(responseData.data, responseDataJoin.data, datamerge)
      }

      if (datasuccess) {
        responseData.status !== 200 ? dom.hide(datasuccess) : dom.show(datasuccess)
      }

      if (dataempty) {
        responseData.data.length === 0 ? dom.show(dataempty) : dom.hide(dataempty)
      }

      if (datafilteritem) {
        var datafilterkey = element.getAttribute('data-filterkey')
        responseData = this._filter(responseData.data, datafilteritem, datafilterkey)
      }

      if (datareplace) {
        this._replace(responseData.data, datareplace)
      }

      if (datasort) {
        var datasortorder = element.getAttribute('data-sortorder')
        this._sort(responseData.data, datasort, datasortorder)
      }

      if (datastatus && responseData.status !== 200) { //Todo: Fix dynamic status.
        var status = datastatus.split(';')
        var el = status.length > 0 ? status[1] : status[0]
        if (el) dom.show(el)
      }

      var iterate = options.iterate,
        responseObject = iterate === 'true' ? responseData.data : app.element.getPropertyByPath(responseData.data, iterate) || {},
        total = iterate && responseObject.length - 1 || 0

      if (!iterate) {
        var elements = app.element.find(element, selector),
        arrayFromNodeList = [].slice.call(elements)

        arrayFromNodeList.push(element) // Support data-get on parent.

        for (var i = 0; i < arrayFromNodeList.length; i++) {
          var dataget = arrayFromNodeList[i].getAttribute('data-get')
          if (dataget) {
            var value = app.element.getPropertyByPath(responseObject, dataget)
            app.element.set(arrayFromNodeList[i], value, false)
          }
        }

      } else {
        if (!responseObject.length) { // Support index select.
          var keys = Object.keys(responseObject),
            total = keys.length - 1 || 0,
            responseObject = keys

          if (responseObject.length === 0) {
            /*total = 0
            var empty = dataempty.split(';')
            var el = empty.length > 0 ? empty[1] : empty[0]
            console.error(el)
            if (el) dom.show(el)
            console.warn(responseObject)*/
          }
        }

        var originalNode = element,
          originalClonedNode = originalNode.cloneNode(true)

        originalNode.innerHTML = element.originalHtml

        var elementsSkip = originalNode.querySelectorAll('[data-iterate-skip]')

        // Remove elements that are skipped.
        for (var i = 0; i < elementsSkip.length; i++) {
          var skipElement = elementsSkip[i]
          skipElement.parentNode.removeChild(skipElement)
        }

        var originalNodeCountAll = app.element.find(originalNode, selector).length || 1,
          content = ''

        for (var i = 0; i <= total; i++) {
          content += i === 0 && elementsSkip.length > 0 ? originalClonedNode.innerHTML : originalNode.innerHTML
        }

        element.innerHTML = content

        var elements = app.element.find(element, selector)
        for (var i = 0, j = -1; i < elements.length; i++) {
          if (i % originalNodeCountAll === 0) j++

          var attributes = elements[i].attributes
          for (var k = 0; k < attributes.length; k++) {
            var attr = attributes[k]
            if (attr.name.indexOf('bind') === 0) {
              var value = attr.value,
                bindings = value ? value.split(';') : []

              for (var l = 0; l < bindings.length; l++) {
                var bindingParts = bindings[l].split(':') || [],
                  replaceVariable = bindingParts[0].trim(),
                  replaceValue = bindingParts[1].trim(),
                  newReplaceValue = app.element.getPropertyByPath(app.globals, replaceValue)

                app.variables.update.attributes(elements[i], replaceVariable, newReplaceValue, false)
              }
            }
          }

          this._process('data-get', elements[i], responseObject[j])
          this._process('data-set', elements[i], responseObject[j])
        }
      }

      //if (element.getAttribute('stop') === "*") dom.start(element)
      this._set(responseData, options)
      this._finish(options)
      app.attributes.run(elements, ['data-get', 'data-set'])
    }
  },

  _process: function (accessor, element, responseObject) {
    var value = element.getAttribute(accessor) || false

    if (value) {
      if (value.indexOf(':') !== -1) {
        var keys = value.split(';')
        for (var i = 0; i < keys.length; i++) {
          var values = keys[i].split(':')
          app.variables.update.attributes(element, values[0], this._get(responseObject, values[1]), false)
        }
      } else {
        dom.set(element, this._get(responseObject, value), false)
      }
    }
  },

  _get: function (obj, value) {
    var result,
      orPaths = value.split('||')

    if (value === '[0]') return obj
    for (var i = 0; i < orPaths.length; i++) {
      var andPaths = orPaths[i].trim().split('&&'),
        tempResult = []

      for (var j = 0; j < andPaths.length; j++) {
        var tempObj = obj,
          keys = andPaths[j].trim().split('.'),
          valid = true

        for (var k = 0; k < keys.length; k++) {
          if (tempObj !== null && tempObj !== undefined && tempObj.hasOwnProperty(keys[k])) {
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

          app.variables.update.attributes(options.element, value, replace, false)
          var doctitle = options.element.attributes.doctitle || ''
          if (doctitle.value) dom.doctitle(doctitle.value)
          continue
        }

        dom.set(element, value)
      }
    }
  },

  patch: function (object) {
    if (object.clicked) {
      this._patch(object.clicked.attributes)
    }
  },

  _patch: function (attr) {
    app.xhr.get({
      url: attr['data-patch'].value,
      method: 'patch'
    })
  },

  _merge: function (response, responseJoin, merge) {
    response[merge] = responseJoin[merge]
    return { data: response }
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

  _replace: function (response) {
    // TODO: Hardcode to Softcode
    if (response.results && response.results.length) {
      response.results.forEach(function (result) {
        if (result.media_type === 'tv') {
          result.media_type = 'show'
        }
      })
    }

    return { data: response }
  },

  _sort: function (response, sortKey, sortOrder) {
    if (Array.isArray(response)) {
      return response.sort(function (a, b) {
        var valueA = app.element.getPropertyByPath(a, sortKey),
          valueB = app.element.getPropertyByPath(b, sortKey)

        return (typeof valueA === 'string')
          ? (sortOrder === 'desc' ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB))
          : (sortOrder === 'desc' ? valueB - valueA : valueA - valueB)
      })
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
      dom.hide(options.loader)
      dom.show(options.element)
    }
  }
}