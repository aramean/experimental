'use strict'

app.module.chronotize = {
  _weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  weekday: function (element) {
    var date = new Date(element.innerHTML),
      dayIndex = date.getDay(),
      setValue = this._weekdays[dayIndex]

    element.renderedText = setValue
    app.element.set(element, setValue)
  },

  age: function (element) {
    var input = element.innerHTML,
      formats = [
        /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/,
        /(\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})/,
        /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2}):(\d{1,2}):(\d{1,2})/,
        /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2}):(\d{1,2})/,
        /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2})/,
        /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/,
        /(\d{4}) ([a-zA-Z]+) (\d{1,2})/,
        /(\d{4}) ([a-zA-Z]+)/,
        /(\d{4}) (\d{1,2}) (\d{1,2})/,
        /(\d{4})(\d{2})(\d{2})/
      ]

    for (var i = 0; i < formats.length; i++) {
      var match = input.match(formats[i])
      if (match) {
        var year = parseInt(match[1], 10),
          month = parseInt(match[2], 10) - 1,
          day = parseInt(match[3], 10),
          birthdateObject = new Date(year, month, day)

        if (birthdateObject) {
          var age = new Date() - birthdateObject,
            calculatedAge = new Date(age).getUTCFullYear() - 1970
          dom.set(element, calculatedAge)
        }

        break
      }
    }
  }
}