(function (global) {

  var currentTestName = ''

  function log(name, expected, actual, passed, error) {
    var div = document.createElement('div')
    div.textContent = (passed ? '✅ ' : '❌ ') + name + ': expected "' + expected + '", got "' + actual + '"'
    if (!passed && error) div.textContent += ' | Error: ' + (error.message || error)
    div.style.color = passed ? 'green' : 'red'
    document.body.appendChild(div)
    if (passed) {
      console.info('PASS:', name, '| expected:', expected, '| got:', actual)
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

  global.createElement = function (tag) {
    tag = tag || 'div'
    var el = document.createElement(tag)
    el.style.display = 'none'
    el.id = 'id_' + Math.random().toString(36).slice(2, 11)
    document.body.appendChild(el)
    return el
  }

  function initTests() {
    var retries = 0, maxRetries = 100
    var interval = setInterval(function () {
      if ((global.front && global.front.isReady) || retries++ >= maxRetries) {
        clearInterval(interval)
      }
    }, 100)
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', initTests, false)
  } else {
    window.onload = initTests
  }

})(this)