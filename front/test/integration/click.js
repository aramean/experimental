test('click - utility triggers click event', function (done) {
  var testElement = createElement('button')
  var clicked = false

  testElement.addEventListener('click', function () {
    clicked = true
  })

  app.call('click:#' + testElement.id)
  assertTrue(clicked, 'Click event should be fired')
})