import { Control } from 'ol/control';

export class CloseSearchControlComponent extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object = {}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = opt_options as any;
    const controlButton = options.element as HTMLButtonElement;

    super(opt_options);

    controlButton.addEventListener('click', () => {
      const textInput = document.querySelector(
        '.gcd-txt-input'
      ) as HTMLInputElement;
      // Check if textInput is visible
      if (
        textInput &&
        textInput.checkVisibility({ visibilityProperty: true })
      ) {
        // click search button to close search
        const searchButton = document.querySelector(
          '[src="assets/icons8-magnifier-50.png"]'
        ) as HTMLButtonElement;
        // Ensure searchButton is not null before clicking
        if (searchButton) {
          searchButton.click();
        }
      }
    });
  }
}
