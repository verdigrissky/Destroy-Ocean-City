import { Pipe, PipeTransform } from '@angular/core';
import { readingMinutes } from '../shared/plain-text';

@Pipe({
  name: 'readingTime',
  standalone: true
})
export class ReadingTimePipe implements PipeTransform {
  transform(html: string): string {
    return `${readingMinutes(html)} min read`;
  }
}
