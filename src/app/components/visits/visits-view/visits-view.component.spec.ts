import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitsViewComponent } from './visits-view.component';

describe('VisitsViewComponent', () => {
  let component: VisitsViewComponent;
  let fixture: ComponentFixture<VisitsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitsViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
