'use strict'

app.module.navigate = {

  /**
   * @function _autoload
   * @memberof app.module.navigate
   * @param {HTMLElement} scriptElement - The script element to load the configuration for.
   * @private
   */
  __autoload: function (options) {
    this.config = app.config.get('navigate', {
      target: 'main',
      preloader: '#navloader',
      startpage: false,
      startpageLocal: false,
    }, options.element)

    if (history.pushState) {
      app.listeners.add(window, 'popstate', this._pop.bind(this))
      app.listeners.add(document, 'click', this._click.bind(this))
    }

    app.listeners.add(window, 'hashchange', this._hash.bind())
  },

  /**
   * @function _click
   * @memberof app.module.navigate
   * @private
   */
  _click: function (event) {
    var link = dom.getTagLink(event.target)
    if (link && link.hash) {
      this._hash(link)
    } else if (link && link.href && link.target !== '_blank') {
      var state = {
        'href': link.pathname,
        'target': link.target,
        'arg': { disableSrcdoc: true, runAttributes: true }
      }

      if (link.href !== window.location.href) {
        history.pushState(state, '', link.href)
      }

      this._load(history.state || state)
    } else {
      return
    }

    return event.preventDefault()
  },

  /**
   * @function _pop
   * @memberof app.module.navigate
   * @private
   */
  _pop: function (event) {
    var state = (event.state) ? event.state : {
      'href': window.location.pathname,
      'hash': window.location.hash,
      'target': !event.state ? false : 'html',
      'extension': false,
      'arg': { disableSrcdoc: true, runAttributes: true }
    }
    this._load(state)
    if (state.hash) this._hash(state)
  },

  /**
   * @function _load
   * @memberof app.module.navigate
   * @private
   */
  _load: function (state) {
    var regex = /^\/+|\/+$/g,
      startpage = app.isLocalNetwork ? this.config.startpageLocal : this.config.startpage

    if (state.href === '/' || state.href.replace(regex, '') === startpage.replace(regex, '')) {
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
      type: 'page',
      onprogress: { preloader: this.config.preloader },
      onload: {
        run: {
          func: 'app.attributes.run',
          arg: 'main *'
        }
      }
    })

    this._preloader.set(this.config.preloader)
    this._preloader.reset()
  },

  _hash: function (link) {
    var hash = link && link.hash
    if (hash) {
      var targetElement = dom.get(hash)
      if (targetElement) {
        var test = dom.get('main')
        if (test) test.scrollTop = targetElement.offsetTop
      }
    }
  },

  /**
   * @function _preloader
   * @memberof app.module.navigate
   * @private
   */
  _preloader: {
    intervalId: null,
    treshold: 10000,
    increment: 4,
    element: null,
    elementChild: null,
    eventCount: 0,
    isFastPage: true,

    set: function (selector) {
      this.element = dom.get(selector)
      this.elementChild = this.element.firstChild
    },

    load: function (e, onprogress) {
      if (onprogress) this.eventCount++
      if (this.isFastPage) this.eventCount = 0
      this.isFastPage = true

      var loaded = e.loaded || 0,
        total = e.total || (e.target.getResponseHeader('Content-Length') || e.target.getResponseHeader('content-length')) || 0,
        percent = Math.round((loaded / total) * 100) || 0

      if (loaded !== total && total >= this.treshold) { // Slow page
        this.isFastPage = false
        if (percent <= 100 && this.eventCount > 0) this.progress(percent)
      } else { // Fast page
        if (this.isFastPage && this.eventCount < 3)
          this.intervalId = requestAnimationFrame(this.animate.bind(this))
        else
          this.progress(100)
      }
    },

    animate: function () {
      var self = this,
        width = 0

      function animateFrame() {
        width += self.increment
        self.progress(width)
        if (width <= 100)
          requestAnimationFrame(animateFrame)
      }

      requestAnimationFrame(animateFrame)
    },

    progress: function (width) {
      this.elementChild.style.width = width + '%'
      if (width >= 100) this.finish()
    },

    reset: function () {
      this.progress(0)
      cancelAnimationFrame(this.intervalId)
      clearInterval(this.intervalId)
      dom.show(this.element)
    },

    finish: function () {
      cancelAnimationFrame(this.intervalId)
      clearInterval(this.intervalId)
      dom.hide(this.element)
    },
  },
}