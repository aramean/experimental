'use strict'

app.module.math = {
  round: function (element, value) {
    var value = app.element.get(element)
    app.element.set(element, Math.round(parseFloat(value)))
  },

  alert: function(value) {
    alert('yes')
  },

  compute: function(element, value) {
    var value = app.element.get(element).replace(/[^0-9+\-*/.()]/g, '')
    // Replace instances of digits followed by an opening parenthesis with the multiplication sign
    value = value.replace(/(\d)\(/g, '$1*(')

    // Replace commas with periods
    value = value.replace(/,/g, '.')

    // Evaluate the expression
    app.element.set(element, eval(value))
  }
}