app.listeners.add(window, 'load', function () {
  test('settext updates div element', function () {
    var expected = 'OK'
    var testElement = createElement('div')
    app.call('settext:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.innerText, expected + '')
  })
})