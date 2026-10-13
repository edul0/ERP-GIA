import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
test('app instalável possui ícones locais e limita cache a arquivos públicos',()=>{
 const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
 assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons) assert.ok(existsSync('public'+icon.src));
 const sw=readFileSync('public/sw.js','utf8');
 const paths=sw.match(/const PUBLIC_FILES=(\[[^;]+\])/)!;
 const cached=JSON.parse(paths[1].replaceAll("'",'"')) as string[];
 assert.ok(cached.every(path=>path.startsWith('/icons/')||['/offline.html','/offline.js'].includes(path)));
 assert.ok(!cached.includes('/'));
 assert.match(sw,/url\.origin!==self\.location\.origin/);
});
