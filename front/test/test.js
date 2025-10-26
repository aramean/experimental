(function (global) {
  function log(name, expected, actual, passed) {
    var div = document.createElement('div')
    div.textContent = (passed ? '✅ ' : '❌ ') +
      name + ': expected "' + expected + '", got "' + actual + '"'
    div.style.color = passed ? 'green' : 'red'
    document.body.appendChild(div)
  }

  // Track current test name
  var currentTestName = ''

  global.test = function (name, fn) {
    currentTestName = name
    try {
      fn() // run the test
      currentTestName = '' // reset
    } catch (e) {
      // log failure with the correct test name
      log(currentTestName, e.expected || 'unknown', e.actual || 'unknown', false)
      currentTestName = ''
    }
  }

  global.assertEqual = function (actual, expected, message) {
    if (actual !== expected) {
      var error = new Error(message || 'Assertion failed')
      error.expected = expected
      error.actual = actual
      throw error
    } else {
      // log success with the current test name
      log(currentTestName, expected, actual, true)
    }
  }
})(this)