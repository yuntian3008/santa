# Santa Game - Real-Time Guessing Game

A real-time multiplayer web application for playing a guessing game where players provide anonymous clues to help guess gifts and gift-givers.

## Tech Stack

- **Backend**: Bun + Socket.io + TypeScript
- **Frontend**: Vite + React + TailwindCSS + Shadcn UI
- **Deployment**: Backend on EC2 (Docker), Frontend on Cloudflare Pages

## Project Structure

```
santa/
├── backend/          # Bun + Socket.io server
├── frontend/         # React + Vite application
└── package.json      # Monorepo workspace config
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) (for backend)
- [Node.js](https://nodejs.org/) (for frontend)
- [Docker](https://www.docker.com/) (for deployment)

### Setup

1. **Install dependencies**:
   ```bash
   # Backend
   cd backend
   bun install
   
   # Frontend
   cd frontend
   npm install
   ```

2. **Run development servers**:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

### Environment Variables

#### Backend (backend/.env)
```
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (frontend/.env)
```
VITE_SOCKET_URL=http://localhost:3001
```

## Deployment

### Backend (EC2 with Docker)

1. **Build Docker image**:
   ```bash
   npm run docker:build
   ```

2. **Run container**:
   ```bash
   npm run docker:run
   ```

3. **Deploy to EC2**:
   - Push image to registry (ECR/Docker Hub)
   - Pull and run on EC2 instance
   - Configure nginx as reverse proxy
   - Setup SSL with Let's Encrypt

### Frontend (Cloudflare Pages)

1. **Build static site**:
   ```bash
   npm run build:frontend
   ```

2. **Deploy to Cloudflare Pages**:
   - Connect GitHub repository
   - Build command: `cd frontend && npm install && npm run build`
   - Build output directory: `frontend/dist`
   - Environment variable: `VITE_SOCKET_URL=https://your-backend-url.com`

## Game Rules

- Maximum 30 players with unique Vietnamese animal names
- Players propose rounds and vote (≥50% approval to start)
- 10-second countdown for anonymous answers
- Results aggregated and displayed anonymously
- Reconnection within 1 minute preserves player identity

## Features

- Real-time synchronization with Socket.io
- Player reconnection with UUID persistence
- Unique animal name pool management
- State machine: WAITING → VOTING → ANSWERING → RESULTS
- Vietnamese language UI with Shadcn components
