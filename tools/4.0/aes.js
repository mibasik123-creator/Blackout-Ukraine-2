/* AES-128 block cipher (FIPS-197), ECB helpers with PKCS#7 — used only for the Tuya local protocol */
var AES128=(function(){
 var S=[],SI=[],T=[],xt=function(a){return ((a<<1)^((a&0x80)?0x1b:0))&255};
 (function(){var p=1,q=1;do{p=p^xt(p);q^=q<<1;q^=q<<2;q^=q<<4;q&=255;if(q&0x80)q^=0x09;var x=q^((q<<1|q>>7)&255)^((q<<2|q>>6)&255)^((q<<3|q>>5)&255)^((q<<4|q>>4)&255);x=(x^0x63)&255;S[p]=x;SI[x]=p}while(p!==1);S[0]=0x63;SI[0x63]=0})();
 function expand(key){var w=new Array(176),rc=1,i;for(i=0;i<16;i++)w[i]=key[i];
  for(i=16;i<176;i+=4){var t=[w[i-4],w[i-3],w[i-2],w[i-1]];if(i%16===0){t=[S[t[1]]^rc,S[t[2]],S[t[3]],S[t[0]]];rc=xt(rc)}for(var j=0;j<4;j++)w[i+j]=w[i-16+j]^t[j]}return w}
 function mul(a,b){var r=0;while(b){if(b&1)r^=a;a=xt(a);b>>=1}return r}
 function enc(w,inp){var s=inp.slice(0,16),r,c,i,t;for(i=0;i<16;i++)s[i]^=w[i];
  for(r=1;r<=10;r++){for(i=0;i<16;i++)s[i]=S[s[i]];
   t=s.slice();for(c=0;c<4;c++)for(i=0;i<4;i++)s[c*4+i]=t[((c+i)%4)*4+i];
   if(r<10)for(c=0;c<4;c++){var a0=s[c*4],a1=s[c*4+1],a2=s[c*4+2],a3=s[c*4+3];s[c*4]=xt(a0)^xt(a1)^a1^a2^a3;s[c*4+1]=a0^xt(a1)^xt(a2)^a2^a3;s[c*4+2]=a0^a1^xt(a2)^xt(a3)^a3;s[c*4+3]=xt(a0)^a0^a1^a2^xt(a3)}
   for(i=0;i<16;i++)s[i]^=w[r*16+i]}return s}
 function dec(w,inp){var s=inp.slice(0,16),r,c,i,t;for(i=0;i<16;i++)s[i]^=w[160+i];
  for(r=9;r>=0;r--){t=s.slice();for(c=0;c<4;c++)for(i=0;i<4;i++)s[((c+i)%4)*4+i]=t[c*4+i];
   for(i=0;i<16;i++)s[i]=SI[s[i]];for(i=0;i<16;i++)s[i]^=w[r*16+i];
   if(r>0)for(c=0;c<4;c++){var a0=s[c*4],a1=s[c*4+1],a2=s[c*4+2],a3=s[c*4+3];s[c*4]=mul(a0,14)^mul(a1,11)^mul(a2,13)^mul(a3,9);s[c*4+1]=mul(a0,9)^mul(a1,14)^mul(a2,11)^mul(a3,13);s[c*4+2]=mul(a0,13)^mul(a1,9)^mul(a2,14)^mul(a3,11);s[c*4+3]=mul(a0,11)^mul(a1,13)^mul(a2,9)^mul(a3,14)}}return s}
 function ecbEnc(key,data,pad){var w=expand(key),d=data.slice();if(pad!==false){var n=16-(d.length%16);for(var i=0;i<n;i++)d.push(n)}var o=[];for(var j=0;j<d.length;j+=16)o=o.concat(enc(w,d.slice(j,j+16)));return o}
 function ecbDec(key,data,unpad){var w=expand(key),o=[];for(var j=0;j+16<=data.length;j+=16)o=o.concat(dec(w,data.slice(j,j+16)));if(unpad!==false&&o.length){var n=o[o.length-1];if(n>=1&&n<=16)o=o.slice(0,o.length-n)}return o}
 return {ecbEnc:ecbEnc,ecbDec:ecbDec,_enc:function(k,b){return enc(expand(k),b)},_dec:function(k,b){return dec(expand(k),b)}};
})();
if(typeof module!=='undefined')module.exports=AES128;
