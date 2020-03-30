import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTestComponent } from './file-test.component';

describe('FileTestComponent', () => {
  let component: FileTestComponent;
  let fixture: ComponentFixture<FileTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
