# Demo NestCLS Transacional - Unit Of Work - Transaction In Nestjs Made Easy

Since I started creating automated tests back in 2022, specifically with integration tests, one of the hardest experiences I had was with Node.js, while the best one was with C#/.NET. However, recently I found a way to solve this pain when using Node.js, and I created a small demo focused on integration tests to see how it works.

## What is this app?

It's a simple API where a user can reserve a parking slot, mark that they have finished using the reservation they made, and for every action the user performs, an outbox event is created. Later on, this event is consumed by the cron job, which does something with the events — in our case, it just logs them.

## General Flow

```mermaid
sequenceDiagram
autonumber
    box Sync Process
        participant User
        participant API.ReserveParkingSlot
    end

    User->>API.ReserveParkingSlot: Try to reserve parking slot
    API.ReserveParkingSlot->>Database: Reserve Parking Slot and create outbox event
    API.ReserveParkingSlot->>User: Returns the response
    box green Async Processs
        participant CRON
        participant Database
    end


    CRON-->Database: Get outbox events to process
    CRON->>Database: Save the outbox after try to process it

```

## How to run?

This project is only focused to run with tests to do with you need to have Docker installed

```
npm run test
npm run test:e2e
```

## Warnings

1. Until this moment, I haven't found a good way to test concurrency scenarios because `nest-cls-transactional` is smart enough to wrap everything inside the same transaction. Due to that, to test concurrency scenarios, I used `TestContainers` in e2e tests
2. With this code, we are creating a new container for each integration test file, but we can change it to use the same container. Since everything is automatically rolled back, it won't be a problem and can improve test speed, as we will only need one PostgreSQL container.
