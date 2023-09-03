import {
   BadRequestException,
   Injectable,
   NotFoundException,
   UnprocessableEntityException,
} from '@nestjs/common';
import { HealthProfessionalRepository } from '../../../Persistence/HealthProfessional';
import { IHealthProfessionalAvailability } from '../interfaces';
import { Availability, Event } from '@prisma/client';

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
      HealthProfessionalService.cleanAndCheckDates(from, to);

      const healthProfessional = await this.getHealthProfessional(
         hpId,
         true,
         from,
         to,
      );
      if (!healthProfessional.availabilities?.length) {
         throw new UnprocessableEntityException(
            'Health professional does not have availabilities.',
         );
      }

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

         for (let j = 0; j < dayAvailabilities?.length; j++) {
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
      after = new Date(),
   ): Promise<IHealthProfessionalAvailability> {
      HealthProfessionalService.cleanAndCheckDates(after);

      const healthProfessional = await this.getHealthProfessional(hpId);
      if (!healthProfessional.availabilities?.length) {
         if (!healthProfessional.availabilities?.length) {
            throw new UnprocessableEntityException(
               'Health professional does not have availabilities.',
            );
         }
      }

      const hpAvailabilities = healthProfessional.availabilities.reduce(
         (prev, cur) => prev.set(cur.day, cur),
         new Map<number, Availability>(),
      );

      let availability: IHealthProfessionalAvailability;
      do {
         HealthProfessionalService.cleanDates(after);
         const rangeDates = HealthProfessionalService.getRangeDates(
            after,
            hpAvailabilities,
         );
         const lastDate = rangeDates.at(-1);

         const { events } = await this.getHealthProfessional(
            hpId,
            false,
            after,
            lastDate,
         );
         const daysEvents = events.reduce((prev, cur) => {
            let dayEvents = prev.get(
               HealthProfessionalService.getDateKey(cur.from),
            );
            if (!dayEvents) {
               dayEvents = [];
               prev.set(
                  HealthProfessionalService.getDateKey(cur.from),
                  dayEvents,
               );
            }
            dayEvents.push(cur);
            return prev;
         }, new Map<string, Event[]>());

         dates: for (let i = 0; i < rangeDates.length; i++) {
            const date = rangeDates[i];
            const dateKey = HealthProfessionalService.getDateKey(date);
            const dayAvailabilities = hpAvailabilities.get(date.getDay());
            const dayEvents = daysEvents.get(dateKey);

            if (!dayEvents?.length) {
               availability = {
                  startAt: new Date(`${dateKey} ${dayAvailabilities.from}`),
                  endAt: new Date(`${dateKey} ${dayAvailabilities.to}`),
               };

               break;
            }

            for (let j = 0; j < dayEvents.length; j++) {
               const event = dayEvents[j];
               const fromAvailability = new Date(
                  `${dateKey} ${dayAvailabilities.from}`,
               );

               if (fromAvailability < event.from) {
                  const prevEvent = dayEvents[j - 1];

                  if (prevEvent?.to?.getTime() !== event.from.getTime()) {
                     availability = {
                        startAt: prevEvent?.to || fromAvailability,
                        endAt: event.from,
                     };

                     break dates;
                  }
               }

               if (!dayEvents[j + 1]) {
                  const toAvailability = new Date(
                     `${dateKey} ${dayAvailabilities.to}`,
                  );

                  if (event.to < toAvailability) {
                     availability = {
                        startAt: event.to,
                        endAt: toAvailability,
                     };

                     break dates;
                  }
               }
            }
         }

         after = new Date(lastDate.setDate(lastDate.getDate() + 1));
      } while (!availability);

      return availability;
   }

   private async getHealthProfessional(
      hpId: number,
      includeAvailabilities = true,
      from?: Date,
      to?: Date,
   ) {
      const hp = await this.healthProfessionalRepository.getById(hpId, {
         include: {
            availabilities: includeAvailabilities,
            events:
               from || to
                  ? {
                       from,
                       to,
                    }
                  : false,
         },
      });

      if (!hp) {
         throw new NotFoundException();
      }

      return hp;
   }

   private static cleanAndCheckDates(from: Date, to?: Date) {
      this.cleanDates(from, to);
      this.checkDates(from, to);
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

   private static getRangeDates(
      after: Date,
      hpAvailabilities: Map<number, Availability>,
      pick = 5,
   ): Date[] {
      const date = new Date(after);
      this.cleanDates(after, date);

      const dates = [];
      while (dates.length < pick) {
         if (hpAvailabilities.has(date.getDay())) {
            dates.push(new Date(date));
         }
         date.setDate(date.getDate() + 1);
      }

      return dates;
   }
}
