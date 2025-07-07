import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  key = '1960'; // This is a simple key for encryption/decryption, you can change it to something more secure

  public saveData(key: string, value: string) {
    localStorage.setItem(key, this.encrypt(value));
  }

  public hasData(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  public getData(key: string) {
    const data = localStorage.getItem(key) || '';
    return this.decrypt(data);
  }
  public removeData(key: string) {
    localStorage.removeItem(key);
  }

  public clearData() {
    localStorage.clear();
  }

  private encrypt(txt: string): string {
    return CryptoJS.AES.encrypt(txt, this.key).toString();
  }

  private decrypt(txtToDecrypt: string) {
    return CryptoJS.AES.decrypt(txtToDecrypt, this.key).toString(
      CryptoJS.enc.Utf8
    );
  }
}
