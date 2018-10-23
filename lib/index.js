// transform array values into numbered hash
function transformValues (values) {
  var isArray = typeof values === 'object' && Array.isArray(values);
  if (isArray) {
    return values.reduce(function (result, item, index) {
      result[index + 1] = item;
      return result;
    }, {});
  }

  return values;
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
function makeConfig (conf, values, callback) {
  var config = typeof conf === 'string' ? { text: conf } : conf;

  if (values) {
    if(typeof values === 'function') {
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
        callback(new Error('Using different types of placeholders in one query is restricted.'))
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
      var isArray = typeof hashValues[placeholderName] === 'object' && Array.isArray(hashValues[placeholderName]);
      if (!isArray) {
        hashValues[placeholderName] = [hashValues[placeholderName]];
      };

      // iterate array values and replace for numeric values
      hashValues[placeholderName].forEach(function(value) {
        outParams.push(value);
        placeholder += '$' + (i++) + ',';
      });
      // replace single to multiple placeholders = $1 -> $1,$2

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
  callback(null, { "text": resultSql, 'values': outParams });
};

var omniQuery = function (conf, values, callback, originalQuery, strict) {
  var config = makeConfig(conf, values, callback);

  if (config && config.text && config.text !== '' && typeof config.text === 'string') {
    if (config.values && config.values.length && config.values.length > 0) {
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
  } else { // prepared query
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
  if (strict === undefined) { strict = false };

  var pg = require('pg');
  var originalQuery = pg.Client.prototype.query;

  pg.Client.prototype.query = function (config, values, callback) {
    return omniQuery.call(this, config, values, callback, originalQuery, strict);
  };

  return pg;
};

module.exports = omni;
module.exports.omni = omni;

// lazy loading pg
module.exports.__defineGetter__('pg', function () {
  return module.exports.pg = pgOmni(false);
});
