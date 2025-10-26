app.listeners.add(window, 'load', function () {
  var content = 'abcdef'

  test('slice - should slice element content from index 1', function () {
    var testElement = createElement('div')
    testElement.innerText = content
    var expected = 'bcdef'
    app.call('slice:#' + testElement.id + ':[0,1]')
    assertEqual(testElement.innerText, expected)
  })

  test('slice - should slice element content from index 2', function () {
    var testElement = createElement('div')
    testElement.innerText = content
    var expected = 'cdef'
    app.call('slice:#' + testElement.id + ':[0,2]')
    assertEqual(testElement.innerText, expected)
  })

  test('slice - should slice element content from index 3', function () {
    var testElement = createElement('div')
    testElement.innerText = content
    var expected = 'def'
    app.call('slice:#' + testElement.id + ':[3]')
    assertEqual(testElement.innerText, expected)
  })

  test('slice - should slice element content from index 4', function () {
    var testElement = createElement('div')
    testElement.innerText = content
    var expected = 'ef'
    app.call('slice:#' + testElement.id + ':[4]')
    assertEqual(testElement.innerText, expected)
  })

  test('slice - should slice element content from index 5', function () {
    var testElement = createElement('div')
    testElement.innerText = content
    var expected = 'f'
    app.call('slice:#' + testElement.id + ':[5]')
    assertEqual(testElement.innerText, expected)
  })
})