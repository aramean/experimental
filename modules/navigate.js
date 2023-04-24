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
      preloader: '#navloader'
    }, options.element)
    this.preloader = dom.get(this.config.preloader)
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
    app.log.info()('Loading page: '+state.href)
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

    load: function (preloader, e) {
      this.preloader = preloader
      this.reset()
      var loaded = e.loaded || 0,
        total = e.total === 0 ? preloader.contentLength : e.total || 0,
        percent = Math.round((loaded / total) * 100) || 100,
        width = 1

      app.log.info(1)('Loading bytes: ' + total)
      if (loaded !== total && total > 0) {
        console.error("call")
        console.log(percent)
        this.progress(percent)
      } else {
        console.error("call2")
        console.log(percent)
        this.intervalId = requestAnimationFrame(function animate() {
          width === 100 ? this.finish() : this.progress(width)
          width += 3 // increment width by 2
          if (width <= 100) {
            requestAnimationFrame(animate.bind(this))
          }
        }.bind(this))
      }
    },

    progress: function (width) {
      this.preloader.firstChild.style.width = width + "%"
    },

    reset: function () {
      clearInterval(this.intervalId)
      this.progress(0)
      dom.show(this.preloader)
    },

    finish: function () {
      clearInterval(this.intervalId)
      this.progress(100)
      dom.hide(this.preloader)
    },
  }
}