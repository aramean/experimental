'use strict'

app.module.json = {
  src: function (element) {
    var attr = element.attributes,
      options = {
        iterate: attr.iterate && attr['iterate'].value,
        element: element
      }

    app.xhr({
      url: attr['json-src'].value,
      target: (attr.target) ? attr.target.value : false,
      response: 'json',
      onload: {
        run: { func: 'app.module.json._run', arg: options },
        timeout: (attr.timeout) ? attr.timeout.value : 0
      },
      onprogress: { content: (attr.progresscontent) ? attr.progresscontent.value : '' },
      onerror: { content: (attr.errorcontent) ? attr.errorcontent.value : false },
    })

  },

  get: function (element) {
    dom.set(element, '...')
  },

  _run: function (options) {
    var $response = this.$response,
      element = options.element,
      iterate = options.iterate,
      total = iterate && $response[iterate].length - 1

    var originalNode = element.cloneNode(true),
      orginalNodeCountAll = originalNode.getElementsByTagName("*").length,
      content = '',
      j = -1

    for (var i = 0; i <= total; i++) {
      content += originalNode.innerHTML
    }

    element.innerHTML = content

    var elements = element.getElementsByTagName("*")

    for (var i = 0; i < elements.length; i++) {

      if (i % orginalNodeCountAll == 0) {
        j++
      }

      var jsonget = elements[i].getAttribute('json-get')
      if (jsonget) {
        dom.set(elements[i], $response[iterate][j][jsonget])
        //app.runAttributes(element)
      }
    }
  }
}