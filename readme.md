## pg-omni-placeholders

Support of named, positional and simple placeholders when working with [node-postgres](https://github.com/brianc/node-postgres).
And ability to use all of them as a multi placeholders (inside IN and VALUES operators).

    // named placeholders
    client.query(
        'select name from cities where country = $country and population > $population',
        { country: 'USA', population: 1000000 },
        function (error, results) { console.log(results) }
    );

    // positional placeholders
    client.query(
        'select name from cities where country = $1 and population > $2',
        ['USA', 1000000],
        function (error, results) { console.log(results) };
    });
    
    // simple placeholders
    client.query(
        'select name from cities where country = $ and population > $',
        ['USA', 1000000],
        function (error, results) { console.log(results) };
    });

    // named multi placeholders
    client.query(
        'select name from cities where country in ($country)',
        {'country': ['USA, CANADA']},
        function (error, results) { console.log(results) };
    });
    
### Descripton

PostgreSQL doesn't support named parameters. It only supports positional parameters ($1, $2, ...). Though you can reference the same parameter more than once.

```
SELECT * FROM persons WHERE lastname = $1 AND firstname = $1
```

That is why npm [node-postgres](https://github.com/brianc/node-postgres) support only positional placeholders.

The pg-omni module extend this behaviour of [node-postgres](https://github.com/brianc/node-postgres), and provide abilities to use all types of placeholders. Only one restriction exists - you can not mix types in one SQL query.

Any types of placeholders module converts to standard positional placeholders and pass it to process to [node-postgres](https://github.com/brianc/node-postgres).

### Support

* Named placeholders
* Positional placeholders
* Simple placeholders
* Multi placeholders

### Installing from GitHub

    npm install git://github.com/andr213/node-postgres-omni.git

### Using

First approach is to patch existing Client

    var pg = require("pg");
    var conString = "pg://dbuser:dbpassword@localhost:5432/dbname";
    
    var pgOmni = require('pg-omni');
    var client = new pg.Client(conString);
    pgOmni.omni(client); // or just pgOmni(client);

    // connect to the DB
    client.connect();
        
    // make a query
    pgOmni.query(...);

    ...
    client.end();
    
Second approach is to get already patched pg object

    var conString = "pg://dbuser:dbpassword@localhost:5432/dbname";

    var pgOmni = require('pg-omni').pg;
    var client = new pgOmni.Client(conString);

    // connect to the DB
    client.connect();
    
    // make a query
    client.query(...);
    
    ...
    client.end();

## Placeholders
Placeholder - variable in the sql query that will be replaced with the corresponding value when processing by the DBMS.

* Placeholders starts from $ symbol
* Does not support mixing different types of placeholders in one query
* Placeholders can be used in both SELECT and UPDATE, INSERT queries.


### Named placeholders
Placeholders whose binding to values ​​occurs by their unique name.
* all Latin letters, numbers and underscores are allowed
* must begin only with a letter (for example, $city, $city1, $city_1)

    client.query(
        'select name from cities where country = $country and population > $population',
        { country: 'USA', population: 1000000 },
        function (error, results) { console.log(results) }
    );
    
    
* bind variables must be passed as an object
* the order is not important (binding occurs by a unique name)
* any placeholder can be repeated in the sql query as many times as necessary
* unique placeholders in the sql query must be no less than in the bind variables
    
*Note. The most convenient, visible and scalable placeholders*

### Positional plcaceholders

Placeholders, the binding of which to values ​​occurs by their order number (the index of the sequence in the array of the variables to be related).

These placeholders are processed directly by the node-postgres module, unless they are used as multiple placeholders (see Multiple placeholders).

    client.query(
        'select name from cities where population > $2 and country = $1',
        ['USA', 1000000],
        function (error, results) { console.log(results) }
    );
    
* bind variables must be passed as an array
* the order is not important (binding occurs by order number)
* any placeholder can be repeated in the sql query as many times as necessary

### Simple placeholders

Placeholders, the binding of which with the values ​​occurs in their order.

    client.query(
        'select name from cities where country = $ and population > $',
        ['USA', 1000000],
        function (error, results) { console.log(results) }
    );

* bind variables must be passed as an array
* the number of placeholders in the request must strictly coincide with the number of variables to be bound
* the order of the placeholders must strictly follow the order of the variables being related


### Multi placeholders

Any of the three types of placeholders can be used as multiple placeholders. They are used in cases where their number is not known in advance. For example, inside the IN operator. 

Multiple placeholders are associated with variables using an array.

    // with named placeholders
    client.query(
        'select name from cities where country in ($country) and population > $population',
        { country: ['USA, CANADA'], population: 1000000 },
        function (error, results) { console.log(results) }
    );
    
    // with simple placeholders
    client.query(
        'select name from cities where country in ($) and population > $',
        [['USA, CANADA'], 1000000],
        function (error, results) { console.log(results) }
    );
    
    // with positional placeholders
    client.query(
        'select name from cities where country in ($1) and population > $2',
        [['USA, CANADA'], 1000000],
        function (error, results) { console.log(results) }
    );

It is especially convenient to use them in INSERT statements, for example, along with the use in the usual form:

    // with named placeholders
    client.query(
        'insert into cities (name, country, population) values ($name, $country, $population)',
        { name: 'New York, country: 'USA', population: 8000000},
        function (error, results) { console.log(results) }
    );
    
you can use:

    // with multiple named placeholders
    client.query(
        'insert into cities (name, country, population) values ($values)',
        { values: ['New York, 'USA', 8000000] },
        function (error, results) { console.log(results) }
    );
    
    or
    
    // with multiple positional placeholders
    client.query(
        'insert into cities (name, country, population) values ($1)',
        [['New York, 'USA', 8000000]],
        function (error, results) { console.log(results) }
    );
    
    and so on
    
### Default type of placholders
The type of placeholders is determined automatically.

### Dependencies
[pg](https://www.npmjs.com/package/pg)

### License
Copyright (c) 2015 Andrey Yanov (andr213@gmail.com)

[See the LICENSE for details.](https://github.com/andr213/node-postgres-omni/blob/master/license.md)

### Similar modules

* [pg-spice](https://github.com/sehrope/node-pg-spice)
* [node-postgres-named](https://github.com/bwestergard/node-postgres-named)
* [pg-db](https://github.com/sehrope/node-pg-db)


### Keywords
*postgre, postgres, postgresql, placeholders, named, position, positional, numeric, numbered, mupltiple, node, nodejs, node-postgres, js*

