'use strict'

app.module.math = {
  round: function (element, value) {
    var value = app.element.get(element)
    app.element.set(element, Math.round(parseFloat(value)))
  },

  compute: function(element, value) {
    var value = app.element.get(element).replace(/([=+\-*/])(?=[=+\-*/])/g, '')
    app.element.set(element, eval(value))
  }
}