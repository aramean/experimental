app.listeners.add(window, 'load', function () {
  test('show - should make hidden element visible', function () {
    var testElement = createElement('div')
    testElement.style.display = 'none'
    testElement.initDisplay = 'block'
    testElement.setAttribute('hide', '')

    app.call('show:#' + testElement.id)
    assertStyleEqual(testElement, 'display', 'block')
  })
})