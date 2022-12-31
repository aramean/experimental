'use strict'

app.library.json = {
  source: function (element) {
    var attr = element.attributes
    app.xhr({
      url: attr['json-source'].value,
      target: attr.target.value,
      onload: { timeout: (attr.timeout) ? attr.timeout.value : 0 },
      onprogress: { content: (attr.progresscontent) ? attr.progresscontent.value : '' },
      onerror: { content: (attr.errorcontent) ? attr.errorcontent.value : false },
    })
  },

  get: function () {
    console.log('get json')
  }
}