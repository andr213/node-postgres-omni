import { transformConfig } from '../src';

describe('Transform config', () => {
  describe('Named placeholders', () => {
    it('scenario 1', () => {
      const sql = 'select name from cities where country = $country and population > $population';
      const params = { 'country': 'USA', 'population': 1000000 };

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country = $1 and population > $2",
        "values": ["USA", 1000000]
      });
    });

    it('scenario 2', () => {
      const sql = 'select name from cities where population > $population and country = $country';
      const params = { 'country': 'USA', 'population': 1000000 };

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country = $2",
        "values": [1000000, "USA"]
      });
    });

    it('scenario 3', () => {
      const sql = 'select name from cities where population > $population and country = $country';
      const params = { 'population': 1000000, 'country': 'USA' };

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country = $2",
        "values": [1000000, "USA"]
      });
    });

    it('scenario 4', () => {
      const sql = 'select name from cities where country in ($country)';
      const params = { 'country': ['USA', 'CANADA'] };

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country in ($1,$2)",
        "values": ["USA", "CANADA"]
      });
    });

    it('scenario 5', () => {
      const sql = 'select name from cities where country in ($country)';
      const params = { 'country': ['USA', 'CANADA', 'UKRAINE'] };

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country in ($1,$2,$3)",
        "values": ["USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 6', () => {
      const sql = 'select name from cities where population > $population and country in ($country)';
      const params = { 'population': 1000000, country: ['USA', 'CANADA', 'UKRAINE'] };

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country in ($2,$3,$4)",
        "values": [1000000, "USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 7', () => {
      const sql = 'select name from cities where population > $population and $population = 1000000';
      const params = { 'population': 1000000 };

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and $1 = 1000000",
        "values": [1000000]
      });
    });
  });

  describe('Numeric placeholders', () => {
    it('scenario 1', () => {
      const sql = 'select name from cities where country = $1 and population > $2';
      const params = ['USA',  1000000];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country = $1 and population > $2",
        "values": ["USA", 1000000]
      });
    });

    it('scenario 2', () => {
      const sql = 'select name from cities where country = $2 and population > $1';
      const params = [1000000, 'USA'];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country = $1 and population > $2",
        "values": ["USA", 1000000]
      });
    });

    it('scenario 3', () => {
      const sql = 'select name from cities where population > $1 and country = $2';
      const params = [1000000, 'USA'];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country = $2",
        "values": [1000000, "USA"]
      });
    });

    it('scenario 4', () => {
      const sql = 'select name from cities where country in ($1)';
      const params = [['USA', 'CANADA']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country in ($1,$2)",
        "values": ["USA", "CANADA"]
      });
    });

    it('scenario 5', () => {
      const sql = 'select name from cities where country in ($1)';
      const params = [['USA', 'CANADA', 'UKRAINE']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country in ($1,$2,$3)",
        "values": ["USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 6', () => {
      const sql = 'select name from cities where population > $1 and country in ($2)';
      const params = [1000000, ['USA', 'CANADA', 'UKRAINE']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country in ($2,$3,$4)",
        "values": [1000000, "USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 7', () => {
      const sql = 'select name from cities where population > $2 and country in ($1)';
      const params = [['USA', 'CANADA', 'UKRAINE'], 1000000];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country in ($2,$3,$4)",
        "values": [1000000, "USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 8', () => {
      const sql = 'select name from cities where population > $1 and $1 = 1000000';
      const params = [1000000];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and $1 = 1000000",
        "values": [1000000]
      });
    });
  });

  describe('Positional placeholders', () => {
    it('scenario 1', () => {
      const sql = 'select name from cities where country = $ and population > $';
      const params = ['USA',  1000000];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country = $1 and population > $2",
        "values": ["USA", 1000000]
      });
    });

    it('scenario 2', () => {
      const sql = 'select name from cities where country in ($)';
      const params = [['USA', 'CANADA']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country in ($1,$2)",
        "values": ["USA", "CANADA"]
      });
    });

    it('scenario 3', () => {
      const sql = 'select name from cities where country in ($)';
      const params = [['USA', 'CANADA', 'UKRAINE']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where country in ($1,$2,$3)",
        "values": ["USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 4', () => {
      const sql = 'select name from cities where population > $ and country in ($)';
      const params = [1000000, ['USA', 'CANADA', 'UKRAINE']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country in ($2,$3,$4)",
        "values": [1000000, "USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 5', () => {
      const sql = 'select name from cities where population > $ and country in ($)';
      const params = [1000000, ['USA', 'CANADA', 'UKRAINE']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country in ($2,$3,$4)",
        "values": [1000000, "USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 6 [ERROR]', () => {
      const sql = 'select name from cities where population > $ and country in ($)';
      const params = [['USA', 'CANADA', 'UKRAINE'], 1000000];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).not.toBeCalledWith(null, {
        "text": "select name from cities where population > $1 and country in ($2,$3,$4)",
        "values": [1000000, "USA", "CANADA", "UKRAINE"]
      });
    });

    it('scenario 7', () => {
      const sql = 'select name from cities where country in ($) and population > $ ';
      const params = [1000000, ['USA', 'CANADA', 'UKRAINE']];

      const callback = jest.fn();
      transformConfig(sql, params, callback, false);

      expect(callback).not.toBeCalledWith(null, {
        "text": "select name from cities where country in ($2,$3,$4) and population > $1",
        "values": [1000000, "USA", "CANADA", "UKRAINE"]
      });
    });
  });
});
