'use strict'

app.module.navigate = {
  conf: {
    target: 'main',
    currentHref: window.location.href
  },

  open: function (event) {
    var link = dom.getTagLink(event.target)
    if (link && link.target !== '_blank') {
      event.preventDefault()
      if (link.href !== this.conf.currentHref) {
        history.pushState({
          'href': link.pathname,
          'target': link.target,
          'arg': { disableSrcdoc: true, runAttributes: true }
        }, 'Titel', link.href)
      }
      this.load(history.state)
    }
  },

  pop: function (event) {
    var state = (event.state) ? event.state : {
      'href': this.config.currentHref,
      'target': 'html',
      'extension': false,
      'arg': { disableSrcdoc: true, runAttributes: true }
    }
    this.load(state)
  },

  load: function (state) {
    app.xhr({
      target: (state.target && state.target[0] !== '_') ? state.target : this.conf.target,
      url: state.href,
      urlExtension: state.extension,
      onload: [{ module: 'app', func: 'loadTemplates', arg: state.arg }]
    })
  }
}