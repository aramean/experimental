app.listeners.add(window, 'load', function () {
  test('sethtml updates div element', function () {
    var expected = 'OK'
    var testElement = createElement('div')
    app.call('sethtml:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.innerHTML, expected)
  })
})