'use strict'

app.library.navigate = {
  open: function (event) {
    var link = dom.getTagLink(event.target)
    if (link && link.target !== '_blank') {
      event.preventDefault()
      if (link.href !== window.location.href) {
        history.pushState({ 'href': link.pathname, 'target': link.target }, 'Titel', link.href)
      }
      this.load(link)
    }
  },

  pop: function (event) {
    var state = (event.state) ? event.state : { 'href': window.location.href, 'target': 'html', 'extension': false }
    this.load(state)
  },

  load: function (link) {
    app.xhr({
      target: (link.target && link.target[0] !== '_') ? link.target : 'main',
      url: link.href,
      urlExtension: link.extension,
      onload:
        [
          { module: 'app', func: 'loadTemplates', arg: true },
          { module: 'app', func: 'runAttributes', arg: 'main *' },
        ],
    })
  }
}