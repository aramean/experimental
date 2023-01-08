'use strict'

app.library.navigate = {
  open: function (event) {
    var link = dom.getTagLink(event.target)
    if (link && link.target !== '_blank') {
      event.preventDefault()
      if (link.href !== window.location.href) {
        history.pushState({ 'href': link.pathname, 'target': link.target }, 'Titel', link.href)
      }
      this.load(history.state)
    }
  },

  pop: function (event) {
    var state = (event.state) ? event.state : { 'href': window.location.href, 'target': 'html', 'extension': false }
    this.load(state)
  },

  load: function (state) {
    app.xhr({
      target: (state.target && state.target[0] !== '_') ? state.target : 'main',
      url: state.href,
      urlExtension: state.extension,
      onload: [{ module: 'app', func: 'loadTemplates', arg: { disableSrcdoc: true, runAttributes: true } }]
    })
  }
}