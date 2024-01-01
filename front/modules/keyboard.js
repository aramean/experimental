'use strict'

app.module.keyboard = {
  /**
   * @function _autoload
   * @memberof app.module.keyboard
   * @param {object} options - The script element to load the configuration for.
   * @private
   */
  keys: [],

  __autoload: function (options) {
    this.module = options.name
    var self = this

    app.listeners.add(document, 'keyup', function (e) {
      self._keypressed(e)
    })
  },

  _keypressed: function (e) {
    for (var i = 0; i < this.keys.length; i++) {
      var current = this.keys[i]
      if (e.key.toLowerCase() == current.key) {
        var action = current.action.split(':'),
          element = current.element,
          target = e.target.localName,
          scope = current.scope === '' ? element.localName : current.scope,
          run = action[0],
          arg = action[1]

        if (scope && target !== scope) continue
        e.element = element

        console.log(run)
        switch (run) {
          case 'href':
            element.click()
          default:
            app.call(['dom', run], element.clicked ? [element, arg] : [arg])
        }
      }
    }
  },

  key: function (element) {
    var key = element.getAttribute('keyboard-key').toLowerCase(),
      action = element.getAttribute('keyboard-action'),
      scope = element.getAttribute('keyboard-scope')
    element = element

    if (action === 'click') {
      action = element.getAttribute('click')
      element.clicked = true
    }

    this.keys.push({ key: key, action: action, scope: scope, element: element })
  }
}