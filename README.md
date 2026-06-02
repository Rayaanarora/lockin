# LOCKIN

Mobile-first mission app for students who want fewer group chats and more real-world execution.

## Stack

- Frontend: Next.js, React, Tailwind CSS, Framer Motion
- Backend: Node.js, Express
- Database: MySQL

## Project Structure

```text
frontend/   Next.js PWA-style mobile web app
backend/    Express API, MySQL config, routes, controllers
```

## Database Setup

1. Create a MySQL database:

```sql
CREATE DATABASE lock_in_db;
```

2. Run the schema and seed files:

```bash
mysql -u root -p < backend/db/schema.sql
mysql -u root -p lock_in_db < backend/db/seed.sql
```

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Default API URL: `http://localhost:4000/api`

## Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Default app URL: `http://localhost:3000`

## Environment Variables

Backend:

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lock_in_db
DB_PORT=3306
FRONTEND_URL=http://localhost:3000
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Deployment Notes

- Deploy `frontend` to Vercel.
- Deploy `backend` to Railway.
- Use Railway MySQL or any managed MySQL provider.
- Set `NEXT_PUBLIC_API_URL` in Vercel to your Railway API URL plus `/api`.
- Set Railway backend env vars to your production MySQL credentials and Vercel frontend URL.
