const net=require('net');
function mkBoNet(){const socks={};let nid=1;
 return {
  tcpOpen:({host,port,timeout})=>new Promise((res,rej)=>{const s=net.connect({host:'127.0.0.1',port:s_port(port,host)});const id=nid++;s.buf=[];s.on('data',d=>{s.buf.push(...d);s.cb&&s.cb()});s.on('error',e=>rej(new Error(e.code==='ECONNREFUSED'?'Connection refused':e.message)));s.on('connect',()=>{socks[id]=s;res({id})});setTimeout(()=>rej(new Error('timeout')),timeout||4000)}),
  tcpWrite:({id,hex})=>{socks[id].write(Buffer.from(hex,'hex'));return Promise.resolve({})},
  tcpRead:({id,timeout,quiet})=>new Promise(res=>{const s=socks[id];let qt=null;const done=()=>{const h=Buffer.from(s.buf).toString('hex');s.buf=[];s.cb=null;res({hex:h})};
    const arm=()=>{clearTimeout(qt);qt=setTimeout(done,quiet||300)};const to=setTimeout(done,timeout||3000);s.cb=()=>{clearTimeout(to);arm()};if(s.buf.length){clearTimeout(to);arm()}}),
  tcpClose:({id})=>{socks[id]&&socks[id].destroy();delete socks[id];return Promise.resolve({})},
  udpListen:async()=>({items:JSON.parse(process.env.UDP||'[]').map((h,i)=>({ip:'192.168.1.6'+(i+1),port:6667,hex:h}))})
 }}
let PORTMAP={};function s_port(p,host){return PORTMAP[host]||p}
module.exports={mkBoNet,setPorts:m=>{PORTMAP=m}};
