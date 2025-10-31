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
    if (isPass) passed++; else failed++
    var parts = name.split(' - ')
    var group = parts.length > 1 ? parts[0] : 'Ungrouped'
    var title = parts.length > 1 ? parts.slice(1).join(' - ') : parts[0]

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
  }

  global.cleanup = function () {
    var els = document.querySelectorAll('[id][style*="display: none"]'), i
    for (i = els.length - 1; i >= 0; i--) els[i].parentNode.removeChild(els[i])
  }

  global.test = function (name, fn, cb) {
    // only run test if it matches the filter (or no filter is set)
    if (filterTest && name.toLowerCase().indexOf(filterTest.toLowerCase()) === -1) return

    global.cleanup()
    currentTest = name
    try {
      fn(function done() {
        currentTest = ''
        if (cb) cb()
        updateSummary()
      })
    } catch (e) {
      log(currentTest, e.expected || 'unknown', e.actual || 'unknown', false, e)
      currentTest = ''
      if (cb) cb()
      updateSummary()
    }
  }

  global.assertEqual = function (actual, expected, msg) {
    if (actual !== expected) {
      var e = new Error(msg || 'Assertion failed')
      e.expected = expected
      e.actual = actual
      throw e
    }
    log(currentTest, expected, actual, true)
  }

  global.assertTrue = function (val, msg) {
    if (val !== true) {
      var e = new Error(msg || 'Expected true')
      e.expected = true
      e.actual = val
      throw e
    }
    log(currentTest, true, val, true)
  }

  global.assertStyleEqual = function (el, prop, expected, msg) {
    var val = window.getComputedStyle(el)[prop]
    if (val !== expected) {
      var e = new Error(msg || 'Style assertion failed for ' + prop)
      e.expected = expected
      e.actual = val
      throw e
    }
    log(currentTest, expected, val, true)
  }

  global.createElement = function (tag) {
    // create the wrapper
    var wrapper = document.createElement('template')
    document.body.appendChild(wrapper)

    // create the actual element
    var el = document.createElement(tag || 'div')
    el.id = 'id_' + Math.random().toString(36).slice(2, 11)

    wrapper.appendChild(el)
    return el
  }

  function autoload() {
    var s = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script')
      return scripts[scripts.length - 1]
    }())
    var attr = s && s.getAttribute('autoload')

    // ✅ 1️⃣ If ?test= is present, always load only that test
    if (filterTest) {
      var sc = document.createElement('script')
      sc.src = filterTest + '.js'

      sc.onerror = function () { missing++ }
      document.head.appendChild(sc)
      app.log.info('Loaded filtered script (priority):', filterTest)
      return
    }

    // ✅ 2️⃣ Otherwise, continue with the normal autoload logic
    if (attr.indexOf('.json') !== -1) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', attr, true)
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var data = JSON.parse(xhr.responseText), key
              for (key in data) if (data.hasOwnProperty(key) && data[key].example) {
                (function (src) {
                  var sc = document.createElement('script')
                  sc.src = src
                  sc.onerror = function () { missing++ }
                  document.head.appendChild(sc)
                }(key + '.js'))
              }
              app.log.info('Loaded JSON tests:', attr)
            } catch (err) { console.error('JSON parse error:', err) }
          }
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
            document.head.appendChild(sc)
          }(f + '.js'))
        }
      }
      app.log.info('Loaded scripts:', files.join(', '))
    }
  }

  document.addEventListener('DOMContentLoaded', autoload)
}(this))