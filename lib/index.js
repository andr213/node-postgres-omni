var _ = require('lodash');

/*function fromPositional (sql, params) {
	var pattern = /\$(?=\)|,| |;|>|<|$)/gim,
		last = 0, // lastIndex
		resultSql = '',
		i = 0, // placeholder number
		j = 0, //
		outParams = [];

	while ((find = pattern.exec(sql)) != null) {
		var placeholder = '';
		
		if (!_.isArray(params[j])) {
			params[j] = [params[j]];
		};
		params[j].forEach(function(value) {
			outParams.push(value);
			placeholder += '$' + (++i) + ',';
		});
		placeholder = placeholder.substring(0, placeholder.length - 1);

		resultSql += sql.slice(last, find.index) + placeholder;
		last = pattern.lastIndex;
		j++;
	};
	resultSql += sql.slice(last, sql.length);
	
	return {"text": resultSql, 'values': outParams};
};

function fromNamed (sql, params) {
	var namedPattern = /\$[a-z][\w\d]*\b/gim,
		last = 0, // lastIndex
		resultSql = '',
		i = 0, // placeholder number
		outParams = [], 
		hashParams = {};

	while ((find = namedPattern.exec(sql)) != null) {
		var placeholderName = find[0].substring(1);
		var placeholder = '';
		
		if (!hashParams.hasOwnProperty(placeholderName)) {
			if (!_.isArray(params[placeholderName])) {
				params[placeholderName] = [params[placeholderName]];
			};
			params[placeholderName].forEach(function(value) {
				outParams.push(value);
				placeholder += '$' + (++i) + ',';
			});
			hashParams[placeholderName] = placeholder.substring(0, placeholder.length - 1);
		};

		resultSql += sql.slice(last, find.index) + hashParams[placeholderName];
		last = namedPattern.lastIndex;
	};
	resultSql += sql.slice(last, sql.length);
	
	return {"text": resultSql, 'values': outParams};
};

function fromNumeric (sql, params) {
	var pattern = /\$\d*\b/gim,
		last = 0, // lastIndex
		resultSql = '',
		i = 0, // placeholder number
		outParams = [], 
		hashParams = {};

	while ((find = pattern.exec(sql)) != null) {
		var placeholderName = find[0].substring(1);
		var placeholder = '';
		
		if (!hashParams.hasOwnProperty(placeholderName)) {
			if (!_.isArray(params[placeholderName - 1])) {
				params[placeholderName - 1] = [params[placeholderName - 1]];
			};
			params[placeholderName - 1].forEach(function(value) {
				outParams.push(value);
				placeholder += '$' + (++i) + ',';
			});
			hashParams[placeholderName] = placeholder.substring(0, placeholder.length - 1);
		};

		resultSql += sql.slice(last, find.index) + hashParams[placeholderName];
		last = pattern.lastIndex;
	};
	resultSql += sql.slice(last, sql.length);
	
	return {"text": resultSql, 'values': outParams};
};*/

// transform array values into numbered hash
function transformValues (values) {
	if (_.isArray(values)) {
		var out = {}, i = 0;
		_.forEach(values, function (value) {
			out[++i] = value;
		});
		return out;
	} else {
		return values;
	};
};

// determine placeholder type
function getPlaceholderType (placeholder) {
	if (placeholder.match(/^\$\d+\b$/)) {
		return 'positional'
	} else if (placeholder.match(/^\$[a-z][\w|\d]*\b$/)) {
		return 'named'
	} else {
		return 'numeric'
	}
};

// transform string type params into object config style
function makeConfig (config, values, callback) {
	//config = (typeof(config) == 'string') ? {text: config}: config;
	config = (_.isString(config)) ? {text: config}: config;
	if (values) {
		//if(typeof values === 'function') {
		if(_.isFunction(values)) {
			config.callback = values;
		} else {
			config.values = values;
		}
	};
	if (callback) {
		config.callback = callback;
	};
	return config;
};

