app.listeners.add(window, 'load', function () {
  test('trim - should remove whitespaces from element content', function () {
    var expected = 'trim'
    var testElement = createElement('div')
    testElement.innerText = ' ' + expected + ' '
    app.call('trim:#' + testElement.id + ':[ ]')
    assertEqual(testElement.innerText, expected)
  })

  test('trimright - should remove right whitespaces from element content', function () {
    var expected = ' trim'
    var testElement = createElement('div')
    testElement.innerText = expected + ' '
    app.call('trimright:#' + testElement.id + ':[ ]')
    assertEqual(testElement.innerText, expected)
  })

  test('trimleft - should remove left whitespaces from element content', function () {
    var expected = 'trim '
    var testElement = createElement('div')
    testElement.innerText = ' ' + expected
    app.call('trimleft:#' + testElement.id + ':[ ]')
    assertEqual(testElement.innerText, expected)
  })
})