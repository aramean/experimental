'use strict'

app.module.navigate = {

  /**
   * @function _autoload
   * @memberof app.module.navigate
   * @param {HTMLElement} scriptElement - The script element to load the configuration for.
   * @private
   */
  _autoload: function (options) {
    this.config = app.config.get('navigate', {
      target: 'main'
    }, options.element)
  },

  /**
   * @function _open
   * @memberof app.module.navigate
   * @private
   */
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

  /**
   * @function _pop
   * @memberof app.module.navigate
   * @private
   */
  _pop: function (event) {
    var state = (event.state) ? event.state : {
      'href': window.location.href,
      'target': 'html',
      'extension': false,
      'arg': { disableSrcdoc: true, runAttributes: true }
    }
    this._load(state)
  },

  /**
   * @function _load
   * @memberof app.module.navigate
   * @private
   */
  _load: function (state) {
    if (state.href === '/')
      state.target = 'html'
    else if (!state.target || state.target[0] === '_')
      state.target = this.config.target

    app.xhr({
      url: state.href,
      urlExtension: state.extension,
      target: state.target,
      onload: { run: { func: 'app.templates.load', arg: state.arg } }
    })
  },
}