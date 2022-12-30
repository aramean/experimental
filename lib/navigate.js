'use strict'

app.library.navigate = function (event) {
  var link = dom.getTagLink(event.target),
    target = link.target,
    href = link.href
  if (link && link.target !== '_blank') {
    app.xhr({
      target: (target && target[0] !== '_') ? target : 'main',
      url: href,
      onload: { module: 'app', func: 'runAttributes', arg: 'main *' },
    })

    event.preventDefault()
    history.pushState({ 'page_id': 1 }, '', href)
  }
}