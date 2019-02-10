import test from 'ava';

// components
// import App from './app';
import { transformValues } from '../lib';

test('Array should be transferred to hash', t => {
  t.deepEqual(
    transformValues(['param1', 'param2', 'param3']),
    { 1: 'param1', 2: 'param2', 3: 'param3' }
  );

});

test('single params should be returned back', t => {
  t.is(transformValues('param1'), 'param1');
});
