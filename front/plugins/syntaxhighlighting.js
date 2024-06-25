'use strict'

app.plugin.syntaxhighlighting = {

  __autoload: function () { },

  set: function (object) {
    if (object.exec) object = object.exec.element
    console.dir(object)
    object.innerHTML = this._colorize(object.innerHTML, 'silver,cornsilk,navajowhite,slategray,green')
  },

  _colorize: function (text, colors, object) {
    var color = colors.split(','),
      rep

    // Regex to match HTML attributes and values
    var attributeRegex = /(\s\w+=)("[^"]*"|'[^']*')/g

    // Replace matched attributes and values with span wrapped attributes and values
    var rep = text.replace(attributeRegex, function (match, p1, p2) {
      return '<span style="color:' + color[1] + '">' + p1 + '</span>' + '<span style="color:' + color[2] + '">' + p2 + '</span>'
    })

    return rep
  }

}