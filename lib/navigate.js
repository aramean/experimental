'use strict'

app.library.navigate = {
  open: function (event) {
    var link = dom.getTagLink(event.target)
    if (link && link.target !== '_blank') {
      event.preventDefault()
      this.load(link)
      if (link.href !== window.location.href)
        history.pushState({ 'href': link.pathname, 'target': link.target }, 'Titel', link.href)
    }
  },

  pop: function (event) {
    var state = (event.state) ? event.state : { 'href': window.location.href, 'target': 'html' }
    this.load(state)
  },

  load: function (link) {
    app.xhr({
      target: (link.target && link.target[0] !== '_') ? link.target : 'main',
      url: link.href,
      onload: { module: 'app', func: 'runAttributes', arg: 'main *' },
    })
  }

}