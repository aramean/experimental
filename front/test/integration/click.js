test('click - utility triggers click event', function () {
  var clicked = false
  var testElement1 = createElement('button')

  // Add click event listener to verify click was triggered 
  testElement1.addEventListener('click', function () {
    clicked = true
  })

  testElement1.setAttribute('click', '')
  app.call('click:#' + testElement1.id)

  assertTrue(clicked, 'Click event should be fired')
})