test('runorder - should execute attributes in runorder', function () {
  var testElement = createElement('div')
  testElement.setAttribute('bold')
  app.call('runorder:#' + testElement.id + ':[bold]')
  assertStyleEqual(testElement, 'font-weight', 'block')
})