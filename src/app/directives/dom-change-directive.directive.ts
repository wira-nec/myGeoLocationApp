import {
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appDomChangeDirective]',
})
export class DomChangeDirectiveDirective implements OnDestroy {
  private changes: MutationObserver;

  @Output()
  public domChange = new EventEmitter();

  constructor(private elementRef: ElementRef) {
    const element = this.elementRef.nativeElement;

    this.changes = new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation: MutationRecord) =>
        this.domChange.emit(mutation)
      );
    });

    this.changes.observe(element, {
      attributes: true,
      childList: true,
      characterData: true,
    });
  }
  ngOnDestroy(): void {
    this.changes.disconnect();
  }
}
