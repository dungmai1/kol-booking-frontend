const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function requireTsModule(relativePath) {
  const fullPath = path.join(__dirname, '..', relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const mod = { exports: {} };
  const fn = new Function('require', 'module', 'exports', output);
  fn(require, mod, mod.exports);
  return mod.exports;
}

const productsMeta = requireTsModule('lib/products/meta.ts');
const bookingStatus = requireTsModule('lib/bookings/status.ts');

assert.equal(
  productsMeta.isProductDeadlineExpired('2026-06-27', new Date('2026-06-28T00:00:00+07:00')),
  true,
  'past product deadlines must be expired',
);
assert.equal(
  productsMeta.isProductDeadlineExpired('2026-06-28', new Date('2026-06-28T10:00:00+07:00')),
  false,
  'products should still accept applications through the deadline date',
);
assert.equal(
  productsMeta.daysUntil('2026-06-28', new Date('2026-06-28T10:00:00+07:00')),
  0,
  'date-only deadlines should be counted in local calendar days',
);
assert.equal(
  productsMeta.daysUntil('2026-02-31', new Date('2026-02-28T10:00:00+07:00')),
  null,
  'invalid date-only deadlines should not roll over to another date',
);
assert.equal(
  productsMeta.isProductAcceptingApplications({
    status: 'OPEN',
    deadline: '2026-06-27',
  }, new Date('2026-06-28T00:00:00+07:00')),
  false,
  'OPEN products past deadline must not accept applications',
);
assert.equal(
  productsMeta.isProductAcceptingApplications({
    status: 'OPEN',
    deadline: null,
  }, new Date('2026-06-28T00:00:00+07:00')),
  true,
  'OPEN products without deadline should accept applications',
);

assert.equal(bookingStatus.canBrandCancelBooking('PENDING'), true);
assert.equal(bookingStatus.canBrandCancelBooking('ACCEPTED'), true);
assert.equal(bookingStatus.canBrandCancelBooking('IN_PROGRESS'), false);

console.log('business rules ok');
