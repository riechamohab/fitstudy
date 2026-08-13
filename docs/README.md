# FitStudy Documentation

The FitStudy documentation website contains the user documentation for the FitStudy application. It explains how students, teachers and administrators can use the system.

The documentation is separated from the main web application. This makes it easier to maintain the user guide and deploy it as a separate website.

## Tech Stack

The documentation website uses the following technologies:

- Astro as the documentation framework
- Starlight as the documentation theme
- Markdown and MDX for writing documentation pages
- pnpm as package manager
- Render for deployment

## Prerequisites

Before running the documentation website locally, make sure the following are installed:

- Node.js
- pnpm
- Git

No database connection is required for the documentation website.

## Installation instructions

Go to the docs folder:

cd docs

Install the dependencies:

pnpm install

## Usage instructions

Start the documentation website in development mode:

pnpm dev

The documentation website usually runs locally on:

http://localhost:4321

The documentation pages are located in:

docs/src/content/docs

## Documentation content

The documentation explains the main parts of the FitStudy application, including:

- the login screen
- the student dashboard
- the teacher dashboard
- the administrator dashboard
- common issues and troubleshooting
- known limitations
- version information
- glossary of terms

The purpose of the documentation is to help users understand how to use the application correctly.