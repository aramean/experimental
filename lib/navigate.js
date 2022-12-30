'use strict'

app.library.navigate = function (event) {

  var link = dom.getTagLink(event.target)
console.log(link.href)
  app.xhr({
    target: 'main',
    url: link.href,
    //onload: { module: 'app', func: 'runAttributes', arg: '#' + element.id + ' *' },
  })

  console.dir(link.href)
  /*var attr = element.attributes
  app.xhr({
    url: element.link,
    target: attr.target.value,
    onload: { timeout: (attr.timeout) ? attr.timeout.value : 0 },
    onprogress: { content: (attr.progresscontent) ? attr.progresscontent.value : '' },
    onerror: { content: (attr.errorcontent) ? attr.errorcontent.value : false },
  })*/
  event.preventDefault();
}