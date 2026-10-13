import sharp from 'sharp';
for (const size of [180,192,512]) await sharp('public/icons/gia.svg').resize(size,size).png().toFile(`public/icons/gia-${size}.png`);
await sharp('public/icons/gia.svg').resize(384,384).extend({top:64,bottom:64,left:64,right:64,background:'#0b4b2c'}).png().toFile('public/icons/gia-maskable.png');
