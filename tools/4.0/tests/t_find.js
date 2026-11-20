const vm=require('vm'),fs=require('fs');
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,TextEncoder,TextDecoder,crypto:globalThis.crypto,JSON,Math,Date,Uint8Array,Array,Object,String,Number,parseInt,parseFloat,Promise,Error};
ctx.window=ctx;let sent=null;
ctx.Capacitor={Plugins:{BoNet:{tcpOpen:async()=>({id:1}),localIp:async()=>({ip:'192.168.1.5',prefix:24}),
 udpListen:async(o)=>{sent=o.probe;return {bound:[6666,6667,7000],items:[{ip:'192.168.1.60',port:6667,hex:fs.readFileSync('/tmp/claude-0/bc33.hex','utf8')},{ip:'192.168.1.77',port:7000,hex:fs.readFileSync('/tmp/claude-0/bc35.hex','utf8')},{ip:'192.168.1.5',port:7000,hex:'00'}]}},
 scan:async()=>({items:['192.168.1.60','192.168.1.77','192.168.1.90']}),
 http:async({url})=>({status:200,body:JSON.stringify(/token/.test(url)?{success:true,result:{access_token:'t'}}:{success:true,result:{devices:[{id:'bfELIVCO',name:'ELIVCO',local_key:'0123456789abcdef'}]}})})}}};
ctx.S={plugs:[]};ctx.save=()=>{};ctx.BO4={sync(){}};ctx.document={getElementById:(id)=>({tyaid:{value:'a'},tyasec:{value:'b'},tyreg:{value:'eu'}})[id]||null,hidden:false};ctx.module=undefined;
vm.createContext(ctx);vm.runInContext(fs.readFileSync('/home/claude/ec/aes.js','utf8')+'\n'+fs.readFileSync('/home/claude/ec/tuya.js','utf8'),ctx);
(async()=>{await ctx.tyFind();console.log('probe sent',!!sent,'found',JSON.stringify(ctx.TY.found));console.log(ctx.TY.log.join('\n'));
 ctx.TY.found=[{ip:'192.168.1.90',dev:'',ver:'',pk:''}];await ctx.tyCloudKeys();console.log('after cloud',JSON.stringify(ctx.S.plugs),ctx.TY.note,ctx.TY.err);
 ctx.S.plugs=[{name:'Розетка 1',ip:'192.168.1.90',dev:'',key:'',ver:'auto',grid:false}];await ctx.tyCloudKeys();console.log('fill blank',JSON.stringify(ctx.S.plugs));
 console.log(ctx.tyCardHtml().includes('ID невідомий'))})();
