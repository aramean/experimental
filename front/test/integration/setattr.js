app.listeners.add(window, 'load', function () {
  test('setattr - should set custom attribute', function () {
    var testElement = createElement('div')
    var expected = true
    app.call('setattr:#' + testElement.id + ':[data-test]')
    assertEqual(testElement.hasAttribute('data-test'), expected)
  })

  test('setattr - should set custom attribute with value', function () {
    var testElement = createElement('div')
    var expected = 'attribute'
    app.call('setattr:#' + testElement.id + ':[data-test,' + expected + ']')
    assertEqual(testElement.getAttribute('data-test'), expected)
  })
})