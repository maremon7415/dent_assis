# Dent-Assist

Dent-Assist is an AI-powered Dental Assistant web application designed to streamline appointment booking, notifications, and dental health management.

## Features

- **User Authentication**: Secure signup and login powered by [Clerk](https://clerk.com/).
- **AI Voice Assistant**: Integrated voice capabilities using [Vapi AI](https://vapi.ai/).
- **Appointment Management**: Patients can book, view, and cancel appointments.
- **Automated Email Notifications**: Beautifully designed emails for welcome, appointment confirmations, reminders (24h/1h), and admin notifications, powered by [Resend](https://resend.com/) and [React Email](https://react.email/).
- **Admin Dashboard**: Comprehensive overview of appointments and platform statistics.
- **Modern UI**: Built with [Tailwind CSS v4](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) components for a responsive, accessible, and stunning user interface.
- **Database**: PostgreSQL database hosted on [Neon](https://neon.tech/) and managed with [Prisma ORM](https://www.prisma.io/).

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI)
- **Database ORM**: Prisma
- **Authentication**: Clerk
- **Emails**: Resend + React Email
- **AI Integration**: Vapi AI
- **Form validation**: React Hook Form + Zod
- **Code Quality**: Biome (Linter & Formatter)

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- API keys for Clerk, Resend, and Vapi AI.

### Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Database
DATABASE_URL=your_postgresql_database_url

# Vapi AI
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id

# Resend Emails
RESEND_API_KEY=your_resend_api_key
ADMIN_EMAIL=your_admin_email_address

# App URL for absolute links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Push the Prisma schema to your database:
   ```bash
   npx prisma db push
   ```
3. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

### Running the Development Server

Start the development server using Turbopack for faster builds:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

- `src/app`: Next.js App Router pages and API route handlers.
- `src/components`: UI components, including shadcn/ui components (`src/components/ui`) and specific sections (landing, dashboard, emails).
- `src/lib`: Utility functions, Prisma client, and Resend instance.
- `prisma`: Prisma schema (`schema.prisma`).

## Scripts

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Generates the Prisma client and builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs Biome to check for linting errors.
- `npm run format`: Runs Biome to format the codebase.
