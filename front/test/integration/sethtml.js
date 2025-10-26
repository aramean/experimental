app.listeners.add(window, 'load', function () {
  test('sethtml updates main', function () {
    var main = document.querySelector('main')
    var expected = 'OK'
    app.call('sethtml:*main:[' + expected + ']')
    assertEqual(main.innerHTML, expected, 'main content mismatch')
  })
})