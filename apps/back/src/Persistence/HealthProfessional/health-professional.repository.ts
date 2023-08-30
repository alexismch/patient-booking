import { Injectable } from '@nestjs/common';
import { PrismaService } from '../Prisma';
import { Prisma } from '.prisma/client';

@Injectable()
export class HealthProfessionalRepository {
   private model: Prisma.HealthProfessionalDelegate;

   constructor(prismaService: PrismaService) {
      this.model = prismaService.healthProfessional;
   }

   async getById(
      id: number,
      options: {
         include?: {
            availabilities?: boolean;
            events?: boolean | { from: Date; to?: Date };
         };
      } = {},
   ) {
      return this.model.findUnique({
         where: {
            id,
         },
         include: {
            availabilities: options?.include?.availabilities,
            events:
               typeof options?.include?.events === 'boolean'
                  ? options?.include?.events
                  : {
                       where: {
                          OR: [
                             {
                                from: {
                                   gt: options?.include?.events?.from,
                                   lt: options?.include?.events?.to,
                                },
                             },
                             {
                                to: {
                                   gt: options?.include?.events?.from,
                                   lt: options?.include?.events?.to,
                                },
                             },
                          ],
                       },
                    },
         },
      });
   }
}
