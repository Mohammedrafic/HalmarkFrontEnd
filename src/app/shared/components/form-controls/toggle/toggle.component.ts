import { Component, OnInit } from '@angular/core';
import { ChangeEventArgs } from '@syncfusion/ej2-buttons';
import { BaseFormControlDirective } from '@shared/components/form-controls/base-form-control.directive';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss'],
})
export class ToggleComponent extends BaseFormControlDirective implements OnInit {

  constructor() {
    super();
  }

  public get toggleValue(): boolean {
    return this.getControl()?.value;
  }

  ngOnInit(): void {
  }

  public onChange({ checked }: ChangeEventArgs): void {
    this.getControl()?.setValue(checked);
  }

}
