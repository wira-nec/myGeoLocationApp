import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[appOverflowPane]',
})
export class OverflowPaneDirective {
  @Input() show = false;
  @Input() position: 'left' | 'right' = 'left';
  @Input() offset = 10;
  @HostBinding('class')
  className = 'overflow-pane-css-class';
  // change the display attribute of the class to 'none' or 'unset' based on the show property
  @HostBinding('style.display')
  get displayStyle(): string {
    return this.show ? 'unset' : 'none';
  }
  @HostBinding('style.left')
  get leftStyle(): string {
    return this.position === 'left' ? `${this.offset}px` : 'unset';
  }
  @HostBinding('style.right')
  get rightStyle(): string {
    return this.position === 'right' ? `${this.offset}px` : 'unset';
  }
  @HostBinding('style.width') @Input() width = '480px';
}
