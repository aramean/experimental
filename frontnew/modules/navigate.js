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

    this._preloader.set(this.config.preloader)

    if (history.pushState) {
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
    var regex = /^\/+|\/+$/g,
      startpage = app.isLocalNetwork ? this.config.startpageLocal : this.config.starpage

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
  },

  /**
   * @function _preloader
   * @memberof app.module.navigate
   * @private
   */
  _preloader: {
    intervalId: null,
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
      if (this.isFastPage) this.eventCount = 0
      this.reset()

      var loaded = e.loaded || 0,
        total = e.total || (e.target.getResponseHeader('Content-Length') || e.target.getResponseHeader('content-length')) || 0,
        percent = Math.round((loaded / total) * 100) || 0

      //console.log('Loading bytes: ' + loaded + ' of ' + total)
      console.log(e)
      if (loaded !== total) { // Slow page
        this.isFastPage = false
        if (percent <= 100 && this.eventCount > 0) {
          this.progress(percent)
        }
      } else { // Fast page
        
        if (this.eventCount > 1) {
          console.log('Slow page')
        }

        console.error("Event count: " + this.eventCount)

        console.log(this.isFastPage)
        if (this.isFastPage && this.eventCount < 3) {
          console.error('running fast page')
          this.intervalId = requestAnimationFrame(this.animate.bind(this))
        }
      }

      if (onprogress) this.eventCount++

      console.log(this.eventCount)
    },

    animate: function () {
      var self = this,
        width = 0

      function animateFrame() {
        width += self.increment
        self.progress(width)
        if (width === 100) {
          console.log(width)
          self.finish()
        } else {
          requestAnimationFrame(animateFrame)
        }
      }

      requestAnimationFrame(animateFrame)
    },

    progress: function (width) {
      if (width >= 100) {
        console.log(width)
        return this.finish()
      }
      this.elementChild.style.width = width + '%'
    },

    reset: function () {
      console.error('reset')
      dom.show(this.element)
      this.progress(0)
      this.isFastPage = true
      cancelAnimationFrame(this.intervalId)
      clearInterval(this.intervalId)
    },

    finish: function () {
      dom.hide(this.element)
      cancelAnimationFrame(this.intervalId)
      clearInterval(this.intervalId)
    },
  },
}