// Build worker.mjs (static asset map + server/api.mjs) and deploy snippet for the Cloudflare MCP execute tool.
import fs from "fs"; import zlib from "zlib"; import crypto from "crypto";
const T={html:"text/html; charset=utf-8",css:"text/css; charset=utf-8",js:"application/javascript; charset=utf-8",json:"application/json; charset=utf-8",md:"text/markdown; charset=utf-8",txt:"text/plain; charset=utf-8",svg:"image/svg+xml",png:"image/png",xml:"application/xml; charset=utf-8",woff2:"font/woff2"};
const files=["index.html","template.html","success.html","robots.txt","llms.txt","llms-full.txt","og.png",...fs.readdirSync(".").filter(f=>/^sitemap.*\.xml$/.test(f)),"styles.css","app.js","samples/CHECKLIST.md",...fs.readdirSync("i18n").map(f=>"i18n/"+f),...fs.readdirSync("fonts").map(f=>"fonts/"+f)];
const h=crypto.createHash("sha1");for(const f of files)h.update(fs.readFileSync(f));h.update(fs.readFileSync("server/api.mjs"));const V=h.digest("hex").slice(0,10);
const F={};for(const f of files){let buf=fs.readFileSync(f);if(/\.(html|js)$/.test(f))buf=Buffer.from(buf.toString("utf8").replaceAll("__V__",V));F["/"+f]=[T[f.split(".").pop()],buf.toString("base64")]}
F["/"]=F["/index.html"];
const Z=zlib.gzipSync(JSON.stringify(F),{level:9}).toString("base64");
const API=fs.readFileSync("server/api.mjs","utf8").replace("export async function api","async function api");
const worker=`const Z=${JSON.stringify(Z)};let F;async function load(){if(F)return F;const x=atob(Z),u=new Uint8Array(x.length);for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i);F=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"))).json();return F}
function b(s){const x=atob(s),u=new Uint8Array(x.length);for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i);return u}
${API}
export default{async fetch(r,env){const U=new URL(r.url);let p=decodeURIComponent(U.pathname);if(p.startsWith("/api/"))return api(r,env||{},p);const F=await load();if(p.length>1&&p.endsWith("/"))p=p.slice(0,-1);if(/^\\/success(\\/[A-Za-z-]{2,5})?$/.test(p))p="/success.html";for(const k of [p,p+".html"]){const h=F[k];if(h){const hd={"content-type":h[0],"cache-control":h[0].includes("html")?"no-cache":(U.searchParams.has("v")||k.startsWith("/fonts/"))?"public, max-age=31536000, immutable":"public, max-age=300","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"};if(k==="/success.html"){hd["x-robots-tag"]="noindex";hd["referrer-policy"]="no-referrer"}if(k.endsWith(".md"))hd["content-disposition"]='inline; filename="CHECKLIST.md"';return new Response(b(h[1]),{headers:hd})}}return new Response("Not found",{status:404,headers:{"content-type":"text/plain; charset=utf-8"}})}}`;
fs.writeFileSync("worker.mjs",worker);
const code=`async () => {
  const worker=${JSON.stringify(worker)};
  const B="----PassGate"+Date.now();
  const meta={main_module:"worker.js",compatibility_date:"2026-01-01",bindings:[{type:"d1",name:"DB",id:"8fa9b2e9-20e3-4466-80b2-131fe8dbf464"},{type:"plain_text",name:"CREEM_MODE",text:"test"},{type:"plain_text",name:"CREEM_PRODUCT_TEMPLATE",text:"prod_7JR9X8YF1oNG8FkksofcQE"},{type:"plain_text",name:"CREEM_PRODUCT_INSTALL",text:"prod_734PFO0zoVeVxi3wKaprYp"},{type:"plain_text",name:"CREEM_PRODUCT_PLUS",text:"prod_WuaONrPQkcrMfYzAlOe1g"}],keep_bindings:["secret_text"]};
  const body=["--"+B,'Content-Disposition: form-data; name="metadata"',"Content-Type: application/json","",JSON.stringify(meta),"--"+B,'Content-Disposition: form-data; name="worker.js"; filename="worker.js"',"Content-Type: application/javascript+module","",worker,"--"+B+"--"].join("\\r\\n");
  const up=await cloudflare.request({method:"PUT",path:"/accounts/"+accountId+"/workers/scripts/passgate",body,contentType:"multipart/form-data; boundary="+B,rawBody:true});
  const dep=await cloudflare.request({method:"GET",path:"/accounts/"+accountId+"/workers/scripts/passgate/deployments"});
  const sec=await cloudflare.request({method:"GET",path:"/accounts/"+accountId+"/workers/scripts/passgate/secrets"});
  return {ok:up.success,errors:up.errors,etag:up.result&&up.result.etag,version:dep.result&&dep.result.deployments&&dep.result.deployments[0]&&dep.result.deployments[0].versions,secrets:(sec.result||[]).map(s=>s.name)};
}`;
fs.writeFileSync("deploy-creem.js",code);
console.log("V",V,"worker bytes",worker.length,"code bytes",code.length);
