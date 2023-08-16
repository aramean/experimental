'use strict'

app.module.data = {

  _autoload: function() {},

  bind: function (element) {
    var value = element.getAttribute('data-bind')
    dom.bind(element, value)
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

  _run: function (options) {
    var responseData = this.responseData,
      element = options.element,
      iterate = options.iterate,
      iterateObject = iterate === 'true' ? responseData.data : responseData.data[iterate] || responseData.data,
      total = iterate && iterateObject.length - 1 || 0

    var originalNode = element.cloneNode(true),
      orginalNodeCountAll = dom.find(originalNode, '*').length,
      content = '',
      j = -1

    for (var i = 0; i <= total; i++) {
      content += originalNode.innerHTML
    }

    element.innerHTML = content

    var elements = dom.find(element, '*')
    for (var i = 0; i < elements.length; i++) {

      var dataget = elements[i].getAttribute('data-get')

      if (i % orginalNodeCountAll === 0) j++

      if (dataget) {
        var isReplace = dataget.indexOf(':') !== -1,
          replace = false,
          value = ''

        if (isReplace) {
          var vars = dataget.split(':'),
            value = this._get(iterateObject[j], vars[1]),
            replace = vars[0]
        } else {
          value = this._get(iterateObject[j], dataget)
        }

        dom.set(elements[i], value, false, replace)
      }
    }

    app.attributes.run(elements, ['data-get'])
    this._set(responseData, options)
    this._finish(options)
  },

  _get: function (obj, valueString) {
    var keys = valueString.split('.')
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i],
        obj = obj[key]
    }

    return obj
  },

  _open: function (attr, options) {
    app.xhr.get({
      url: attr['data-src'].value,
      headers: attr['data-header'] && dom.parse.attribute(attr['data-header'].value),
      target: attr.target ? attr.target.value : false,
      response: 'data',
      onload: {
        run: { func: 'app.module.data._run', arg: options },
        timeout: (attr.timeout) ? attr.timeout.value : 0
      },
      onprogress: { content: (attr.progresscontent) ? attr.progresscontent.value : '' },
      onerror: { content: (attr.errorcontent) ? attr.errorcontent.value : false },
    })
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
        app.attributes.run(element)
      }
    }
  },

  _finish: function (options) {
    if (options.loader) {
      dom.show(options.element)
      dom.hide(options.loader)
    }
  }
}