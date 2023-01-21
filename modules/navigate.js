'use strict'

app.module.navigate = {

  _autoload: function (options) {
    this.config = app.config.get('navigate', {
      target: 'main'
    }, options.element)
  },

  _open: function (event) {
    var link = dom.getTagLink(event.target)
    if (link && link.target !== '_blank') {
      event.preventDefault()
      if (link.href !== window.location.href) {
        history.pushState({
          'href': link.pathname,
          'target': link.target,
          'arg': { disableSrcdoc: true, runAttributes: true }
        }, 'Titel', link.href)
      }
      this._load(history.state)
    }
  },

  _pop: function (event) {
    var state = (event.state) ? event.state : {
      'href': window.location.href,
      'target': 'html',
      'extension': false,
      'arg': { disableSrcdoc: true, runAttributes: true }
    }
    this._load(state)
  },

  _load: function (state) {

    if (!state.target || state.target[0] === '_') {
      state.target = this.config.target;
    }

    console.dir(state)

    app.xhr({
      target: state.target,
      url: state.href,
      urlExtension: state.extension,
      onload: [{ module: 'app', func: 'loadTemplates', arg: state.arg }]
    })
  },
}