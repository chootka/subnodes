/* global console */
var path = require('path')
    ,config = require('getconfig')
    ,app = require('express')()
    ,compress = require('compression')
    ,serveStatic = require('serve-static')
    ,cookieParser = require('cookie-parser')
    ,bodyParser = require('body-parser')
    ,http = require('http').createServer(app)
    ,server = require('socket.io')(http)
    ,SocketServer = require('./socket_server')
    ,MoonbootsCfg = require('./moonboots_config');


// -----------------
// Configure express
// -----------------
app.use(compress());
app.use(serveStatic(path.resolve(path.normalize('public'))));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use Jade for template engine
app.set('view engine', 'jade');


// ----------------------------
// Set our client config cookie
// ----------------------------
app.use(function (req, res, next) {
    res.cookie('config', JSON.stringify(config.client));
    next();
});


// ---------------------------------------------------
// Configure Moonboots to serve our client application
// ---------------------------------------------------
new MoonbootsCfg({ app: app, config: config }).init();


// ----------------------
// Set up our HTTP server
// ----------------------
http.listen(config.http.port);
console.log('Hot Probs is running at: http://localhost:' + config.http.port + '.');


// ---------------------------------------------------
// Set up socket.io listeners for our application
// ---------------------------------------------------
new SocketServer({ io: server }).init();
