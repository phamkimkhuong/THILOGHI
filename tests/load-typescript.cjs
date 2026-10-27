/* eslint-disable @typescript-eslint/no-require-imports */
// Node 20 test adapter: compile the actual TypeScript modules and inject only IO boundaries.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

module.exports = function createLoader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(root, file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiledModule = { exports: {} };
    cache.set(filename, compiledModule);
    const nativeRequire = createRequire(filename);
    const requireModule = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(filename), name);
        const target = [base, `${base}.ts`, path.join(base, 'index.ts')].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (target?.endsWith('.ts')) return load(target);
      }
      return nativeRequire(name);
    };
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, { filename })(requireModule, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return load;
};
