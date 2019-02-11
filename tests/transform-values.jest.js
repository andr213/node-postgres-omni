import { transformValues } from '../src';

describe('Transform values', () => {
  it('Array should be transferred to hash', () => {
    expect(transformValues(['param1', 'param2', 'param3']))
      .toEqual({ 1: 'param1', 2: 'param2', 3: 'param3' });
  });

  it('single params should be returned back', () => {
    expect(transformValues('param1'))
      .toEqual('param1');
  });
});
