# FitStudy Web

FitStudy Web is the frontend application of FitStudy. It is the part of the system that users see and interact with in the browser.

The frontend provides separate dashboards for students, teachers and administrators. Each role has access to different pages and functions.

## Tech Stack

The web application uses the following technologies:

- React for building the user interface
- Vite for frontend development and build tooling
- TanStack Start for the web application setup
- TanStack Router for routing between pages
- TanStack Query for fetching and managing API data
- TypeScript for type-safe development
- shadcn/ui for interface components
- pnpm as package manager

## Prerequisites

Before running the web application locally, make sure the following are installed:

- Node.js
- pnpm
- Git

The FitStudy API must also be running locally, because the frontend communicates with the backend to retrieve and store data.

The API should run on:

http://localhost:3000

## Installation instructions

Go to the web folder:

cd web

Install the dependencies:

pnpm install

## Usage instructions

Start the web application in development mode:

pnpm dev

The frontend usually runs locally on:

http://localhost:3001

If port 3000 is already in use by the API, Vite may automatically choose another port. In that case, use the local URL shown in the terminal.

## Main features

The web application includes dashboards for three main user roles.

Students can:

- view their planning
- view their study programme
- use the focus timer
- register wellbeing
- view progress
- receive notes and notifications

Teachers can:

- view students
- view schedules
- manage subject programmes
- send feedback and notes
- view wellbeing information

Administrators can:

- manage students
- manage teachers
- manage schedules
- send announcements
- view system statistics