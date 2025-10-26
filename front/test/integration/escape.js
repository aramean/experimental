app.listeners.add(window, 'load', function () {
  test('escape - should escape a single character', function () {
    var testElement = createElement('div')
    testElement.innerText = 'A'
    app.call('escape:#' + testElement.id)
    var expected = '&#65;'
    assertEqual(testElement.innerText, expected)
  })

  test('escape - should escape an emoji character', function () {
    var testElement = createElement('div')
    testElement.innerText = '😀'
    app.call('escape:#' + testElement.id)
    var expected = '&#128512;'
    assertEqual(testElement.innerText, expected)
  })

  test('escape - should escape a special character', function () {
    var testElement = createElement('div')
    testElement.innerText = '<'
    app.call('escape:#' + testElement.id)
    var expected = '&#60;'
    assertEqual(testElement.innerText, expected)
  })
})