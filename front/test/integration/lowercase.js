app.listeners.add(window, 'load', function () {
  test('lowercase - should convert element content to lowercase', function () {
    var expected = 'lowercase'
    var testElement = createElement('span')
    testElement.innerHTML = 'LOWERCASE'

    app.call('lowercase:#' + testElement.id)
    assertEqual(testElement.innerHTML, expected)
  })
})