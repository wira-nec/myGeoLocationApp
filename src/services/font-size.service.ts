import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FontSizeService {
  constructor(private responsive: BreakpointObserver) {
    this.responsive
      .observe([Breakpoints.Handset, Breakpoints.Tablet, Breakpoints.Web])
      .subscribe((result) => {
        const breakpoints = result.breakpoints;
        if (
          breakpoints[Breakpoints.TabletPortrait] ||
          breakpoints[Breakpoints.HandsetLandscape]
        ) {
          this.fontSize$.next(2);
        } else if (
          breakpoints[Breakpoints.HandsetPortrait] ||
          breakpoints[Breakpoints.HandsetLandscape]
        ) {
          this.fontSize$.next(1);
        } else if (
          breakpoints[Breakpoints.WebLandscape] ||
          breakpoints[Breakpoints.WebPortrait]
        ) {
          this.fontSize$.next(3);
        }
      });
  }

  fontSize$ = new BehaviorSubject(3);
}
