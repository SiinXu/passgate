import http from "http"; import w from "../worker.mjs";
http.createServer(async (req,res)=>{const r=await w.fetch(new Request("http://localhost:8765"+req.url));res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}).listen(8765,()=>console.log("up"));
