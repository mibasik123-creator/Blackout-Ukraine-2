const vm=require('vm'),fs=require('fs'),{mkBoNet,setPorts}=require('./shim.js');
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,TextEncoder,TextDecoder,crypto:globalThis.crypto,JSON,Math,Date,Uint8Array,Array,Object,String,Number,parseInt,parseFloat,Promise,Error};
ctx.window=ctx;ctx.Capacitor={Plugins:{BoNet:mkBoNet()}};ctx.S={plugs:[]};ctx.save=()=>{};ctx.BO4={sync(){}};ctx.document={getElementById:()=>null,hidden:false};ctx.confirm=()=>true;ctx.module=undefined;
vm.createContext(ctx);vm.runInContext(fs.readFileSync('/home/claude/ec/aes.js','utf8')+'\n'+fs.readFileSync('/home/claude/ec/tuya.js','utf8'),ctx);
const KEY='0123456789abcdef',DEV='bf0123456789abcdefgh';
setPorts({'10.0.0.33':16633,'10.0.0.34':16634,'10.0.0.35':16635,'10.0.0.36':16636});
(async()=>{
 const cases=[['3.3','10.0.0.33','3.3'],['3.4','10.0.0.34','3.4'],['3.5','10.0.0.35','3.5'],['auto→3.4','10.0.0.34','auto'],['auto→3.3','10.0.0.33','auto'],['auto→3.5','10.0.0.35','auto']];
 for(const [n,ip,ver] of cases){ctx.S.plugs=[{name:n,ip,dev:DEV,key:KEY,ver,grid:true}];ctx.TY.plugs={};
  await ctx.tyPoll(0);let st=ctx.TY.plugs[DEV];console.log(n.padEnd(9),'read',JSON.stringify(st.d),st.err||'','found',ctx.S.plugs[0].vfound);
  await ctx.tyPoll(0,{'1':false});st=ctx.TY.plugs[DEV];console.log(''.padEnd(9),'after OFF',JSON.stringify(st.d&&st.d.on),st.err||'');
  await ctx.tyPoll(0,{'1':true});st=ctx.TY.plugs[DEV];console.log(''.padEnd(9),'after ON ',JSON.stringify(st.d&&st.d.on),st.err||'')}
 console.log('grid sensor',JSON.stringify(ctx.tyGrid()));
 // wrong key
 for(const [ip,ver] of [['10.0.0.34','3.4'],['10.0.0.35','3.5'],['10.0.0.33','3.3']]){ctx.S.plugs=[{name:'x',ip,dev:DEV,key:'ffffffffffffffff',ver}];ctx.TY.plugs={};await ctx.tyPoll(0);console.log('wrong key',ver,'->',ctx.TY.plugs[DEV].err)}
 ctx.S.plugs=[{name:'x',ip:'10.0.0.36',dev:DEV,key:KEY,ver:'3.4'}];ctx.TY.plugs={};await ctx.tyPoll(0);console.log('no device ->',ctx.TY.plugs[DEV].err);
 // discovery
 const md5ok=Buffer.from(ctx.tyMd5([...Buffer.from('yGAdlopoPVldABfn')])).toString('hex')===require('crypto').createHash('md5').update('yGAdlopoPVldABfn').digest('hex');console.log('md5',md5ok);
 await ctx.tyFind();console.log('discovery',JSON.stringify(ctx.TY.found),ctx.TY.err||'');
 process.exit(0)})().catch(e=>{console.error('FATAL',e);process.exit(1)});
