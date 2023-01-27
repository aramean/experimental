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

  _run: function (arg) {
    var $response = this.$response,
      element = arg.element,
      iterate = arg.iterate,
      total = iterate && $response[iterate].length - 1

      var originalNode = element.cloneNode(true),
        content = ''

      for (var i = 0; i <= total; i++) {
        content += originalNode.innerHTML
      }

      element.innerHTML = content
      
      /*var originalNode = element.cloneNode(true)
      originalNode.innerHTML*/
    //console.log(iterate)
    console.dir(total)
    //console.log($response.iterate)
  }
}