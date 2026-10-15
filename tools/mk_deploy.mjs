import fs from "fs"; import path from "path"; import zlib from "zlib"; import crypto from "crypto";
const T={html:"text/html; charset=utf-8",css:"text/css; charset=utf-8",js:"application/javascript; charset=utf-8",json:"application/json; charset=utf-8",md:"text/markdown; charset=utf-8",txt:"text/plain; charset=utf-8",svg:"image/svg+xml",png:"image/png",xml:"application/xml; charset=utf-8",woff2:"font/woff2"};
const files=["index.html","template.html","robots.txt","llms.txt","llms-full.txt","og.png",...fs.readdirSync(".").filter(f=>/^sitemap.*\.xml$/.test(f)),"styles.css","app.js","samples/CHECKLIST.md",...fs.readdirSync("i18n").map(f=>"i18n/"+f),...fs.readdirSync("fonts").map(f=>"fonts/"+f)];
const h=crypto.createHash("sha1");for(const f of files)h.update(fs.readFileSync(f));const V=h.digest("hex").slice(0,10);
const F={};for(const f of files){let buf=fs.readFileSync(f);if(/\.(html|js)$/.test(f))buf=Buffer.from(buf.toString("utf8").replaceAll("__V__",V));F["/"+f]=[T[f.split(".").pop()],buf.toString("base64")]}
F["/"]=F["/index.html"];
const Z=zlib.gzipSync(JSON.stringify(F),{level:9}).toString("base64");
const worker=`const Z=${JSON.stringify(Z)};let F;async function load(){if(F)return F;const x=atob(Z),u=new Uint8Array(x.length);for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i);F=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"))).json();return F}
function b(s){const x=atob(s),u=new Uint8Array(x.length);for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i);return u}
export default{async fetch(r){const F=await load();const U=new URL(r.url);let p=decodeURIComponent(U.pathname);if(p.length>1&&p.endsWith("/"))p=p.slice(0,-1);for(const k of [p,p+".html"]){const h=F[k];if(h){const hd={"content-type":h[0],"cache-control":h[0].includes("html")?"no-cache":(U.searchParams.has("v")||k.startsWith("/fonts/"))?"public, max-age=31536000, immutable":"public, max-age=300","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"};if(k.endsWith(".md"))hd["content-disposition"]='inline; filename="CHECKLIST.md"';return new Response(b(h[1]),{headers:hd})}}return new Response("Not found",{status:404,headers:{"content-type":"text/plain; charset=utf-8"}})}}`;
fs.writeFileSync("worker.mjs",worker);
const code=`async () => {
  const worker=${JSON.stringify(worker)};
  const B="----PassGate"+Date.now();
  const meta={main_module:"worker.js",compatibility_date:"2026-01-01"};
  const body=["--"+B,'Content-Disposition: form-data; name="metadata"',"Content-Type: application/json","",JSON.stringify(meta),"--"+B,'Content-Disposition: form-data; name="worker.js"; filename="worker.js"',"Content-Type: application/javascript+module","",worker,"--"+B+"--"].join("\\r\\n");
  const up=await cloudflare.request({method:"PUT",path:"/accounts/"+accountId+"/workers/scripts/passgate",body,contentType:"multipart/form-data; boundary="+B,rawBody:true});
  const doms=await cloudflare.request({method:"GET",path:"/accounts/"+accountId+"/workers/domains",query:{service:"passgate"}});
  return {ok:up.success,errors:up.errors,domains:(doms.result||[]).map(d=>d.hostname)};
}`;
fs.writeFileSync("cf_deploy_exec.js",code);fs.writeFileSync("deploy-v3.js",code);
console.log("V",V,"worker bytes",worker.length,"code bytes",code.length);
