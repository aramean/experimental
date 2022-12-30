'use strict'

app.library.navigate = function (event) {

  var link = dom.getTagLink(event.target)
  if (link) {
    app.xhr({
      target: 'main',
      url: link.href,
      onload: { module: 'app', func: 'runAttributes', arg: 'main *' },
    })
  }
  event.preventDefault()
}