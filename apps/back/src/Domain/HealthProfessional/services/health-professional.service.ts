import { BadRequestException, Injectable } from '@nestjs/common';
import { HealthProfessionalRepository } from '../../../Persistence/HealthProfessional';
import { IHealthProfessionalAvailability } from '../interfaces';
import { Availability } from '@prisma/client';

@Injectable()
export class HealthProfessionalService {
   constructor(
      private readonly healthProfessionalRepository: HealthProfessionalRepository,
   ) {}

   async getAvailabilities(
      hpId: number,
      from = new Date(),
      to?: Date,
   ): Promise<IHealthProfessionalAvailability[]> {
      if (!to) {
         to = new Date(from);
      }

      HealthProfessionalService.cleanDates(from, to);
      HealthProfessionalService.checkDates(from, to);

      const healthProfessional = await this.getHealthProfessional(
         hpId,
         from,
         to,
      );

      const hpAvailabilities = healthProfessional.availabilities.reduce(
         (prev, cur) => prev.set(cur.day, cur),
         new Map<number, Availability>(),
      );

      const daysAvailabilities = new Map<
         string,
         { from: string; to: string }[]
      >();

      for (
         let date = new Date(from);
         date <= to;
         date.setDate(date.getDate() + 1)
      ) {
         const hpAvailability = hpAvailabilities.get(date.getDay());
         if (hpAvailability) {
            daysAvailabilities.set(HealthProfessionalService.getDateKey(date), [
               {
                  from: hpAvailability.from,
                  to: hpAvailability.to,
               },
            ]);
         }
      }

      for (let i = 0; i < healthProfessional.events.length; i++) {
         const event = healthProfessional.events[i];
         const dateKey = HealthProfessionalService.getDateKey(event.from);
         const dayAvailabilities = daysAvailabilities.get(dateKey);

         for (let j = 0; j < dayAvailabilities.length; j++) {
            const dayAvailability = dayAvailabilities[j];
            const from = new Date(`${dateKey} ${dayAvailability.from}`);
            const to = new Date(`${dateKey} ${dayAvailability.to}`);

            if (from < event.from || to > event.to) {
               const newAvailabilities = [];

               if (from < event.from) {
                  newAvailabilities.push({
                     from: HealthProfessionalService.getTimeKey(from),
                     to: HealthProfessionalService.getTimeKey(event.from),
                  });
               }

               if (to > event.to) {
                  newAvailabilities.push({
                     from: HealthProfessionalService.getTimeKey(event.to),
                     to: HealthProfessionalService.getTimeKey(to),
                  });
               }

               dayAvailabilities.splice(j, 1, ...newAvailabilities);
               break;
            }
         }
      }

      const availabilities: IHealthProfessionalAvailability[] = [];
      for (const day of daysAvailabilities.keys()) {
         const dayAvailabilities = daysAvailabilities.get(day);
         for (let i = 0; i < dayAvailabilities.length; i++) {
            availabilities.push({
               startAt: new Date(`${day} ${dayAvailabilities[i].from}`),
               endAt: new Date(`${day} ${dayAvailabilities[i].to}`),
            });
         }
      }
      return availabilities;
   }

   async getNextAvailability(
      hpId: number,
      from = new Date(),
   ): Promise<IHealthProfessionalAvailability> {
      HealthProfessionalService.cleanDates(from);
      HealthProfessionalService.checkDates(from);

      const healthProfessional = await this.getHealthProfessional(hpId, from);
      return null;
   }

   private async getHealthProfessional(hpId: number, from: Date, to?: Date) {
      return await this.healthProfessionalRepository.getById(hpId, {
         include: {
            availabilities: true,
            events: {
               from,
               to,
            },
         },
      });
   }

   private static cleanDates(from: Date, to?: Date) {
      from.setHours(0);
      from.setMinutes(0);
      from.setSeconds(0);
      from.setMilliseconds(0);
      to?.setHours(23);
      to?.setMinutes(59);
      to?.setSeconds(59);
      to?.setMilliseconds(999);
   }

   private static checkDates(from: Date, to?: Date) {
      const now = new Date();
      this.cleanDates(now);

      if (from < now) {
         throw new BadRequestException(
            '"from" date should be higher than now.',
         );
      }

      if (to && to <= from) {
         throw new BadRequestException(
            '"to" date should be higher than "from" date.',
         );
      }
   }

   private static getDateKey(date: Date) {
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
   }

   private static getTimeKey(date: Date) {
      return `${date.getHours()}:${date.getMinutes()}`;
   }
}
