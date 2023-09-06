# PatientBooking

This project has been created by using those technologies:

-  [Nx](https://nx.dev) as mono-repository manager
-  [NestJS](https://nestjs.com/) as API framework
-  [Prisma](https://www.prisma.io/client) as ORM

Those utilities have also been used:

-  [SWC](https://swc.rs/) as compiler
-  [Husky](https://typicode.github.io/husky/) as Git hooks listener
-  [Commit lint](https://commitlint.js.org/#/) as commit convention helper

## Running tasks

First, start, sync & seed the database:

```
docker-compose up

yarn prisma db push

yarn prisma db seed
```

Then, prepare the env by duplicating `.env.example` to `.env`

Finally, start the API:

```
yarn start back
```

It will run by default on port `3000`

## Execute queries

### Retrieve the list of availabilities in a given period

It will return a list of availabilities between `from` & `to` values

If no `to` param specified, it will return those of the `from` day

If none specified, it will return those of the current day

```http request
## Request
GET /health-professionals/1/availabilities
    ?from=2023-09-11
    &to=2023-09-20
    HTTP/1.1
Host: localhost:3000
```

```json5
// Response
[
   {
      startAt: '2023-09-11T07:30:00.000Z',
      endAt: '2023-09-11T10:00:00.000Z',
   },
   {
      startAt: '2023-09-11T14:00:00.000Z',
      endAt: '2023-09-11T18:00:00.000Z',
   },
   {
      startAt: '2023-09-12T09:00:00.000Z',
      endAt: '2023-09-12T16:00:00.000Z',
   },
   {
      startAt: '2023-09-18T07:30:00.000Z',
      endAt: '2023-09-18T18:00:00.000Z',
   },
   {
      startAt: '2023-09-19T07:30:00.000Z',
      endAt: '2023-09-19T18:00:00.000Z',
   },
]
```

### Retrieve the next availability

It will return the first availability during or after `date`

If no `date` param specified, it will return the one during or after the current day

```http request
## Request
GET /health-professionals/1/availabilities/next
    ?date=2023-09-12
    HTTP/1.1
Host: localhost:3000
```

```json5
{
   startAt: '2023-09-12T09:00:00.000Z',
   endAt: '2023-09-12T16:00:00.000Z',
}
```

> ⚠️ **Note that the returned dates are in UTC**
