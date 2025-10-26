app.listeners.add(window, 'load', function () {
  test('bold ..updates div element', function () {
    var expected = 'OK'
    var testElement = createElement('div')
    app.call('bold:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.innerText, expected + '')
  })
})