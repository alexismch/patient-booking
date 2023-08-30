import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
   transform(value: string): Date {
      if (!value) {
         return undefined;
      }
      const date = new Date(value);
      return isNaN(date.getDate()) ? undefined : date;
   }
}
