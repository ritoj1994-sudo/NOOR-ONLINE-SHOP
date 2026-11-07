import { readFile, writeFile } from "node:fs/promises";

const file = "dist/index.html";
let html = await readFile(file, "utf8");

const additions = [
  '<link rel="manifest" href="/NOOR-ONLINE-SHOP/manifest.webmanifest">',
  '<meta name="theme-color" content="#123b2b">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="NOOR SHOP">',
  '<link rel="icon" href="/NOOR-ONLINE-SHOP/noor-icon.svg" type="image/svg+xml">'
].join("\n");

if (!html.includes('rel="manifest"')) {
  html = html.replace("</head>", additions + "\n</head>");
}
const registration = `<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/NOOR-ONLINE-SHOP/sw.js", { scope: "/NOOR-ONLINE-SHOP/" })
      .catch(function (error) { console.warn("NOOR offline setup:", error); });
  });
}
</script>`;
if (!html.includes('navigator.serviceWorker.register')) {
  html = html.replace("</body>", registration + "\n</body>");
}
await writeFile(file, html);
console.log("PWA manifest and service worker registration added to dist/index.html");
