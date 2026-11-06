import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'ordinalDate',
  standalone: true
})
export class OrdinalDatePipe implements PipeTransform {
  private datePipe = new DatePipe('en-US');

  transform(value: Date | string | number, format: string = 'EEEE, MMMM d'): string {
    if (!value) return '';

    const date = new Date(value);
    const day = date.getDate();
    const ordinalDay = this.getOrdinalDay(day);

    const dayOfWeek = this.datePipe.transform(date, 'EEEE') || '';
    const month = this.datePipe.transform(date, 'MMMM') || '';

    return `${dayOfWeek}, ${month} ${ordinalDay}`;
  }

  private getOrdinalDay(day: number): string {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1: return day + 'st';
      case 2: return day + 'nd';
      case 3: return day + 'rd';
      default: return day + 'th';
    }
  }
}
