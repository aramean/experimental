'use strict'

app.module.animate = {
  start: function (element, value) {
    var element = document.querySelector("#animate")
    var keyframes = element.getAttribute("animate-key").split(';')
    var easing = element.getAttribute("animate-load")
    var duration = element.getAttribute("animate-interval")

    // Remove extra whitespace from keyframes
    for (var i = 0; i < keyframes.length; i++) {
      keyframes[i] = keyframes[i].trim()
    }

    var keyframesCSS = ''
    for (var j = 0; j < keyframes.length; j++) {
      var percentage = j * (100 / (keyframes.length - 1))
      keyframesCSS += percentage + '% { transform: ' + keyframes[j] + '; }\n'
    }

    // Remove old style if it exists
    var oldStyleElement = document.getElementById('dynamic-animation-styles')
    if (oldStyleElement) {
      document.head.removeChild(oldStyleElement)
    }

    // Create and append new style element
    var styleElement = document.createElement('style')
    styleElement.id = 'dynamic-animation-styles'
    document.head.appendChild(styleElement)
    var css = '@keyframes dynamicAnimation {\n' + keyframesCSS + '}\n' +
              '#animate {\n' +
              '  animation: dynamicAnimation ' + duration + ' ' + easing + ';\n' +
              '}\n'
    styleElement.textContent = css

    // Reset animation
    element.style.animation = 'none' // Remove existing animation
    element.offsetHeight // Trigger reflow to reset animation
    element.style.animation = 'dynamicAnimation ' + duration + ' ' + easing // Reapply animation
  }
}