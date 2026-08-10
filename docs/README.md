# FitStudy Systeemhandleiding

FitStudy is een webapplicatie die studenten ondersteunt bij studieplanning, voortgang en welzijn.  
De applicatie biedt aparte dashboards voor studenten, docenten en administrators.

Deze README dient als systeemhandleiding voor het FitStudy-project.  
Hierin staat hoe het project technisch is opgebouwd, welke technologieën worden gebruikt en hoe de applicatie lokaal gestart kan worden.

---

## Inhoud

- Projectoverzicht
- Functies
- Gebruikersrollen
- Tech stack
- Projectstructuur
- Lokale installatie
- Environment variables
- Database
- Backend/API
- Frontend
- Documentatie
- Deployment
- Veiligheid
- Veelvoorkomende problemen

---

## Projectoverzicht

FitStudy bestaat uit drie hoofdonderdelen:

```text
fitstudy/
├── api/
├── web/
└── docs/
```

Elke folder heeft een eigen functie:

| Folder | Functie |
|---|---|
| `api` | Backend/API van de applicatie |
| `web` | Frontend/webapplicatie |
| `docs` | Documentatiewebsite |

De onderdelen werken samen volgens een client-server architectuur.

```text
Gebruiker
   ↓
Frontend / Webapplicatie
   ↓
API / Backend
   ↓
Database / Neon PostgreSQL
```

De gebruiker werkt in de browser.  
De frontend stuurt requests naar de backend.  
De backend verwerkt deze requests en haalt gegevens op uit de database of slaat nieuwe gegevens op.

---

## Functies

FitStudy bevat onder andere de volgende functies:

- inloggen met accountgegevens;
- automatisch doorsturen naar het juiste dashboard;
- studentdashboard;
- docentdashboard;
- admin dashboard;
- planning en taken;
- studieprogramma;
- focustimer;
- voortgangsoverzicht;
- welzijnsregistratie;
- notificaties;
- beheer van studenten;
- beheer van docenten;
- roosterbeheer;
- feedback en mededelingen.

---

## Gebruikersrollen

FitStudy gebruikt verschillende rollen.  
Elke rol krijgt toegang tot eigen onderdelen van de applicatie.

### Student

De student gebruikt FitStudy om studieactiviteiten te plannen en voortgang te volgen.

Een student kan onder andere:

- planning bekijken;
- taken bekijken;
- studieprogramma bekijken;
- focussessies starten;
- welzijn registreren;
- notificaties ontvangen;
- voortgang bekijken;
- mijlpalen bekijken.

### Docent

De docent gebruikt FitStudy om studenten te begeleiden.

Een docent kan onder andere:

- studenten bekijken;
- roosters bekijken;
- vakprogramma’s beheren;
- opdrachten plaatsen;
- beoordelingen invoeren;
- welzijnsinformatie bekijken;
- feedback en mededelingen versturen.

### Admin

De admin beheert de applicatie en de gebruikersgegevens.

Een admin kan onder andere:

- statistieken bekijken;
- studenten beheren;
- docenten beheren;
- roosters beheren;
- mededelingen beheren;
- gebruikersaccounts controleren.

---

## Tech stack

FitStudy is opgebouwd met moderne webtechnologieën.

| Onderdeel | Technologie |
|---|---|
| Backend | Express |
| Backend taal | TypeScript |
| Database | Neon PostgreSQL |
| ORM | Drizzle |
| Authenticatie | Better Auth |
| Frontend | React |
| Build tool | Vite |
| Routing | TanStack Router |
| Data fetching | TanStack Query |
| UI | shadcn/ui |
| Documentatie | Astro Starlight |
| Package manager | pnpm |
| Deployment | Render |

---

## Projectstructuur

De hoofdstructuur van het project is als volgt:

```text
fitstudy/
├── api/
│   ├── src/
│   ├── drizzle/
│   ├── scripts/
│   ├── package.json
│   ├── drizzle.config.ts
│   └── .env.example
│
├── web/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── docs/
    ├── src/
    ├── public/
    ├── package.json
    ├── astro.config.mjs
    └── README.md
```

### api

De `api` folder bevat de backend van FitStudy.  
Hier staan de routes, databaseverbinding, authenticatie en services.

Belangrijke onderdelen zijn:

```text
api/src/
├── db/
├── lib/
├── routes/
├── services/
├── auth.ts
└── index.ts
```

### web

De `web` folder bevat de frontend van FitStudy.  
Hier staan de pagina’s, componenten en frontendlogica.

Belangrijke onderdelen zijn:

```text
web/src/
├── components/
├── integrations/
├── lib/
├── routes/
├── router.tsx
└── styles.css
```

### docs

De `docs` folder bevat de documentatiewebsite.  
Hierin staat vooral de gebruikershandleiding.

Belangrijke onderdelen zijn:

```text
docs/src/
├── assets/
└── content/
    └── docs/
```

---

## Lokale installatie

Voor het lokaal draaien van FitStudy zijn de volgende onderdelen nodig:

- Node.js;
- pnpm;
- toegang tot de database;
- een `.env` bestand in de `api` folder.

### Project downloaden

Clone eerst het project vanaf GitHub:

```bash
git clone https://github.com/riechamohab/fitstudy.git
cd fitstudy
```

### Dependencies installeren

Installeer de dependencies per folder.

Backend:

```bash
cd api
pnpm install
```

Frontend:

```bash
cd ../web
pnpm install
```

Documentatie:

```bash
cd ../docs
pnpm install
```

---

## Environment variables

De backend heeft een `.env` bestand nodig.

Maak in de `api` folder een bestand aan met de naam:

```text
.env
```

Gebruik de `.env.example` als voorbeeld.

Voorbeeld:

