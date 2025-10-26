app.listeners.add(window, 'load', function () {
  test('sethtml - should set html of element', function () {
    var expected = '<b>html</b>'
    var testElement = createElement('div')
    app.call('sethtml:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.innerHTML, expected)
  })
})