test('hrefhost - should set base href based on matching hostname', function () {
  var testElement = createElement('base')
  testElement.setAttribute('href', 'https://example.com/old')
  var expected = 'https://example.com/old/newpath'
  app.call('hrefhost:#' + testElement.id + ':[newpath:append]')

  assertEqual(testElement.getAttribute('href'), expected)
})