app.listeners.add(window, 'load', function () {
  test('hide - should make visible element hidden', function () {
    var testElement = createElement('div')
    testElement.style.display = 'block'

    app.call('hide:#' + testElement.id)
    assertStyleEqual(testElement, 'display', 'none')
  })
})