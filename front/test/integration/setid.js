app.listeners.add(window, 'load', function () {
  test('setid - should set id attribute of element', function () {
    var testElement = createElement('div')
    var expected = 'id'
    app.call('setid:#' + testElement.id + ':[' + expected + ']')
    assertEqual(testElement.getAttribute('id'), expected)
  })
})