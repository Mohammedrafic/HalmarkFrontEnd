import { Pipe, PipeTransform } from '@angular/core';
import { STATUS_COLOR_GROUP } from '@shared/enums/status';

@Pipe({
  name: 'chipsCssClass'
})
export class ChipsCssClass implements PipeTransform {

  transform(status: string): string {
    const found = Object.entries(STATUS_COLOR_GROUP).find(item => item[1].includes(status));
    return found ? found[0] : 'e-default';
  }
}
