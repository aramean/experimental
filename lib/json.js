'use strict'

app.library.jsonsource = function (element) {
  var attr = element.attributes
  app.xhr({
    url: attr.jsonsource.value,
    target: attr.target.value,
    onload: { timeout: (attr.timeout) ? attr.timeout.value : 0 },
    onprogress: { content: (attr.progresscontent) ? attr.progresscontent.value : '' },
    onerror: { content: (attr.errorcontent) ? attr.errorcontent.value : false },
  })
}

app.library.jsonget = function (element) {
  console.dir(element)
}