test('confirm - should show confirm dialog with provided message', function () {
  var expectedMessage = 'Are you sure?'
  var test = app.call('confirm:[' + expectedMessage + ']')
  assertEqual(test[0], expectedMessage)
})