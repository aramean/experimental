test('settext - should set text of element', function () {
  var expected = 'text'
  var testElement = createElement('div')
  app.call('settext:#' + testElement.id + ':[' + expected + ']')
  assertEqual(testElement.innerText, expected)
})