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
      if (e.key == current.key) {
        var action = current.action,
          element = current.element,
          target = e.target.localName,
          scope = current.scope === '' ? element.localName : current.scope

        if (scope && target !== scope) continue

        switch (action) {
          case 'click':
            element.click()
            break
          default:
            var action = action.split(':')
            app.call(['dom', action[0]], [element, action[1]])
        }

      }
    }
  },

  key: function (element) {
    var key = element.getAttribute('keyboard-key'),
      action = element.getAttribute('keyboard-action'),
      scope = element.getAttribute('keyboard-scope')

    this.keys.push({ key: key, action: action, scope: scope, element: element })
  }
}