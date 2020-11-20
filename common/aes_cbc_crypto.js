'use strict';
const crypto = require('crypto');

class AesCbc {
  constructor(key, iv) {
    if (!key || key.length !== 32) {
      throw new Error('key should be a string or buffer length is 32');
    }
    this.key = key;
    if (!Buffer.isBuffer(this.key)) {
      this.key = Buffer.from(key);
    }
    this.iv = iv;
    if (!this.iv || typeof this.iv !== 'object' || !Buffer.isBuffer(this.iv) || this.iv.length !== 16) {
      this.iv = Buffer.alloc(16);
      this.key.copy(this.iv, 0, 0, 16);
    }
    this.algorithm = 'aes-256-cbc';
    this.blockSize = 32;
  }
  encrypt(data, encode = 'utf8', outEncode = 'base64') {
    let cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    cipher.setAutoPadding(false);
    let encryptData = Buffer.concat([cipher.update(this.PKCS7Encoder(Buffer.from(data, encode))), cipher.final()]);
    if (outEncode === 'buffer') {
      return encryptData;
    }
    return encryptData.toString(outEncode);
  }
  decrypt(data, encode = 'base64', outEncode = 'utf8') {
    let decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    decipher.setAutoPadding(false);
    let decipheredBuff = Buffer.concat([decipher.update(data, encode), decipher.final()]);
    decipheredBuff = this.PKCS7Decoder(decipheredBuff);
    if (outEncode === 'buffer') {
      return decipheredBuff;
    }
    return decipheredBuff.toString(outEncode);
  }
  PKCS7Encoder(buff) {
    let strSize = buff.length;
    let amountToPad = this.blockSize - (strSize % this.blockSize);
    let pad = Buffer.alloc(amountToPad, String.fromCharCode(amountToPad));
    return Buffer.concat([buff, pad]);
  }
  PKCS7Decoder(buff) {
    let pad = buff[buff.length - 1];
    if (pad < 1 || pad > this.blockSize) {
      pad = 0;
    }
    return buff.slice(0, buff.length - pad);
  }
}
module.exports = AesCbc;