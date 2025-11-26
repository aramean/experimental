test('append - should insert element at the end', function () {
  var from = createElement('div')
  from.id = 'from'
  var to = createElement('div')
  to.id = 'to'

  app.call('append:#' + from.id + ':#' + to.id)
  assertEqual(from.lastChild.id, to.id)
})
