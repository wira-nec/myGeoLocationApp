import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JsonCreator {
  createJson(data: object) {
    return JSON.stringify(data, null, 2);
  }

  savaJsonFile(jsonContent: string, filename: string) {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
