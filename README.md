# DataNexus AI

Intelligent Role-Based Data Aggregation Platform

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, Recharts, Framer Motion
- **Backend:** Node.js, Express.js, JWT, bcrypt, Swagger
- **Database:** PostgreSQL 15.4
- **AI:** Groq API, Llama 3.3 70B

## Features
- Role-Based Access Control (Admin, Analyst, Viewer)
- AI natural language to SQL with conversation memory
- Silent audit logging middleware
- Query scheduler with node-cron
- XLSX and JSON export
- Swagger API documentation at /api/docs

## Setup
1. Clone the repository
2. Add your `.env` file in the backend folder
3. Run `npm install` in both backend and frontend folders
4. Run `psql -U postgres -d datanexus -f src/database/schema.sql`
5. Run `node src/database/seed.js`
6. Run `npm run dev` in backend
7. Run `npm start` in frontend

## Demo Credentials
- Admin: admin@datanexus.com / password123
- Analyst: analyst@datanexus.com / password123
- Viewer: viewer@datanexus.com / password123