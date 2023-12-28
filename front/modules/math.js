'use strict'

app.module.math = {
  round: function (element, value) {
    if (!value) value = element.textContent
    var value = Math.round(parseFloat(value))
    dom.set(element, value)
  },

  compute: function(element, value) {
    if (!value) value = element.textContent
    value = value.replace(/([=+\-*/])(?=[=+\-*/])/g, '')
    dom.set(element, eval(value))
  }
}