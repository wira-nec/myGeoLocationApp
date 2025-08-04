import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';

const GRABBER_ID = 'grabber';

@Directive({
  selector: '[appResizeElement]',
})
export class ResizeElementDirective implements OnInit, OnDestroy {
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.grabber) {
      return;
    }
    this.resize(event.movementX);
  }

  @HostListener('mouseup', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMouseUp(event: any) {
    if (event.target.id && event.target.id === GRABBER_ID) {
      this.grabber = false;
    }
  }

  @HostListener('mousedown', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMouseDown(event: any) {
    if (event.target.id && event.target.id === GRABBER_ID) {
      this.width = this.element.clientWidth;
      this.grabber = true;
    }
  }

  private grabber = false;
  private width = 0;
  private element;
  private observer!: IntersectionObserver;

  constructor(private elementRef: ElementRef) {
    this.element = this.elementRef.nativeElement;
  }

  ngOnDestroy(): void {
    this.observer?.unobserve(this.element);
  }

  ngOnInit(): void {
    this.listenForElementInView();
  }

  listenForElementInView() {
    this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
      threshold: 1,
    });
    this.observer.observe(this.element);
  }

  onIntersection(entries: IntersectionObserverEntry[]) {
    if (entries[0].isIntersecting === true) {
      this.width = this.element.clientWidth;
      const grabber = document.createElement('div');
      grabber.id = GRABBER_ID;
      grabber.style.position = 'absolute';
      grabber.style.top = '0px';
      grabber.style.right = '0px';
      grabber.style.cursor = 'ew-resize';
      grabber.style.height = this.element.clientHeight - 20 + 'px';
      grabber.style.width = '8px';
      grabber.style.zIndex =
        document.defaultView
          ?.getComputedStyle(this.element, null)
          .getPropertyValue('z-index') || '1000';
      grabber.style.overflow = 'hidden';
      grabber.style.backgroundColor = 'transparent';
      grabber.style.backgroundImage =
        'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==)';
      grabber.style.backgroundPosition = 'center center';
      grabber.style.backgroundRepeat = 'no-repeat';
      this.element.appendChild(grabber);
      this.ngOnDestroy();
    }
  }
  resize(offsetX: number) {
    this.width += offsetX;
    this.element.style.width = this.width + 'px';
  }
}
