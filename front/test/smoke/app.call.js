test('app.call - parsedCall object', function () {
  var stub = createStub(app, 'exec')
  app.call('zoom:#myId.class:[123]')
  assertEqual(stub.get.func, 'zoom').desc('func name')
})