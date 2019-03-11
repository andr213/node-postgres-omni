/**
 *
 * @author andr213@gmail.com
 */

const TYPES = {
  POS: 'positional',
  NAME: 'named',
  NUM: 'numeric'
};


// transform array values into numbered hash
function transformValues(values) {
  const isArray = typeof values === 'object' && Array.isArray(values);

  if (!isArray) return values;

  return values.reduce((accum, item, index) => {
    accum[index + 1] = item;

    return accum;
  }, {});
}

// figure out placeholder type
function getPlaceholderType(placeholder) {
  if (placeholderType) {
    return placeholderType;
  }

  if (placeholder.match(/^\$\d+\b$/)) {
    return TYPES.NUM;
  } else if (placeholder.match(/^\$[a-z][\w|\d]*\b$/)) {
    return TYPES.NAME;
  } else if (placeholder.match(/^\$$/)) {
    return TYPES.POS;
  } else {
    throw new Error('Unknown placeholder type');
  }
}

// transform string type params into object config style
function makeConfig(conf, values, callback) {
  const config = typeof conf === 'string'
    ? { text: conf }
    : conf;

  if (values) {
    if (typeof values === 'function') {
      config.callback = values;
    } else {
      config.values = values;
    }
  }

  if (callback) {
    config.callback = callback;
  }

  return config;
}

// Transform config to original numeric placeholders
function transformConfig (sql, values, callback, strict) {

  const pattern = /(\$\d+\b)|(\$[a-z][\w|\d]*\b)|(\${1})/gmi;

  // out params
  const outParams = [];

  // hash of placeholders
  const hashParams = {};

  let last = 0, // lastIndex
    resultSql = '',
    i = 1, // placeholder number
    num = 1,
    placeholderType = '',
    find;

  const hashValues = transformValues(values);

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
    }

    // hash placeholder name
    const placeholderName = find[0].substring(1) + (find[0] === '$' ? num++ : '');

    // variable for multiple placeholders
    let placeholder = '';

    if (!hashParams.hasOwnProperty(placeholderName)) {
      // check if values does not include value
      if (!hashValues.hasOwnProperty(placeholderName)) {
        // Error if strict mode
        if (strict) {
          callback(new Error('Sql placeholders does not match with values'));
        }
      }

      // transform single value to array
      const isArray = typeof hashValues[placeholderName] === 'object' && Array.isArray(hashValues[placeholderName]);
      if (!isArray) {
        hashValues[placeholderName] = [hashValues[placeholderName]];
      }

      // iterate array values and replace for numeric values
      hashValues[placeholderName].forEach(function(value) {
        outParams.push(value);
        placeholder += '$' + (i++) + ',';
      });
      // replace single to multiple placeholders = $1 -> $1,$2
      hashParams[placeholderName] = placeholder.substring(0, placeholder.length - 1);
    }

    // add sql with placeholder
    resultSql += sql.slice(last, find.index) + hashParams[placeholderName];

    // remember placeholder end index
    last = pattern.lastIndex;
  }

  // add the rest of query sql
  resultSql += sql.slice(last, sql.length);


  // return values
  callback(null, { text: resultSql, values: outParams });
}

const omniQuery = function (conf, values, callback, originalQuery, strict) {
  const config = makeConfig(conf, values, callback);

  if (config && config.text && config.text !== '' && typeof config.text === 'string') {
    if (config && config.values && Object.keys(config.values).length > 0) {
      transformConfig(config.text, config.values, function (error, result) {
        if (error) {
          if (callback) {
            callback(error);
          } else {
            throw error;
          }
        }
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
    callback(new Error('Prepared query does not support'));
  }
};

// patching query inside instance of client object
function omni(client, strict = false) {
  // Save original query
  let originalQuery = client.query;

  // return in case overridden already
  if (originalQuery.omni) return client;

  originalQuery = originalQuery.bind(client);

  // Override original query
  client.query = function (config, values, callback) {
    return omniQuery.call(this, config, values, callback, originalQuery, strict);
  };

  // omni Flag to inform that overridden
  client.query.omni = true;

  return client;
}

// return new original pg object with patched prototype query
function pgOmni(strict = false) {
  const pg = require('pg');
  const originalQuery = pg.Client.prototype.query;

  pg.Client.prototype.query = function (config, values, callback) {
    return omniQuery.call(this, config, values, callback, originalQuery, strict);
  };

  return pg;
}

// predefined placeholder type. undefined value equal auto detection
let placeholderType;

// predefine placeholder type. by default is auto
function setType(type) {
  const isCorrectType = [TYPES.POS, TYPES.NAME, TYPES.NUM].some(item => item === type);

  if (isCorrectType) {
    placeholderType = type;
  } else {
    // set to default (auto)
    placeholderType = undefined;
  }
}

module.exports = omni;
module.exports.omni = omni;
module.exports.TYPES = TYPES;
module.exports.setType = setType;

// for testing only
module.exports.transformValues = transformValues;

// lazy loading pg
module.exports.__defineGetter__('pg', function () {
  return module.exports.pg = pgOmni(false);
});
