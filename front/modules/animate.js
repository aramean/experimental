'use strict'

app.module.animate = {
  start: function (element, value) {
    var element = element.exec && element.exec.element,
      keyframePercentages = element.getAttribute("animate-key").replace(/\s*;\s*/g, ';').split(';'),
      transforms = element.getAttribute("animate-transform").replace(/\s*;\s*/g, ';').split(';'),
      easing = element.getAttribute("animate-easing"),
      duration = element.getAttribute("animate-duration"),
      name = 'animate-' + element.id,
      keyframesCSS = ''

    // Generate CSS for keyframes
    for (var j = 0; j < transforms.length; j++) {
      var percentage = keyframePercentages[j] || (j * (100 / (transforms.length - 1)))
      keyframesCSS += percentage + '% { transform: ' + transforms[j] + ' }'
    }

    // Remove old style if it exists
    var oldStyleElement = document.getElementById(name)
    if (oldStyleElement) document.head.removeChild(oldStyleElement)

    // Create and append new style element
    var styleElement = document.createElement('style')
    styleElement.id = name
    document.head.appendChild(styleElement)
    var css = '@keyframes ' + name + ' {' + keyframesCSS + '}' +
      '#' + name + '{' + 'animation: ' + name + ' ' + duration + ' ' + easing + '}'
    styleElement.textContent = css

    // Reset animation
    element.style.animation = 'none' // Remove existing animation
    element.offsetHeight // Trigger reflow to reset animation
    element.style.animation = name + ' ' + duration + ' ' + easing // Reapply animation
  }
}