// Transform config to original numeric placeholders
function transformConfig (sql, values, callback, strict) {
	var pattern = /(\$\d+\b)|(\$[a-z][\w|\d]*\b)|(\${1})/gmi,
		last = 0, // lastIndex
		resultSql = '',
		i = 1, // placeholder number
		outParams = [], // out params
		hashParams = {}, // cache of placeholders
		placeholderType = '';
	
	var hashValues = transformValues(values);

	while ((find = pattern.exec(sql)) != null) {
		// check if placeholder type differs
		if (placeholderType === '') {
			// remember first placeholder
			placeholderType = getPlaceholderType(find[0]);
		} else {
			// Callback Error if differs 
			if (placeholderType !== getPlaceholderType(find[0])) {
				callback(new Error('Using different placeholders type in one query is restricted.'))
			}
		};
		
		// hash placeholder name
		var placeholderName = find[0].substring(1) + (find[0] === '$' ? i : '');
		// variable for multiple placeholders
		var placeholder = '';
		
		if (!hashParams.hasOwnProperty(placeholderName)) {
			// check if values does not include value
			if (!hashValues.hasOwnProperty(placeholderName)) {
				// Error if strict mode
				if (strict) {
					callback(new Error('Sql placeholders does not match with values'));
				};
			};
			// transform single value to array 
			if (!_.isArray(hashValues[placeholderName])) {
				hashValues[placeholderName] = [hashValues[placeholderName]];
			};
			
			// iterate array values and replace for numeric values
			hashValues[placeholderName].forEach(function(value) {
				outParams.push(value);
				placeholder += '$' + (i++) + ',';
			});
			// replace single to mupltiple placeholders = $1 -> $1,$2  
			
			//? test
			hashParams[placeholderName] = placeholder.substring(0, placeholder.length - 1);
		};
		// add sql with placeholder
		resultSql += sql.slice(last, find.index) + hashParams[placeholderName];
		// remember placeholder end index
		last = pattern.lastIndex;
	};
	// add the rest of query sql
	resultSql += sql.slice(last, sql.length);
	
	// return values
	callback(undefined, {"text": resultSql, 'values': outParams});
};

var omniQuery = function (config, values, callback, originalQuery, strict) {
	var config = makeConfig(config, values, callback);
	
	if (_.has(config, 'text') && !_.isEmpty(config.text) && _.isString(config.text)) {
		if (_.has(config, 'values') && !_.isEmpty(config.values)) {
			transformConfig(config.text, config.values, function (error, result) {
				if (error) {
					if (callback) {
						callback(error);
					} else {
						throw error;
					}
				};
				config.text = result.text;
				config.values = result.values;
			}, strict);
			// call pg with transformed params
			return originalQuery.call(this, config);
		} else {
			// pass original arguments into pg
			return originalQuery.call(this, config);
		}
	} else { //prepared query
		callback(new Error('Prepared query does not supports'));
	};
};

// patching query inside instance of client object
function omni (client, strict) {
	// strict default
	if (strict === undefined) {strict = false};
	
	// Save original query
	var originalQuery = client.query;
	
	// return if allready overrided
	if (originalQuery.omni) return client;
	
	originalQuery = originalQuery.bind(client);
	
	// Override original query
	client.query = function (config, values, callback) {
		return omniQuery.call(this, config, values, callback, originalQuery, strict);
	};
	// omni Flag
	client.query.omni = true;

	return client;
};

// return new original pg object with patched prototype query
function pgOmni (strict) {
	// strict default
	if (strict === undefined) {strict = false};

	var pg = require('pg');
	var originalQuery = pg.Client.prototype.query;
	
	pg.Client.prototype.query = function (config, values, callback) {
		return omniQuery.call(this, config, values, callback, originalQuery, strict);
	};
	
	return pg;
};

module.exports = omni;
module.exports.omni = omni;
//module.exports.omniQuery = 

// lazy loading pg
module.exports.__defineGetter__('pg', function () {
	//console.log(value);
	return module.exports.pg = pgOmni(false);
});
