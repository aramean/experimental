'use strict'

app.module.chronotize = {
  _weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  day: function (element) {
    var date = new Date(element.innerHTML)
    var dayIndex = date.getDay()
    dom.set(element, this._weekdays[dayIndex])
  }
}