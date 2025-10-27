app.listeners.add(window, 'load', function () {
  test('focus - should focus the element', function () {
    var testElement = createElement('input')
    var focused = false

    // Mock the focus method
    testElement.focus = function () { focused = true }

    app.call('focus:#' + testElement.id)
    assertTrue(focused)
  })
})