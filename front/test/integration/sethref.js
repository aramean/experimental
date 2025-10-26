app.listeners.add(window, 'load', function () {
  test('sethref - should set href attribute of element', function () {
    var testElement = createElement('a')
    var expected = 'https://example.com'
    app.call('sethref:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.getAttribute('href'), expected)
  })
})