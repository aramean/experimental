'use strict'

app.module.json = {
  src: function (element) {
    var attr = element.attributes

    app.xhr({
      url: attr['json-src'].value,
      target: (attr.target) ? attr.target.value : false,
      onload: {
        run: {
          func: 'app.module.json._run',
          arg: 'ss'
        },
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
    console.log(arg)
    console.log('get json')
  }
}