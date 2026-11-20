const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(`${__dirname}/spa.js`, 'utf8'), context);
test('static routes use the SPA and named assets keep their URI', () => {
  for (const uri of ['/', '/about', '/sample', '/product/']) {
    assert.equal(context.handler({ request: { uri } }).uri, '/index.html');
  }
  for (const uri of ['/assets/app-abc.js', '/favicon.svg']) {
    assert.equal(context.handler({ request: { uri } }).uri, uri);
  }
});
