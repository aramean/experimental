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

})(this)