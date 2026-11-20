"""Fake Tuya plug (device side) built on tinytuya's own framing/crypto helpers. Usage: fakeplug.py <port> <version> <localkey>"""
import sys, socket, struct, json, hmac, os, threading, time
from hashlib import sha256, md5
sys.path.insert(0,'/home/claude/ref/tinytuya')
from tinytuya.core import message_helper as M, header as H
from tinytuya.core.crypto_helper import AESCipher
port=int(sys.argv[1]);ver=float(sys.argv[2]);real=sys.argv[3].encode()
state={'1':True,'18':812,'19':1764,'20':2291,'17':123}
def pk(sess_key,seq,cmd,payload,retcode=0):
    if ver>=3.5:
        return M.pack_message(M.TuyaMessage(seq,cmd,retcode,payload,0,True,H.PREFIX_6699_VALUE,True),hmac_key=sess_key)
    body=struct.pack('>I',retcode)+payload
    return M.pack_message(M.TuyaMessage(seq,cmd,0,body,0,True,H.PREFIX_55AA_VALUE,False),hmac_key=sess_key if ver>=3.4 else None)
def handle(c):
    key=real;seq=100;buf=b'';local_nonce=None;remote=os.urandom(16)
    vh=('%.1f'%ver).encode()+b'\0'*12
    while True:
        d=c.recv(4096)
        if not d:break
        buf+=d
        while True:
            try:hdr=M.parse_header(buf)
            except Exception:break
            if len(buf)<hdr.total_length:break
            fr=buf[:hdr.total_length];buf=buf[hdr.total_length:]
            try:msg=M.unpack_message(fr,hmac_key=key if ver>=3.4 else None,no_retcode=True)
            except Exception as e:print('unpack fail',e,flush=True);return
            if not msg.crc_good:print('BAD CRC/HMAC from client cmd',msg.cmd,flush=True);return
            p=msg.payload;cmd=msg.cmd
            if cmd==3:
                local_nonce=p if ver>=3.5 else AESCipher(real).decrypt(p,False,decode_text=False)
                h=hmac.new(real,local_nonce,sha256).digest();resp=remote+h
                if ver<3.5:resp=AESCipher(real).encrypt(resp,False)
                c.sendall(pk(real,seq,4,resp));seq+=1;continue
            if cmd==5:
                pl=p if ver>=3.5 else AESCipher(real).decrypt(p,False,decode_text=False)
                if pl!=hmac.new(real,remote,sha256).digest():print('bad finish hmac',flush=True);return
                x=bytes(a^b for a,b in zip(local_nonce,remote))
                key=AESCipher(real).encrypt(x,False,pad=False) if ver<3.5 else AESCipher(real).encrypt(x,use_base64=False,pad=False,iv=local_nonce[:12])[12:28]
                print('session ok',flush=True);continue
            # data commands
            if ver>=3.4:
                if ver<3.5:p=AESCipher(key).decrypt(p,False,decode_text=False)
                if p.startswith(vh[:3]):p=p[15:]
                j=json.loads(p.decode() or '{}')
            else:
                if p.startswith(vh[:3]):p=p[15:]
                j=json.loads(AESCipher(key).decrypt(p,False,decode_text=False).decode())
                assert j.get('devId')=='bf0123456789abcdefgh', j
            print('cmd',cmd,'json',j,flush=True)
            if cmd in (7,13):
                dps=j.get('dps') or j.get('data',{}).get('dps',{})
                state.update(dps)
            out=json.dumps({'devId':'bf0123456789abcdefgh','dps':state,'t':int(time.time())},separators=(',',':')).encode()
            if ver>=3.5:payload=vh+out
            elif ver>=3.4:payload=AESCipher(key).encrypt(vh+out,False)
            else:payload=vh+AESCipher(key).encrypt(out,False)
            rcmd=16 if cmd==16 else (8 if cmd in (7,13) else cmd)
            c.sendall(pk(key,seq,rcmd,payload));seq+=1
s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('127.0.0.1',port));s.listen()
print('listening',port,ver,flush=True)
while True:
    c,_=s.accept();threading.Thread(target=lambda:(handle(c),c.close()),daemon=True).start()
