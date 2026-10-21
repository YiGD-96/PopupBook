import test from 'node:test';
import assert from 'node:assert/strict';
import {browserLanguage,countryLanguage,detectLanguage,useLocale} from '../src/locale.ts';

test('a country reads in Korean, Chinese or English',()=>{
 assert.equal(countryLanguage('KR'),'ko');assert.equal(countryLanguage('kr'),'ko');
 for(const code of ['CN','TW','HK','MO','SG'])assert.equal(countryLanguage(code),'zh');
 assert.equal(countryLanguage('US'),'en');assert.equal(countryLanguage('JP'),'en');
 assert.equal(countryLanguage(null),null);assert.equal(countryLanguage(''),null);
});
test('the browser language is the first guess',()=>{
 assert.equal(browserLanguage('ko-KR'),'ko');assert.equal(browserLanguage('zh-Hant-TW'),'zh');assert.equal(browserLanguage('en-US'),'en');assert.equal(browserLanguage('fr'),'en');
});
test('the country sets the language only while the reader has not chosen one',async()=>{
 useLocale.setState({lang:'ko',chosen:false,source:'browser'});
 await detectLanguage(async()=>'US');assert.equal(useLocale.getState().lang,'en');assert.equal(useLocale.getState().source,'ip');
 await detectLanguage(async()=>null);assert.equal(useLocale.getState().lang,'en','an unknown country changes nothing');
 useLocale.getState().choose('zh');
 await detectLanguage(async()=>'KR');assert.equal(useLocale.getState().lang,'zh','a chosen language is kept');
 assert.equal(useLocale.getState().source,'saved');
});
