'use strict'

app.module.navigate = {

  /**
   * @function _autoload
   * @memberof app.module.navigate
   * @param {HTMLElement} scriptElement - The script element to load the configuration for.
   * @private
   */
  _autoload: function (options) {
    if (window.history) {
      this.config = app.config.get('navigate', {
        baseUrl: app.baseUrl,
        target: 'main',
        preloader: '#navloader'
      }, options.element)
      this.preloader = dom.get(this.config.preloader)

      app.listeners.add(window, 'popstate', this._pop.bind(this))
      app.listeners.add(document, 'click', this._click.bind(this))
    }
  },

  /**
   * @function _click
   * @memberof app.module.navigate
   * @private
   */
  _click: function (event) {
    console.log('click click')
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
    app.log.info()('Loading page: ' + state.href)
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
      onprogress: { preloader: this.config.preloader },
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
    preloader: null,
    treshold: 10000,
    increment: 4,

    load: function (preloader, e) {
      this.preloader = preloader
      this.reset()

      var loaded = e.loaded || 0,
        total = e.total || (e.target.getResponseHeader('Content-Length') || e.target.getResponseHeader('content-length')) || 0,
        percent = Math.round((loaded / total) * 100) || 100

      app.log.info(1)('Loading bytes: ' + loaded + ' of ' + total)
      if (loaded !== total && total > this.treshold) {
        if (percent !== 100) this.progress(percent)
      } else {
        this.intervalId = requestAnimationFrame(this.animate.bind(this))
      }
    },

    animate: function () {
      var width = parseInt(this.preloader.firstChild.style.width, 10)
      if (width >= 100) {
        this.finish()
      } else {
        this.progress(width + this.increment)
        this.intervalId = requestAnimationFrame(this.animate.bind(this))
      }
    },

    progress: function (width) {
      this.preloader.firstChild.style.width = width + '%'
    },

    reset: function () {
      this.progress(0)
      cancelAnimationFrame(this.intervalId)
      clearInterval(this.intervalId)
      dom.show(this.preloader)
    },

    finish: function () {
      cancelAnimationFrame(this.intervalId)
      clearInterval(this.intervalId)
      dom.hide(this.preloader)
    },
  },
}