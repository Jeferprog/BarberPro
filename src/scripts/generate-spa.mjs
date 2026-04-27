import fs from 'fs';
import path from 'path';

const assetsDir = path.join('dist', 'client', 'assets');
const clientDir = path.join('dist', 'client');
const files = fs.readdirSync(assetsDir);

const css = files.find(f => /^styles-.*\.css$/.test(f));
const bundles = files.filter(f => /^index-.*\.js$/.test(f));
const mainBundle = bundles.sort((a, b) => 
  fs.statSync(path.join(assetsDir, b)).size - fs.statSync(path.join(assetsDir, a)).size
)[0];

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BarberPro</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/${css}" />
  <script>
    window.__TSR__ = { matches: [], injectedHtml: [] };
  </script>
</head>
<body>
  <script type="module" src="/assets/${mainBundle}"></script>
</body>
</html>`;

fs.writeFileSync(path.join(clientDir, 'index.html'), html);

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) return response;
    } catch(e) {}
    const indexRequest = new Request(new URL('/index.html', request.url), request);
    return env.ASSETS.fetch(indexRequest);
  }
};`;

fs.writeFileSync(path.join(clientDir, '_worker.js'), worker);
fs.rmSync(path.join(clientDir, '.assetsignore'), { force: true });

const wrangler = JSON.stringify({
  name: "barber-shine-hub",
  compatibility_date: "2025-09-24",
  compatibility_flags: ["nodejs_compat"]
});
fs.writeFileSync(path.join(clientDir, 'wrangler.json'), wrangler);

console.log('SPA gerado:', { css, mainBundle });