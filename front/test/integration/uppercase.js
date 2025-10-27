app.listeners.add(window, 'load', function () {
  test('uppercase - should convert element content to uppercase', function () {
    var expected = 'UPPERCASE'
    var testElement = createElement('span')
    testElement.innerHTML = 'uppercase'

    app.call('uppercase:#' + testElement.id)
    assertEqual(testElement.innerHTML, expected)
  })
})