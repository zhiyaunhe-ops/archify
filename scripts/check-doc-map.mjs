#!/usr/bin/env node
// Scope: Archify's new reading map and its canonical entrypoints.
// Existing generated, translated and published docs have independent tooling.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const map=read('docs/reading-map.md');
const errors=[];
for(const file of ['README.md','AGENTS.md','CONTRIBUTING.md']){
  if(!read(file).includes('(docs/reading-map.md)'))errors.push(file+': missing reading map entry');
}
function slug(s){return s.toLowerCase().replace(/<[^>]*>/g,'').replace(/[^\p{L}\p{N}\p{M}\p{Pc}\s-]/gu,'').trim().replace(/\s/g,'-')}
for(const found of map.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
  const url=found[1];
  if(/^(https?:|mailto:|#|\/\/)/.test(url))continue;
  let decoded;
  try {decoded=decodeURIComponent(url)} catch {errors.push('Bad link encoding: '+url);continue}
  const [file,hash]=decoded.split('#',2);
  const target=path.resolve(root,'docs',file);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)){errors.push('Missing file: '+url);continue}
  if(hash&&target.endsWith('.md')){
    const dest=fs.readFileSync(target,'utf8');
    const anchorSet=new Set([...dest.matchAll(/^#{1,6}\s+(.+)$/gm)].map(x=>slug(x[1])));
    if(!anchorSet.has(hash))errors.push('Missing anchor: '+url);
  }
}
const core=['archify/SKILL.md','archify/references/authoring-defaults.md','archify/references/authoring-contract.md','archify/references/delivery-contract.md','archify/references/repository-authoring.md','CONTRIBUTING.md','REVIEWING.md'];
for(const file of core)if(!map.includes('('+path.posix.relative('docs',file)+')'))errors.push('Core reference unindexed: '+file);
if(errors.length){errors.forEach(e=>console.error('ERROR '+e));process.exitCode=1}
else console.log('Documentation reading map OK: entrypoints, links, anchors and core references');
