test('append - should insert element at the end', function () {
  var parent = createElement('div')
  var child = createElement('div')
  child.id = 'child2'

  app.call('append:#' + parent.id + ':#' + child.id)
  assertEqual(parent.lastChild.id, child.id)
})
