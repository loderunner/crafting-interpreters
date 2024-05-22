import fs from 'node:fs/promises';

const msg: string = 'Hello World!';

console.log(msg);

const f = await fs.open('/dev/random');
const randomData = await f.read({ length: 64 });
console.log(randomData.buffer.toString('base64', 0, randomData.bytesRead));
