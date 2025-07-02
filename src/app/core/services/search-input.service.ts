import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SearchInputService {
  private showSearchInput = false;

  setVisibility(isVisible: boolean) {
    this.showSearchInput = isVisible;
    this.showHideSearchInput();
  }

  toggleVisibility() {
    this.showSearchInput = !this.showSearchInput;
    this.showHideSearchInput();
  }

  getVisibility(): boolean {
    return this.showSearchInput;
  }

  showHideSearchInput() {
    const searchInput = document.getElementsByClassName('ol-geocoder')[0];
    if (searchInput) {
      searchInput.classList.remove(...['visible', 'hidden']);
      searchInput.classList.add(this.showSearchInput ? 'visible' : 'hidden');
    }
  }
}
