app.listeners.add(window, 'load', function () {
  test('setname - should set name attribute of element', function () {
    var testElement = createElement('input')
    var expected = 'name'
    app.call('setname:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.getAttribute('name'), expected)
  })
})