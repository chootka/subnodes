var Collection = require('ampersand-collection')
	,underscoreMixin = require("ampersand-collection-underscore-mixin")
	,Message = require('./message');
	

module.exports = Collection.extend(underscoreMixin, {
    model: Message
});