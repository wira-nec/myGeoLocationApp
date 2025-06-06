import { Component } from '@angular/core';
import { Toast, ToasterService } from '../../../core/services/toaster.service';
import { ToasterComponent } from '../toaster.component';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-toaster-container',
  imports: [ToasterComponent, CommonModule],
  templateUrl: './toaster-container.component.html',
  styleUrl: './toaster-container.component.scss',
})
export class ToasterContainerComponent {
  toasts: Toast[] = [];

  constructor(public readonly toaster: ToasterService) {
    this.toaster.toast$.pipe(takeUntilDestroyed()).subscribe((toast) => {
      this.toasts = [toast, ...this.toasts];
      if (toast.delay) {
        setTimeout(() => this.toasts.pop(), toast.delay || 6000);
      }
    });
  }

  remove(index: number) {
    this.toasts = this.toasts.filter((v, i) => i !== index);
  }
}
