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

   /**
    * Get the availabilities of a health professional
    *
    * @param hpId the id of the health professional
    * @param from the date after which it should look for availabilities
    * @param to the date before which it should look for availabilities
    */
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

      // = Process only dates during which a health professional works
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

         // = Update the availabilities of a day by removing the time slot of the event
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

      // = Format the remaining availabilities
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

   /**
    * Get the next availability of a health professional
    *
    * @param hpId the id of the health professional
    * @param after the date after which it should look for availabilities
    */
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

      // = Process working days by batch of 5
      do {
         HealthProfessionalService.cleanDates(after);

         // = Retrieve the next 5 working days to process
         const rangeDates = HealthProfessionalService.getRangeDates(
            after,
            hpAvailabilities,
         );
         const lastDate = rangeDates.at(-1);

         // = Get the events already planned during those 5 days
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

         // = Process each day and verify if there is an availability
         dates: for (let i = 0; i < rangeDates.length; i++) {
            const date = rangeDates[i];
            const dateKey = HealthProfessionalService.getDateKey(date);
            const dayAvailabilities = hpAvailabilities.get(date.getDay());
            const dayEvents = daysEvents.get(dateKey);

            // = If no events planned, specify the entire day is available
            if (!dayEvents?.length) {
               availability = {
                  startAt: new Date(`${dateKey} ${dayAvailabilities.from}`),
                  endAt: new Date(`${dateKey} ${dayAvailabilities.to}`),
               };

               break;
            }

            // = Process the events of the day
            for (let j = 0; j < dayEvents.length; j++) {
               const event = dayEvents[j];
               const fromAvailability = new Date(
                  `${dateKey} ${dayAvailabilities.from}`,
               );

               // = Verify if there is an availability before that event
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

               // = If last event, verify if there is an availability after
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

   /**
    * Get a specific health professional with, optionally, its day-to-day availabilities and events
    *
    * @param hpId the id of the health professional
    * @param includeAvailabilities if it should include the day-to-day availabilities
    * @param from include events after that date
    * @param to include events before that date
    * @private
    */
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

   /**
    * Get the next dates a health professional could have availabilities
    *
    * @param after the date after which it should get the next dates
    * @param hpAvailabilities the day-to-day availabilities of a health professional
    * @param pick the amount of dates to pick, default 5
    * @private
    */
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
