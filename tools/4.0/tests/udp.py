import sys,json;sys.path.insert(0,'/home/claude/ref/tinytuya')
from hashlib import md5
from tinytuya.core import message_helper as M, header as H
from tinytuya.core.crypto_helper import AESCipher
k=md5(b"yGAdlopoPVldABfn").digest()
j33=json.dumps({"ip":"192.168.1.61","gwId":"bf0123456789abcdefgh","active":2,"encrypt":True,"productKey":"keyabc","version":"3.3"}).encode()
f33=M.pack_message(M.TuyaMessage(0,0x13,0,b'\0\0\0\0'+AESCipher(k).encrypt(j33,False),0,True,H.PREFIX_55AA_VALUE,False))
j35=json.dumps({"ip":"192.168.1.62","gwId":"bf9999999999abcdefgh","active":2,"encrypt":True,"productKey":"keyxyz","version":"3.5"}).encode()
f35=M.pack_message(M.TuyaMessage(0,0x13,0,j35,0,True,H.PREFIX_6699_VALUE,True),hmac_key=k)
print(json.dumps([f33.hex(),f35.hex()]))
