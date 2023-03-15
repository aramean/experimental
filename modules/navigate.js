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
      baseUrl: app.baseUrl,
      target: 'main',
      loader: '#navloader'
    }, options.element)
    this.preloader = dom.get(this.config.loader)
  },

  /**
   * @function _click
   * @memberof app.module.navigate
   * @private
   */
  _click: function (event) {
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
    if (state.href === '/' || state.href === app.baseUrl) {
      state.target = 'html'
      state.extension = false
    } else if (!state.target || state.target[0] === '_') {
      state.target = this.config.target
    }

    app.xhr.get({
      url: state.href,
      urlExtension: state.extension,
      target: state.target,
      single: true,
      onprogress: { loader: this.config.loader },
      onload: { run: { func: 'app.templates.load', arg: state.arg } }
    })
  },

  /**
   * @function _preloader
   * @memberof app.module.navigate
   * @private
   */
  _preloader: {
    intervalId: null,

    load: function (loader, e) {
      this.reset(loader)

      var loaded = e.loaded || 0,
        total = e.total || 0,
        percent = (e.lengthComputable) ? Math.round((loaded / total) * 100) : 100

      var width = 1

      if (loaded !== total) {
        loader.firstChild.style.width = percent + "%"
      } else {
        this.intervalId = setInterval(function () {
          if (width === 100) {
            clearInterval(this.intervalId)
            dom.hide(loader)
          } else {
            loader.firstChild.style.width = width + "%"
          }

          width++
        }.bind(this), 3)
      }
    },

    reset: function (loader) {
      loader.firstChild.style.width = 0
      clearInterval(this.intervalId)
      dom.show(loader)
    },

    finish: function (loader) { },
  }
}