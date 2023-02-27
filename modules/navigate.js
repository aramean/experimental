'use strict'

app.module.navigate = {

  /**
   * @function _autoload
   * @memberof app.module.navigate
   * @param {HTMLElement} scriptElement - The script element to load the configuration for.
   * @private
   */
  _autoload: function (options) {
    console.log(app.baseUrl)
    this.config = app.config.get('navigate', {
      startpage: '',
      startpageLocalhost: '',
      target: 'main',
      loader: '#navloader'
    }, options.element)
    this.preloader = dom.get(this.config.loader)
    this.startpage = app.isLocalNetwork ? this.config.startpageLocalhost : this.config.startpage
  },

  /**
   * @function _click
   * @memberof app.module.navigate
   * @private
   */
  _click: function (event) {
    this._preloader.reset(this.preloader)
    var link = dom.getTagLink(event.target)
    if (link && link.target !== '_blank') {
      event.preventDefault()
      if (link.href !== window.location.href) {
        history.pushState({
          'href': link.pathname,
          'target': link.target,
          'startpage': '',
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
      'startpage': '',
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
    if (state.href === '/') {
      state.target = 'html'
      state.startpage = this.startpage
      state.extension = false
    } else if (!state.target || state.target[0] === '_') {
      state.target = this.config.target
    }

    app.xhr.get({
      url: state.startpage + state.href,
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
    run: function (loader, e) {
      var percent = (e.lengthComputable) ? Math.round((e.loaded / e.total) * 100) : 100,
        lastUpdate = null,
        updateProgress = function () {
          loader.firstChild.style.width = percent + '%'
          lastUpdate = null
        }
      if (!lastUpdate) lastUpdate = setTimeout(updateProgress, 10)
    },

    reset: function (loader) {
      loader.firstChild.style.transition = 'width .5s ease-out'
      loader.firstChild.style.width = '0%'
      dom.show(loader)
    },

    finish: function (loader) {
      loader.addEventListener('transitionend', function () {
        dom.hide(loader)
      })
    },
  }
}