/* Függőségmentes ZIP-készítő. Futtatás: npm run package */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = ['index.html', 'styles.css', 'js/core.js', 'js/app.js', 'assets/favicon.svg', 'assets/logo.svg', 'README.md', 'package.json', 'scripts/package.cjs', 'tests/core.test.cjs'];
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const entries = [], directory = [];
let offset = 0;
for (const file of files) {
  const name = Buffer.from('bitfarago-online/' + file, 'utf8');
  const content = fs.readFileSync(path.join(root, file));
  const crc = crc32(content);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0x0021, 12); // 1980-01-01: reprodukálható archívum.
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(content.length, 18);
  header.writeUInt32LE(content.length, 22);
  header.writeUInt16LE(name.length, 26);
  entries.push(header, name, content);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(0x0021, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(content.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  directory.push(central, name);
  offset += header.length + name.length + content.length;
}
const directoryBytes = Buffer.concat(directory);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directoryBytes.length, 12);
end.writeUInt32LE(offset, 16);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const destination = path.join(root, 'dist/bitfarago-online.zip');
fs.writeFileSync(destination, Buffer.concat([...entries, directoryBytes, end]));
console.log(destination);
