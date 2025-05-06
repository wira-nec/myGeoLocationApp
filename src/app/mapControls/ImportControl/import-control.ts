import { ElementRef } from '@angular/core';
import { Control } from 'ol/control';

export class FilesImportControl extends Control {
  /**
   * @param {ElementRef} [elementRef] Reference to button element.
   */
  constructor(elementRef: ElementRef) {
    super({
      element: elementRef.nativeElement,
    });
  }
}
