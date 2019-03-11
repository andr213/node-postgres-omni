
const options = {
  DBNAME: 'DB_OMNI',
  user: 'postgres',
  password: 'password123',
  host: 'localhost',
  port: 5432,
  db: 'postgres'
};
console.log('');
console.log('EXAMPLES:');

const conString = `pg://${options.user}:${options.password}@${options.host}:${options.port}/${options.db}`;

const pgOmni = require('../src').pg;
const client = new pgOmni.Client(conString);


const examples = async () => {
  await client.connect();

  try {
    // named placeholders
    const named = await client.query(
      'select name from cities where country = $country and population > $population',
      { 'country': 'USA', 'population': 1000000 }
    );
    console.log('    Named               => ', named.rows);

    // numeric placeholders
    const numeric = await client.query(
      'select name from cities where country = $1 and population > $2',
      ['USA', 1000000]
    );
    console.log('    Numeric             => ', numeric.rows);

    // positional placeholders
    const positional = await client.query(
      'select name from cities where country = $ and population > $',
      ['USA', 1000000],
    );
    console.log('    Positional          => ', positional.rows);

    // multiple named
    const multiNamed = await client.query(
      'select name from cities where country in ($country) and population > $population',
      {'country': ['USA', 'CANADA'], 'population': 1000000}
    );
    console.log('    Multiple Named      => ', multiNamed.rows);

    // multiple numeric
    const multiNumeric = await client.query(
      'select name from cities where country in ($1) and population > $2',
      [['USA', 'CANADA'], 1000000]
    );
    console.log('    Multiple Numeric    => ', multiNumeric.rows);

    // multiple positional
    const multiPositional = await client.query(
      'select name from cities where country in ($) and population > $',
      [['USA', 'CANADA'], 1000000],
    );
    console.log('    Multiple Positional => ', multiPositional.rows);


  } catch(e) {
    console.log('ERROR', res.rows);
  }

  await client.end();
  return true;
};


examples();
