import test from 'node:test';
import assert from 'node:assert/strict';
import {useLocale} from '../src/locale.ts';

test('Korean until the reader chooses another language; a choice is kept',()=>{
 assert.equal(useLocale.getState().lang,'ko');assert.equal(useLocale.getState().chosen,false);
 useLocale.getState().choose('zh');assert.equal(useLocale.getState().lang,'zh');assert.equal(useLocale.getState().chosen,true);
 useLocale.getState().choose('ko');assert.equal(useLocale.getState().lang,'ko');
});
