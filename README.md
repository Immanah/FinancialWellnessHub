
# NeuroBank - Financial Wellness Platform

NeuroBank is a modern financial wellness platform that combines traditional banking features with AI-powered insights and emotional well-being tracking. The application helps users manage their finances while considering their emotional state and financial goals.

## Features

- **AI Financial Assistant**: Get personalized financial advice using advanced AI
- **Mood Tracking**: Monitor your emotional state in relation to financial decisions
- **Goal Setting**: Set and track financial goals with intelligent suggestions
- **Journal Entries**: Record financial reflections and track spending patterns
- **Account Management**: View and manage multiple financial accounts
- **Security**: Enhanced security features including protected routes and session management

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API
- **Authentication**: Passport.js
- **State Management**: React Query
- **Routing**: Wouter

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:


4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Application pages
│   │   └── App.tsx      # Main application component
├── server/               # Backend Express application
│   ├── auth.ts          # Authentication logic
│   ├── routes.ts        # API routes
│   └── openai.ts        # AI integration
└── shared/              # Shared types and schemas

## Features in Detail

### AI Financial Assistant
- Personalized financial advice
- Context-aware responses based on user's financial state
- Natural language interaction

### Mood Tracking
- Track emotional state in relation to finances
- Visual mood patterns
- Correlation with spending habits

### Financial Goals
- Set and monitor savings goals
- Progress tracking
- AI-powered suggestions

## Security

- Protected routes using custom authentication
- Secure session management
- Environment variable protection
- Data encryption

## Database Schema

The application uses PostgreSQL with Drizzle ORM for:
- User accounts
- Financial transactions
- Savings goals
- Journal entries
- Mood tracking data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
