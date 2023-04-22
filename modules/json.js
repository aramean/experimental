'use strict'

app.module.json = {
  src: function (element) {
    var attr = element.attributes,
      options = {
        loader: attr.loader && attr.loader.value,
        iterate: attr.iterate && attr.iterate.value,
        element: element
      }

    app.xhr.get({
      url: attr['json-src'].value,
      target: attr.target ? attr.target.value : false,
      response: 'json',
      onload: {
        run: { func: 'app.module.json._run', arg: options },
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
      iterateObject = iterate === 'true' ? $response : $response[iterate],
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

      var jsonget = elements[i].getAttribute('json-get')

      if (i % orginalNodeCountAll === 0) {
        j++
      }

      if (jsonget) dom.set(elements[i], iterateObject[j][jsonget])
    }

    app.attributes.run(elements, ['json-get'])

    this._finish(options)
    this._bind($response, options)
  },

  _finish: function (options) {
    if (options.loader) {
      dom.show(options.element)
      dom.hide(options.loader)
    }
  },

  _bind: function (response, options) {
    var bind = options.element.getAttribute('json-bind')

    if (bind) {
      var parts = bind.split(';')
      for (var i = 0; i < parts.length; i++) {
        console.log(parts[0])

        var parts = bind.split(':')
        console.dir(parts)
        console.log(parts[0])

      }
    }


    //console.log(response[options.iterate].length)
  },
}