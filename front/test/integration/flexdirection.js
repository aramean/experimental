app.listeners.add(window, 'load', function () {
  test('flexdirection - should set flex direction', function () {
    var expected = 'column'
    var testElement = createElement('div')
    app.call('flexdirection:#' + testElement.id + ':[column]')
    assertStyleEqual(testElement, 'flexDirection', expected)
  })
})