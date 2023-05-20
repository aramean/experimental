'use strict'

app.module.data = {

  src: function (element) {
    var attr = element.attributes,
      options = {
        loader: attr.loader && attr.loader.value,
        iterate: attr.iterate && attr.iterate.value,
        element: element
      }

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

  _run: function (options) {
    var $response = this.$response,
      element = options.element,
      iterate = options.iterate,
      iterateObject = iterate === 'true' ? $response.data : $response.data[iterate],
      total = iterate && iterateObject.length - 1

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

      if (i % orginalNodeCountAll === 0) {
        j++
      }

      if (dataget) dom.set(elements[i], this._get(iterateObject[j], dataget))
    }

    app.attributes.run(elements, ['data-get'])

    this._set($response, options)
    this._finish(options)
  },

  _finish: function (options) {
    if (options.loader) {
      dom.show(options.element)
      dom.hide(options.loader)
    }
  },

  _get: function (obj, valueString) {
    var keys = valueString.split('.')
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i],
        obj = obj[key]
    }

    return obj
  },

  _set: function (response, options) {
    var bind = options.element.getAttribute('data-set')

    if (bind) {
      var keys = bind.split(';')

      for (var i = 0; i < keys.length; i++) {
        var values = keys[i].split(':'),
          key = response.data[values[0]],
          element = values[1],
          value = values[0]

          if (values[0][0] === '^') {
            value = response.headers[value.substring(1)]
          } else if (values[0] === '*length') {
            value = response.data.length
          }

        dom.set(element, value)
      }
    }
  },
}