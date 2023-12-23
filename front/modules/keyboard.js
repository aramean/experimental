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
      if (e.key == this.keys[i].key) {
        var action = this.keys[i].action.split(':'),
          run = action[0],
          arg = action[1],
          element = this.keys[i].element
        e.element = element
        app.call(['dom', run], element.clicked ? [element, arg] : [arg])
      }
    }
  },

  key: function (element) {
    var key = element.getAttribute('keyboard-key'),
      action = element.getAttribute('keyboard-action')
    element = element

    if (action === 'click') {
      action = element.getAttribute('click')
      element.clicked = true
    }

    this.keys.push({ key: key, action: action, element: element })
  },
}