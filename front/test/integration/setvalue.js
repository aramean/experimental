app.listeners.add(window, 'load', function () {
  test('setvalue - should set value of input element', function () {
    var testElement = createElement('input')
    var expected = 'value'
    app.call('setvalue:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.value, expected)
  })
})