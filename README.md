# FitStudy

FitStudy is a web application that supports students with study planning, progress tracking and wellbeing registration. The application provides separate dashboards for students, teachers and administrators.

The main purpose of FitStudy is to combine study organization and student guidance in one system. Students can manage their study activities and wellbeing, while teachers can monitor student progress and provide feedback or notes. Administrators manage the main data of the system, such as users, schedules and announcements.

## Components of the project

The FitStudy project consists of three main components:

- `web` - the frontend application used by students, teachers and administrators.
- `api` - the backend API that handles authentication, users, roles, schedules, tasks, notes, wellbeing data and notifications.
- `docs` - the documentation website that explains how the application can be used.

The components work together in a client-server architecture:

User  
↓  
Frontend / Web application  
↓  
API / Backend  
↓  
Database / Neon PostgreSQL  

The user works in the browser. The frontend sends requests to the backend. The backend processes these requests and retrieves data from the database or stores new data.

## Tech Stack

The project uses the following technologies:

- React for the frontend interface
- Vite for frontend development and build tooling
- TanStack Router for routing
- TanStack Query for data fetching
- Express for the backend API
- TypeScript for type-safe development
- Drizzle ORM for database interaction
- Neon PostgreSQL as the database
- Better Auth for authentication
- Astro Starlight for documentation
- pnpm as package manager
- Render for deployment

## Prerequisites

Before running the project locally, make sure the following are installed:

- Node.js
- pnpm
- Git
- Access to a Neon PostgreSQL database

The backend also requires environment variables in an `.env` file inside the `api` folder.

## Installation instructions

Clone the project from GitHub:

git clone https://github.com/riechamohab/fitstudy.git
cd fitstudy

Install the dependencies for each component.

Backend:

cd api
pnpm install

Frontend:

cd ../web
pnpm install

Documentation:

cd ../docs
pnpm install

## Usage instructions

Start the backend API:

cd api
pnpm dev

The backend runs locally on:

http://localhost:3000

Start the frontend application:

cd web
pnpm dev

The frontend usually runs locally on:

http://localhost:3001

Start the documentation website:

cd docs
pnpm dev

The documentation website usually runs locally on:

http://localhost:4321

## Deployment

The project is deployed using Render.

- Web application: Render web service or static deployment
- Documentation website: Render static site
- Database: Neon PostgreSQL

The database connection and authentication settings are configured through environment variables.