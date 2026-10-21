import test from 'node:test';
import assert from 'node:assert/strict';
import { scenes } from '../src/story.ts';
import { details } from '../src/details.ts';
import { FAQ, chapterStories, headTags, jsonLd, llmsTxt, sitemapXml, textVersion } from '../src/seo.ts';
import { locationHash, parseHash } from '../src/analytics.ts';

test('every spread and story has a shareable hash that leads back to it',()=>{
 scenes.forEach((scene,chapter)=>{
  assert.deepEqual(parseHash(locationHash(chapter,null,false)),{chapter,detail:null,ending:false});
  for(const id of chapterStories[chapter])assert.deepEqual(parseHash(locationHash(chapter,id,false)),{chapter,detail:id,ending:false});
 });
 assert.equal(parseHash(locationHash(0,null,true)).ending,true);
 assert.deepEqual(parseHash('#nowhere/nothing'),{chapter:null,detail:null,ending:false});
});
test('the text version carries every chapter, every story and the FAQ for crawlers that do not run scripts',()=>{
 const html=textVersion();
 for(const scene of scenes)assert.ok(html.includes(scene.title));
 for(const ids of chapterStories)for(const id of ids)assert.ok(html.includes(`id="text-${id}"`),id);
 assert.equal(chapterStories.flat().length,new Set(chapterStories.flat()).size);
 for(const item of FAQ){assert.ok(item.answer.length>20);assert.ok(html.includes(item.question));}
 assert.ok(html.startsWith('<section id="book-text"')&&html.includes(' hidden>'));
});
test('structured data describes the recipes completely and the FAQ as questions with answers',()=>{
 const graph=jsonLd('https://example.com')['@graph'];
 const recipes=graph.filter(node=>node['@type']==='Recipe');assert.equal(recipes.length,4);
 for(const r of recipes){assert.ok(r.recipeIngredient.length>=4);assert.ok(r.recipeInstructions.length>=3);assert.match(r.totalTime,/^P(1D)?T\d+M$/);assert.match(r.image[0],/^https:\/\/example\.com\/art-raster\//);}
 assert.equal(graph.find(node=>node['@type']==='FAQPage').mainEntity.length,FAQ.length);
 assert.equal(graph.find(node=>node['@type']==='CreativeWork'&&node.hasPart).hasPart.length,scenes.length);
 assert.ok(JSON.stringify(graph).length>2000);
});
test('canonical and absolute URLs appear only when the site address is known',()=>{
 assert.ok(!headTags().includes('rel="canonical"'));
 const tags=headTags('https://example.com');assert.ok(tags.includes('<link rel="canonical" href="https://example.com/"/>'));assert.ok(tags.includes('og:image" content="https://example.com/media/og-image.jpg"'));
 assert.ok(!/<\/script>[\s\S]*<\/script>/.test(tags.split('application/ld+json')[1].slice(0,-9)),'JSON-LD cannot close its script early');
 assert.ok(sitemapXml('https://example.com','2026-10-17').includes('<loc>https://example.com/</loc>'));
 const llms=llmsTxt('https://example.com');for(const id of ['recipe-01','harvest'])assert.ok(llms.includes(details[id].title));
});
