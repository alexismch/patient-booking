import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
   await prisma.healthProfessional.upsert({
      where: { name: 'Antoine Pairet' },
      create: {
         name: 'Antoine Pairet',
         availabilities: {
            createMany: {
               data: [
                  {
                     day: 0,
                     from: '9:30',
                     to: '20:00',
                  },
                  {
                     day: 1,
                     from: '9:30',
                     to: '20:00',
                  },
               ],
            },
         },
         events: {
            createMany: {
               data: [
                  {
                     name: "AP's 1st event",
                     from: new Date('2023-09-04 12:00'),
                     to: new Date('2023-09-04 16:00'),
                     bookedOn: new Date(),
                  },
                  {
                     name: "AP's 2nd event",
                     from: new Date('2023-09-05 09:00'),
                     to: new Date('2023-09-05 11:00'),
                     bookedOn: new Date(),
                  },
                  {
                     name: "AP's 3rd event",
                     from: new Date('2023-09-05 18:00'),
                     to: new Date('2023-09-05 20:00'),
                     bookedOn: new Date(),
                  },
               ],
            },
         },
      },
      update: {},
   });
}

async function main() {
   try {
      await seed();
   } finally {
      await prisma.$disconnect();
   }
}

main();
