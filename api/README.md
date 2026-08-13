# FitStudy API

The FitStudy API is the backend of the FitStudy application. It handles authentication, user roles, dashboard data, schedules, tasks, wellbeing data, feedback, notes and notifications.

The API connects the frontend application to the Neon PostgreSQL database. The frontend does not communicate directly with the database. All data requests go through the API.

## Tech Stack

The API uses the following technologies:

- Node.js as the runtime environment
- Express as the backend framework
- TypeScript for type-safe development
- Drizzle ORM for database queries and migrations
- Neon PostgreSQL as the database
- Better Auth for authentication and session management
- pnpm as package manager

## Prerequisites

Before running the API locally, make sure the following are installed:

- Node.js
- pnpm
- Git
- Access to a Neon PostgreSQL database

The API also requires an `.env` file inside the `api` folder. This file contains the database connection and authentication settings.

Example environment variables:

DATABASE_URL=your_neon_database_url
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

Real secrets should never be committed to GitHub.

## Installation instructions

Go to the API folder:

cd api

Install the dependencies:

pnpm install

Run the database migrations:

pnpm exec drizzle-kit migrate

The migrations create the required database tables in Neon PostgreSQL.

## Usage instructions

Start the API in development mode:

pnpm dev

The API runs locally on:

http://localhost:3000

The API contains a health check endpoint that can be used to check if the backend is running:

http://localhost:3000/api/health

## Main responsibilities

The API is responsible for:

- user login and authentication
- session management
- role-based access for students, teachers and administrators
- retrieving and storing user data
- managing tasks and schedules
- storing wellbeing registrations
- retrieving teacher notes and feedback
- handling notifications
- connecting with the Neon PostgreSQL database