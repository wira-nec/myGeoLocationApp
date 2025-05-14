import { Component, OnInit } from '@angular/core';
import { Toast, ToasterService } from '../../../services/toaster.service';
import { ToasterComponent } from '../toaster.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toaster-container',
  imports: [ToasterComponent, CommonModule],
  templateUrl: './toaster-container.component.html',
  styleUrl: './toaster-container.component.scss',
})
export class ToasterContainerComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(public readonly toaster: ToasterService) {}

  ngOnInit() {
    this.toaster.toast$.subscribe((toast) => {
      this.toasts = [toast, ...this.toasts];
      setTimeout(() => this.toasts.pop(), toast.delay || 6000);
    });
  }

  remove(index: number) {
    this.toasts = this.toasts.filter((v, i) => i !== index);
  }
}
