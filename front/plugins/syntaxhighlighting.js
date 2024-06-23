'use strict'

app.plugin.syntaxhighlighting = {

  __autoload: function () { },

  set: function (object) {
    var text = app.element.get(object)
    console.log(text)
    console.dir(object.textContent)
    object.textContent = this._colorize(object.textContent, 'colors:silver,cornsilk,navajowhite,slategray,green')
  },

  _colorize: function (text, attr) {
    var color = []
console.dir(text)
    for (var val in attr) {
      var prop = attr[val].split(":")
      if (prop[0] == "colors")
        color = prop[1].split(",")
    }

    //Name
    text = text.replace(/(&#0060;\w+|&#0060;&#0047;\w+)/ig, function (x) {
      var pos = (x.substr(0, 14) == "&#0060;&#0047;") ? 14 : 7
      var x = dom.insertAt(x, pos, '<span class="' + color[0] + '">')
      return x + '</span>'
    })

    //Attribute
    text = text.replace(/&#0032;[a-z&#0045;]+&#0061;+/ig, function (x) {
      var a = dom.insertAt(x, (x.length - 7), "</span>")
      return '&#0032;<span class="' + color[1] + '">' + a
    })

    //Value
    var text = text.replace(/&#0034;(.*?)&#0034;/ig, function (x) {
      return '<span class="' + color[2] + '">' + x + '</span>'
    })

    //Bracket
    text = text.replace(/(&#0060;&#0047;|&#0060;|&#0062;)/ig, function (x) {
      return '<span class="' + color[3] + '">' + x + '</span>'
    })

    //Comment
    text = text.replace(/<\w+\s+\S+&#0033;&#0045;&#0045;.(.*?).&#0045;&#0045;<\w+\s+\S+>/ig, function (x, y) {
      return '<span class="' + color[4] + '">' + dom.removeAllTags(x) + '</span>'
    })

    return text
  }

}