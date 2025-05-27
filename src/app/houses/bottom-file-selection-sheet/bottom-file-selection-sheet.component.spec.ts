import { TestBed } from '@angular/core/testing';
import { setUpMockedServices } from '../../../test/setUpMockedServices';
import { BottomFileSelectionSheetComponent } from './bottom-file-selection-sheet.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { waitFor } from '@testing-library/angular';

describe('BottomFileSelectionSheetComponent', () => {
  let component: BottomFileSelectionSheetComponent;
  let matBottomSheetRefMock: jest.Mocked<
    MatBottomSheetRef<BottomFileSelectionSheetComponent>
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userPositionServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dataStoreServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pictureStoreMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let progressServiceMock: any;

  beforeEach(() => {
    // Mocks
    matBottomSheetRefMock = {
      dismiss: jest.fn(),
      // add other methods if used in the component
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    ({
      userPositionServiceMock,
      dataStoreServiceMock,
      pictureStoreMock,
      progressServiceMock,
    } = setUpMockedServices());
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MatBottomSheetRef,
          useValue: matBottomSheetRefMock,
        },
      ],
    });
    TestBed.runInInjectionContext(() => {
      component = new BottomFileSelectionSheetComponent(
        pictureStoreMock,
        dataStoreServiceMock,
        userPositionServiceMock,
        progressServiceMock
      );
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dismiss the bottom sheet when closeLink is called', () => {
    if (typeof component.closeLink === 'function') {
      component.closeLink();
      expect(matBottomSheetRefMock.dismiss).toHaveBeenCalled();
    }
  });

  // Add tests for onFileChange methods
  it('should call onFileChange with the correct arguments', async () => {
    const event = {
      target: {
        files: [
          new File([''], 'test.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    component.onFileChange(event);

    await waitFor(() => {
      expect(dataStoreServiceMock.store).toHaveBeenCalled();
    });
    expect(dataStoreServiceMock.store).toHaveBeenCalledWith([]);
  });
});
