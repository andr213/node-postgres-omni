const options = {
  DBNAME: 'DB_OMNI',
  user: 'postgres',
  password: 'password123',
  host: 'localhost',
  port: 5432,
  db: 'postgres'
};

console.log('DB BOOTSTRAP:');

const { Client } = require('pg');

const conString = `pg://${options.user}:${options.password}@${options.host}:${options.port}/${options.db}`;
const client = new Client(conString);

/**
 * Bootstrap async function
 */
const bootstrap = async () => {
  try {
    await client.connect();
  } catch (err) {
    if (err) throw err;
  }

  // create DB
  try {
    await client.query(`DROP DATABASE IF EXISTS ${options.DBNAME}`);
    await client.query(`CREATE DATABASE ${options.DBNAME}`);
    console.log('    - DB has created successfully');
  } catch (err) {
    if (err) throw err;
  }

  // create user
  try {
    await client.query('DROP USER IF EXISTS pythonello');
    await client.query('CREATE USER pythonello WITH LOGIN ENCRYPTED PASSWORD \'password123\'');
    console.log('    - User has created successfully');
  } catch (err) {
    if (err) throw err;
  }

  // create table
  try {
    await client.query('DROP TABLE IF EXISTS cities');
    await client.query('CREATE TABLE cities (id serial PRIMARY KEY, name VARCHAR(20) NOT NULL, country VARCHAR(20) NOT NULL, population int4 NOT NULL)');
    await client.query('INSERT INTO cities (id, name, country, population) values (1, \'New York\', \'USA\', 8000000)');
    await client.query('INSERT INTO cities (id, name, country, population) values (2, \'Washington\', \'USA\', 601000)');
    await client.query('INSERT INTO cities (id, name, country, population) values (3, \'TORONTO\', \'CANADA\', 2732000)');
    await client.query('INSERT INTO cities (id, name, country, population) values (4, \'OTTAWA\', \'CANADA\', 934240)');
    console.log('    - Table has created successfully');
  } catch (err) {
    if (err) throw err;
  }

  await client.end();
};

bootstrap();

