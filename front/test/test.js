(function (global) {
  // get test filter from querystring using your app.querystrings.get
  var filterTest = app.querystrings.get('', 'test')

  var currentTest = '', currentGroup = ''
  var total = 0, passed = 0, failed = 0, missing = 0

  function getContainer() {
    return document.querySelector('main')
  }

  function updateSummary() {
    var s = document.getElementById('summary')
    if (!s) {
      s = document.createElement('div')
      s.id = 'summary'
      document.body.insertBefore(s, getContainer())
    }
    s.textContent = 'Total: ' + total + ', Passed: ' + passed + ', Failed: ' + failed + ', Missing: ' + missing
  }

  function log(name, expected, actual, isPass, error) {
    total++
    isPass ? passed++ : failed++
    var parts = name.split(' - '),
      group = parts.length > 1 ? parts[0] : 'Ungrouped',
      title = parts.length > 1 ? parts.slice(1).join(' - ') : parts[0]

    if (group !== currentGroup) {
      currentGroup = group
      var h = document.createElement('h4')
      h.textContent = group
      getContainer().appendChild(h)
    }

    var d = document.createElement('div')
    d.textContent = (isPass ? '✅ ' : '❌ ') + title +
      (isPass ? '' : ': expected "' + expected + '", got "' + actual + '"')
    d.style.color = isPass ? 'green' : 'red'
    getContainer().appendChild(d)

    if (isPass) console.info('PASS:', name)
    else console.error('FAIL:', name, '| expected:', expected, '| got:', actual, '| error:', error)

    updateSummary()

    return d // Return the log entry element for modification.
  }

  global.test = function (name, fn, cb) {
    // only run test if it matches the filter (or no filter is set).
    if (filterTest && name.toLowerCase().indexOf(filterTest.toLowerCase()) === -1) return

    currentTest = name
    var doneCalled = false
    var done = function () {
      if (doneCalled) return
      doneCalled = true
      currentTest = ''
      if (cb) cb()
      updateSummary()
    }

    try {
      fn(done)
      // If sync (fn doesn't accept done), call done immediately after.
      if (fn.length === 0) done()
    } catch (e) {
      log(currentTest, e.expected || 'unknown', e.actual || 'unknown', false, e)
      done() // Ensure cleanup even on failure.
    }
  }

  global.assertEqual = function (actual, expected, msg) {
    if (actual !== expected) {
      var e = new Error(msg || 'Assertion failed')
      e.expected = expected
      e.actual = actual
      throw e
    }
    var entry = log(currentTest, expected, actual, true)
    return {
      desc: function (description) {
        entry.textContent += ' — ' + description
      }
    }
  }

  global.assertTrue = function (val, msg) {
    if (val !== true) {
      var e = new Error(msg || 'Expected true')
      e.expected = true
      e.actual = val
      throw e
    }
    var entry = log(currentTest, true, val, true)
    return {
      desc: function (description) {
        entry.textContent += ' — ' + description
      }
    }
  }

  global.assertStyleEqual = function (el, prop, expected, msg) {
    var val = window.getComputedStyle(el)[prop]
    if (val !== expected) {
      var e = new Error(msg || 'Style assertion failed for ' + prop)
      e.expected = expected
      e.actual = val
      throw e
    }
    var entry = log(currentTest, expected, val, true)
    return {
      desc: function (description) {
        entry.textContent += ' — ' + description
      }
    }
  }

  global.assertIsObject = function (el) {
    if (typeof el !== 'object' || el === null) {
      const e = new Error(`Expected an object but got ${typeof el}`)
      e.expected = 'object'
      e.actual = typeof el
      throw e
    }

    var entry = entry = log(currentTest, 'object', el, true)
    return {
      desc: function (description) {
        entry.textContent += ' — ' + description
      }
    }
  }

  global.createElement = function (tag, noWrapper) {
    // create the wrapper.
    var wrapper = document.createElement('template')
    !noWrapper && document.body.appendChild(wrapper)

    // create the actual element.
    var el = document.createElement(tag || 'div')
    el.id = 'id_' + Math.random().toString(36).slice(2, 11)

    wrapper.appendChild(el)
    return el
  }

  /**
   * @function createStub
   * @memberof global
   * @param {object} obj - The object containing the method to stub.
   * @param {string} method - The name of the method on `obj` to stub.
   * @returns {object} - An object with a getter `get` that returns the last captured argument.
   * @desc Replaces a method on an object temporarily to capture.
   */
  global.createStub = function (obj, method) {
    var lastCall
    obj[method] = function (run, args) {
      lastCall = args && args[method]
    }
    return { get get() { return lastCall } }
  }

  function autoload() {
    var s = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script')
      return scripts[scripts.length - 1]
    }())
    var attr = s && s.getAttribute('autoload')

    // If ?test= is present, always load only that test.
    if (filterTest) {
      var sc = document.createElement('script')
      sc.src = filterTest + '.js'

      sc.onerror = function () { missing++ }
      document.head.appendChild(sc)
      app.log.info('Loaded filtered script (priority):', filterTest)
      return
    }

    // Otherwise, continue with the normal autoload logic.
    if (attr.indexOf('.json') !== -1) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', attr, true)
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText), key
            for (key in data) if (data.hasOwnProperty(key)) {
              (function (src) {
                var sc = document.createElement('script')
                sc.src = src
                sc.async = false
                sc.onerror = function () { missing++ }
                document.head.appendChild(sc)
              }(key + '.js'))
            }
            app.log.info('Loaded JSON tests:', attr)
          } catch (err) { console.error('JSON parse error:', err) }
        }
      }
      xhr.send()
    } else {
      var files = attr.split(';'), i
      for (i = 0; i < files.length; i++) {
        var f = files[i].replace(/^\s+|\s+$/g, '')
        if (f) {
          (function (src) {
            var sc = document.createElement('script')
            sc.src = src
            sc.async = false
            document.head.appendChild(sc)
          }(f + '.js'))
        }
      }
      app.log.info('Loaded scripts:', files.join(', '))
    }
  }

  document.addEventListener('DOMContentLoaded', autoload)
}(this))