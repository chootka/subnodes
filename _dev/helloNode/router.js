function route(handle, pathname, response, request) {
	console.log("About to route req for " + pathname);
	if (typeof handle[pathname] === 'function') {
		handle[pathname](response, request);
	} else {
		console.log("No req handler found for " + pathname);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 Not found");
		response.end();
	}
}

exports.route = route;
