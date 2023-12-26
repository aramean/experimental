'use strict'

app.module.math = {
  round: function (element) {
    dom.set(element, Math.round(element.innerHTML))
  }
}