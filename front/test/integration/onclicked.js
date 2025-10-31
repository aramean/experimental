test('ondisabled - should fire onclicked when element is clicked', function () {
  var testElement = createElement('button')
  app.call('click:#' + testElement.id)
  testElement.setAttribute('onclicked', 'setvalue:[OK]')
  dom.rerun(testElement)
  assertEqual(testElement.value, 'OK')
})