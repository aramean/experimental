(function (global) {
  var currentTestName = ''
  var currentGroup = ''

  function log(name, expected, actual, passed, error) {
    var parts = name.split(' - ')
    var group, title

    if (parts.length > 1) {
      group = parts[0]
      title = parts.slice(1).join(' - ')
    } else {
      group = 'no group'      // default group if no "-"
      title = parts[0]    // use the whole name as title
    }

    // Only create header when group changes
    if (group !== currentGroup) {
      currentGroup = group
      var header = document.createElement('h4')
      header.textContent = group
      header.style.marginBottom = '4px'
      document.body.appendChild(header)
    }

    var div = document.createElement('div')
    div.textContent =
      (passed ? '✅ ' : '❌ ') +
      title +
      (passed ? '' : ': expected "' + expected + '", got "' + actual + '"')
    div.style.color = passed ? 'green' : 'red'
    document.body.appendChild(div)

    if (passed) {
      console.info('PASS:', name)
    } else {
      console.error('FAIL:', name, '| expected:', expected, '| got:', actual, '| error:', error)
    }
  }

  global.cleanup = function () {
    var elements = document.getElementsByTagName('*')
    for (var i = elements.length - 1; i >= 0; i--) {
      if (elements[i].id && elements[i].style.display === 'none') {
        elements[i].parentNode.removeChild(elements[i])
      }
    }
  }

  global.test = function (name, fn, callback) {
    global.cleanup()
    currentTestName = name
    try {
      var done = function () {
        currentTestName = ''
        if (callback) callback()
      }
      fn(done)
    } catch (e) {
      log(currentTestName, e.expected || 'unknown', e.actual || 'unknown', false, e)
      currentTestName = ''
      if (callback) callback()
    }
  }

  global.assertEqual = function (actual, expected, message) {
    if (actual !== expected) {
      var error = new Error(message || 'Assertion failed')
      error.expected = expected
      error.actual = actual
      throw error
    } else {
      log(currentTestName, expected, actual, true)
    }
  }

  // New boolean assertions
  global.assertTrue = function (value, message) {
    if (value !== true) {
      var error = new Error(message || 'Expected true')
      error.expected = true
      error.actual = value
      throw error
    } else {
      log(currentTestName, true, value, true)
    }
  }

  global.assertStyleEqual = function (el, property, expected, message) {
    var actual = global.getComputedStyle(el)[property]
    if (actual !== expected) {
      var error = new Error(message || 'Style assertion failed for ' + property)
      error.expected = expected
      error.actual = actual
      throw error
    } else {
      log(currentTestName, expected, actual, true)
    }
  }

  global.createElement = function (tag) {
    tag = tag || 'div'
    var el = document.createElement(tag)
    el.style.display = 'none'
    el.id = 'id_' + Math.random().toString(36).slice(2, 11)
    document.body.appendChild(el)
    return el
  }

  // Autoload support
  function autoloadAttributes() {
    var thisScript = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script')
      return scripts[scripts.length - 1]
    })()

    var autoloadAttr = thisScript && thisScript.getAttribute('autoload')
    if (!autoloadAttr) return

    // If it's a JSON path, load JSON and auto-load scripts with "example"
    if (autoloadAttr.indexOf('.json') !== -1) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', autoloadAttr, true)
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var attributes = JSON.parse(xhr.responseText)
              for (var key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                  var def = attributes[key]
                  if (def.example) {
                    var script = document.createElement('script')
                    script.src = key + '.js'
                    script.async = true
                    document.head.appendChild(script)
                  }
                }
              }
              app.log.info()('✅ Loaded attribute test scripts from JSON:', autoloadAttr)
            } catch (err) {
              console.error('❌ Failed to parse JSON:', err)
            }
          } else {
            console.error('❌ Could not load JSON:', xhr.status)
          }
        }
      }
      xhr.send()
    } else {
      // Otherwise treat as semicolon-separated list of script names
      var files = autoloadAttr.split(';')
      for (var i = 0; i < files.length; i++) {
        var file = files[i].replace(/^\s+|\s+$/g, '')
        if (file) {
          var s = document.createElement('script')
          s.src = file + '.js'
          s.async = false // maintain order
          document.head.appendChild(s)
        }
      }
      app.log.info()('✅ Loaded attribute test scripts from list:', files.join(', '))
    }
  }

  document.addEventListener('DOMContentLoaded', autoloadAttributes)

})(this)