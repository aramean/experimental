app.listeners.add(window, 'load', function () {
  test('queryhref - should update href using operate', function () {
    var testElement = createElement('a')
    testElement.setAttribute('href', 'https://example.com/old')

    var expected = 'https://example.com/old/newpath'
    app.call('queryhref:#' + testElement.id + ':[newpath:append]')

    assertEqual(testElement.getAttribute('href'), expected)
  })
})