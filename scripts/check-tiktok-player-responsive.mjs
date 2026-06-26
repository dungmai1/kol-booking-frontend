import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePath = resolve('components/tiktok-portfolio-player.tsx');
const source = readFileSync(sourcePath, 'utf8');

const expectations = [
  {
    description: 'DialogContent is capped to the small-screen viewport height',
    pass: source.includes('max-h-[calc(100dvh-2rem)]'),
  },
  {
    description: 'DialogContent uses a flex column layout so the iframe can shrink',
    pass: /DialogContent[\s\S]*className="[^"]*\bflex\b[^"]*\bflex-col\b/.test(source),
  },
  {
    description: 'The iframe fills the remaining dialog space instead of using a fixed height',
    pass: /<iframe[\s\S]*className="[^"]*\bmin-h-0\b[^"]*\bflex-1\b/.test(source),
  },
  {
    description: 'The old fixed 740px iframe height is not present',
    pass: !source.includes("height: '740px'"),
  },
];

const failures = expectations.filter((expectation) => !expectation.pass);

if (failures.length > 0) {
  console.error('TikTok player responsive regression check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.description}`);
  }
  process.exit(1);
}

console.log('TikTok player responsive regression check passed.');
