## pg-omni

Поддержка именованных, нумерованных и позиционных заполнителей при работе с [node-postgres](https://github.com/brianc/node-postgres). Возможность также использовать любые из них в качестве множественных заполнителей.

    // именованные заполнители
    client.query(
        'select name from cities where country = $country and population > $population',
        {'country': 'USA', 'population': 1000000},
        function (error, results) { console.log(results) };
    });
    
    // позиционные заполнители
    client.query(
        'select name from cities where country = $ and population > $',
        ['USA', 1000000],
        function (error, results) { console.log(results) };
    });
    
    // именованные множественные заполнители
    client.query(
        'select name from cities where country in ($country)',
        {'country': ['USA, CANADA']},
        function (error, results) { console.log(results) };
    });
    
### Описание

PostgreSQL изначально поддерживает только нумерованные заполнители, поэтому модуль [node-postgres](https://github.com/brianc/node-postgres) тоже использует только их, чтобы максимально придерживаться спецификации СУБД.

Модуль pg-omni расширяет возможности [node-postgres](https://github.com/brianc/node-postgres), позволяя работать с тремя основными типами заполнителей. Их можно чередовать или использовать только один тип. Единственное ограничение - их нельзя смешивать в одном запросе.

Любые заполнители, которые вы используете, модуль преобразовывает в стандартные нумерованные заполнители и передает их на обработку в [node-postgres](https://github.com/brianc/node-postgres).

### Возможности

* Именованные заполнители
* Позиционные заполнители
* Нумерованные заполнители
* Множественные заполнители

### Установка

    npm install git://github.com/andr213/node-postgres-omni.git

### Использование

Первый способ: пропатчить уже существующий Client

    var pg = require("pg");
    var conString = "pg://dbuser:dbpassword@localhost:5432/dbname";
    
    var pgOmni = require('pg-omni');
    var client = new pg.Client(conString);
    pgOmni.omni(client); // или просто pgOmni(client);
    
    pgOmni.query(...);

Второй способ: получить уже пропатченый объект pg

    var conString = "pg://dbuser:dbpassword@localhost:5432/dbname";

    var pgOmni = require('pg-omni').pg;
    var client = new pgOmni.Client(conString);
    
    pgOmni.query(...);

## Заполнители
Заполнитель - переменная в sql-запросе, которая при обработке СУБД будет заменена соотвествующим ей значением.

Заполнитель начинается со специального символа "$".

Нельзя смешивать разные типы заполнителей в одном запросе.

Заполнители могут использоваться как в SELECT так и в UPDATE, INSERT запросах.

### Именованные заполнители

Заполнители, связывание которых со значениями происходит по их уникальному имени. Допускаются все буквы латинского алфавита, цифры и подчеркиания. Начинаться должны только с буквы (например, $city, $city1, $city_1).

    
    client.query(
        'select name from cities where country = $country and population > $population',
        {'country': 'USA', 'population': 1000000},
        function (error, results) { console.log(results) };
    });
    
    
* связываемые переменные должны передаваться в виде объекта
* порядок следования не важен (связывание происходит по уникальному имени)
* любой заполнитель может повторяться в sql-запросе сколько угодно раз
* уникальных заполнителей в sql-запросе должно быть не меньше чем в связываемых переменных
    
*Примечание. Наиболее удобные, наглядные и масштабируемые заполнители*

### Позиционные заполнители

Заполнители, связывание которых со значениями происходит по их порядку следования.

    client.query(
        'select name from cities where country = $ and population > $',
        ['USA', 1000000],
        function (error, results) { console.log(results) };
    });
    
* связываемые переменные должны передаваться в виде массива
* количество заполнителей в запросе должно строго совпадать с количеством связываемых переменных
* порядок заполнителей должен строго соответствовать порядку следования связываемых переменных

### Нумерованные заполнители

Заполнители, связывание которых со значениями происходит по номеру (индексу следования в массиве связываемых переменных). 

Эти заполнители обрабатываются напрямую модулем node-postgres, за исключением случая, когда они используются в качестве множественных заполнителей (см. Множественные заполнители)

    client.query(
        'select name from cities where country = $1 and population > $2',
        ['USA', 1000000],
        function (error, results) { console.log(results) };
    });
    
* связываемые переменные должны передаваться в виде массива
* порядок следования в sql-запросе не важен
* любой заполнитель может повторяться в sql-запросе сколько угодно раз

### Множественные заполнители
Любой из трех типов заполнителей может использоваться в качестве множественного заполнителя. Используются они в тех случаях, когда заранее неизвестно их количество. Например, внутри оператора IN. 

Множественные заполнители связываются с переменными с помощью массива.

    // с именованными заполнителями
    client.query(
        'select name from cities where country in ($country) and population > $population',
        {'country': ['USA, CANADA'], 'population': 1000000},
        function (error, results) { console.log(results) };
    });
    
    // с позиционными заполнителями
    client.query(
        'select name from cities where country in ($) and population > $',
        [['USA, CANADA'], 1000000],
        function (error, results) { console.log(results) };
    });
    
    // с нумерованными заполнителями
    client.query(
        'select name from cities where country in ($1) and population > $2',
        [['USA, CANADA'], 1000000],
        function (error, results) { console.log(results) };
    });

Особенно удобно использовать их в операторах INSERT, например, наряду с использованием в обычном виде:

    // с помощью именных заполнителей
    client.query(
        'insert into cities (name, country, population) values ($name, $country, $population)',
        {'name': 'New York, 'country': 'USA', 'population': 8000000},
        function (error, results) { console.log(results) };
    });
    
вы можете использовать еще и:

    // с помощью именных множественных заполнителей
    client.query(
        'insert into cities (name, country, population) values ($values)',
        {'values': ['New York, 'USA', 8000000]},
        function (error, results) { console.log(results) };
    });
    
    или
    
    // с помощью нумерованных множественных заполнителей
    client.query(
        'insert into cities (name, country, population) values ($1)',
        [['New York, 'USA', 8000000]],
        function (error, results) { console.log(results) };
    });
    
    и т.д.
    
### Зависимости
    [lodash](https://www.npmjs.com/package/lodash)
    [pg](https://www.npmjs.com/package/pg)

### Лицензия
Copyright (c) 2015 Andrey Yanov (andr213@gmail.com)

[See the LICENSE for details.](https://github.com/andr213/node-postgres-omni/blob/master/license.md)

### Похожие модули NODE

* [pg-spice](https://github.com/sehrope/node-pg-spice)
* [node-postgres-named](https://github.com/bwestergard/node-postgres-named)
* [pg-db](https://github.com/sehrope/node-pg-db)

### Похожие модули PERL
* [DBIx-Simple-Named](https://github.com/andr213/DBIx-Simple-Named)
 
### Ключевые слова
*postgre, postgres, postgresql, placeholders, named, position, positional, numeric, numbered, mupltiple, node, nodejs, js*

*посгрес, плейсхолдеры, заполнители, именованные, именные, позиционные, нумерованные, порядковые, нода, ноде, жаваскрипт, джаваскрипт*

