'use strict'

app.module.math = {
  round: function (element) {
    dom.set(element, Math.round(element.innerHTML))
  },

  compute: function(element, value) {
    var regex = /([=+\-*/])(?=[=+\-*/])/,
    value = value.replace(new RegExp(regex, 'g'), '')
    dom.set(element, value)
  }
}