```env
DATABASE_URL=plaats_hier_de_neon_database_url
BETTER_AUTH_SECRET=plaats_hier_de_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

### Uitleg

| Variable | Functie |
|---|---|
| `DATABASE_URL` | Verbindingslink naar de Neon database |
| `BETTER_AUTH_SECRET` | Secret key voor Better Auth |
| `BETTER_AUTH_URL` | URL waarop de backend draait |

Plaats nooit echte database URLs of secrets in GitHub.

---

## Database

FitStudy gebruikt **Neon PostgreSQL** als database.

De database wordt gebruikt voor het opslaan van onder andere:

- gebruikersaccounts;
- sessies;
- rollen;
- studenten;
- docenten;
- taken;
- roosters;
- studieprogramma’s;
- welzijnsregistraties;
- notificaties;
- voortgangsgegevens.

De frontend maakt geen directe verbinding met de database.  
Alle databaseverzoeken lopen via de backend/API.

### Migraties uitvoeren

Wanneer de database nog niet is ingericht, moeten de migraties worden uitgevoerd vanuit de `api` folder.

```bash
cd api
pnpm exec drizzle-kit migrate
```

Hiermee worden de benodigde tabellen aangemaakt in Neon.

---

## Backend/API

De backend staat in de `api` folder.

De backend wordt lokaal gestart met:

```bash
cd api
pnpm dev
```

De backend draait lokaal op:

```text
http://localhost:3000
```

### Health check

De backend bevat een health check route.

Deze route wordt gebruikt om snel te controleren of de API actief is.

```text
http://localhost:3000/api/health
```

Wanneer de backend goed draait, geeft deze route een response terug.  
Dit is handig tijdens lokaal testen en deployment.

### Functie van de backend

De backend zorgt onder andere voor:

- login en sessiebeheer;
- ophalen en opslaan van gebruikersgegevens;
- verwerken van taken en planning;
- ophalen van roosters en vakken;
- opslaan van welzijnsregistraties;
- versturen en ophalen van notificaties;
- verbinden met de Neon database.

---

## Frontend

De frontend staat in de `web` folder.

De frontend wordt lokaal gestart met:

```bash
cd web
pnpm dev
```

De frontend draait lokaal meestal op:

```text
http://localhost:3001
```

De frontend is het deel dat de gebruiker ziet in de browser.

Via de frontend kunnen studenten, docenten en admins de applicatie gebruiken.  
De frontend stuurt requests naar de backend om gegevens op te halen of op te slaan.

---

## Documentatie

De documentatiewebsite staat in de `docs` folder.

De documentatie wordt lokaal gestart met:

```bash
cd docs
pnpm dev
```

De documentatie draait lokaal meestal op:

```text
http://localhost:4321
```

In de documentatiewebsite staat de gebruikershandleiding van FitStudy.

De gebruikershandleiding bevat uitleg voor:

- het inlogscherm;
- het studentdashboard;
- het docentdashboard;
- het admin dashboard.

---

## Deployment

FitStudy kan online geplaatst worden via **Render**.

De applicatie bestaat uit meerdere onderdelen:

| Onderdeel | Deployment |
|---|---|
| `api` | Backend service |
| `web` | Frontend webapplicatie |
| `docs` | Documentatiewebsite |
| Neon | Externe database |

Bij deployment moeten de juiste environment variables worden ingesteld in Render.

Belangrijke instellingen zijn:

- root folder;
- build command;
- start command;
- environment variables;
- backend URL;
- frontend URL;
- toegestane origins voor authenticatie.

De database blijft draaien via Neon.  
Render maakt via `DATABASE_URL` verbinding met deze database.

---

## Veiligheid

Binnen FitStudy zijn een aantal beveiligingspunten belangrijk:

- wachtwoorden worden niet als gewone tekst opgeslagen;
- authenticatie gebeurt via Better Auth;
- databasegegevens worden opgeslagen in Neon;
- secrets worden bewaard in `.env` bestanden of Render environment variables;
- echte secrets mogen niet in GitHub geplaatst worden;
- studenten en docenten kunnen bepaalde profielgegevens niet zelf wijzigen;
- toegang tot dashboards hangt af van de rol van de gebruiker.

Belangrijke bestanden zoals `.env` mogen nooit worden gecommit.

---

## Veelvoorkomende problemen

### Backend start niet

Controleer of de dependencies zijn geïnstalleerd:

```bash
cd api
pnpm install
```

Controleer ook of het `.env` bestand bestaat en correct is ingevuld.

### Database connection failed

Dit betekent meestal dat de backend geen verbinding kan maken met Neon.

Controleer:

- of `DATABASE_URL` correct is;
- of de database actief is;
- of de migraties zijn uitgevoerd.

### Frontend kan geen gegevens ophalen

Controleer of de backend actief is op:

```text
http://localhost:3000
```

Controleer ook of de frontend naar de juiste API URL verwijst.

### Login werkt niet

Controleer:

- of de backend draait;
- of `BETTER_AUTH_SECRET` is ingevuld;
- of `BETTER_AUTH_URL` correct is;
- of de gebruiker bestaat in de database.

### Port is already in use

Wanneer een poort al in gebruik is, kiest Vite soms automatisch een andere poort.

Voorbeeld:

```text
Port 3000 is in use, trying another one...
Local: http://localhost:3001
```

Dit is normaal. Gebruik dan de link die in de terminal wordt getoond.

---

## Samenvatting

FitStudy is opgebouwd uit drie aparte onderdelen:

```text
api  = backend
web  = frontend
docs = documentatie
```

De frontend communiceert met de backend.  
De backend communiceert met de Neon database.  
De documentatie legt uit hoe de applicatie gebruikt en beheerd wordt.

Deze structuur maakt FitStudy overzichtelijker, veiliger en makkelijker te onderhouden.