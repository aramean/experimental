var log = console.log
console.log = function(){
    //window.log(arguments)
    var args = Array.from(arguments);
    var LOG_PREFIX = new Date().getSeconds() + ':' + new Date().getMilliseconds()
    //args.unshift(LOG_PREFIX + ") ")
    log.apply(console, args)
}