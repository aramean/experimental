'use strict'

app.module.navigate = {

  _conf: { currentHref: window.location.href },

  _autoload: function (scriptElement, options) {
    this._conf = this.conf(scriptElement)
  },

  _open: function (event) {
    var link = dom.getTagLink(event.target)
    if (link && link.target !== '_blank') {
      event.preventDefault()
      if (link.href !== this._conf.currentHref) {
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
      'href': this._conf.currentHref,
      'target': 'html',
      'extension': false,
      'arg': { disableSrcdoc: true, runAttributes: true }
    }
    this._load(state)
  },

  _load: function (state) {
    app.xhr({
      target: (state.target && state.target[0] !== '_') ? state.target : this._conf.target,
      url: state.href,
      urlExtension: state.extension,
      onload: [{ module: 'app', func: 'loadTemplates', arg: state.arg }]
    })
  },

  conf: function (element) {
    var standard = {
      target: 'main'
    }
    return app.parseConfig('navigate', standard, element)
  },
}