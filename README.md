# IIMB Samarpan - Social Impact Platform

![IIMB Samarpan](./attached_assets/IIM_Bangalore_Logo.svg_1756641864794.png)

A comprehensive enterprise-grade social volunteering platform designed for IIM Bangalore students to discover, apply for, and participate in meaningful social work opportunities.

## 🚀 Features

### For Students
- **Opportunity Discovery**: Browse curated volunteer opportunities with advanced filtering
- **Iterative Hour Submission**: Submit multiple hour entries per opportunity until completion
- **Gamified Engagement**: Earn coins based on hours contributed (flexible hourly rates starting from 1 coin/hr)
- **Progress Tracking**: Monitor applications, submitted hours, and real-time approval status
- **Leaderboard**: Compete with peers while maintaining privacy options
- **Profile Management**: Customize profile and privacy settings

### For Administrators
- **Opportunity Management**: Create, edit, and auto-close opportunities when hour targets are met
- **Application Review**: Review student applications and approve iterative hour submissions
- **Progress Analytics**: Real-time progress bars showing approved hours vs. total requirements
- **Smart Workflows**: Auto-closing activities when required hours are fulfilled
- **Enhanced Dashboard**: Track platform engagement with detailed completion metrics
- **User Management**: Oversee student accounts and platform activity

### Platform Features
- **Enterprise-Grade Design**: Professional IIMB-branded interface
- **Flexible Coin System**: Rewards based on actual time contributed (customizable coins/hr starting from 1)
- **Auto-Closing Activities**: Opportunities automatically close when hour requirements are fulfilled
- **Iterative Submissions**: Students can submit multiple hour entries until opportunity completion
- **Real-time Progress Tracking**: Live progress bars showing completion status
- **Role-Based Access**: Separate interfaces for students and administrators
- **Real-time Updates**: Live data synchronization across the platform
- **Mobile Responsive**: Optimized for all device sizes

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **shadcn/ui** component library built on Radix UI
- **Tailwind CSS** with custom IIMB design tokens
- **Vite** for fast development and optimized builds

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for full-stack type safety
- **Passport.js** with Replit OpenID Connect authentication
- **Session Management** with PostgreSQL storage

### Database & ORM
- **PostgreSQL** for relational data storage
- **Drizzle ORM** for type-safe database operations
- **Neon Serverless** PostgreSQL with connection pooling

## 📋 Prerequisites

Before setting up the project, ensure you have:
- Node.js 18+ installed
- PostgreSQL database access
- Replit account (for authentication)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
cd iimb-samarpan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=your_postgresql_connection_string
PGHOST=your_database_host
PGPORT=5432
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGDATABASE=your_database_name

# Session Security
SESSION_SECRET=your_session_secret_key

# Replit Authentication (automatically provided in Replit environment)
REPLIT_DOMAINS=your-replit-domain.replit.dev
REPL_ID=your_repl_id
ISSUER_URL=https://replit.com/oidc
```

### 4. Database Setup
```bash
# Push the database schema
npm run db:push
```

### 5. Seed Initial Data (Optional)
The application includes default admin and student accounts for testing:
- Admin: `admin@iimb.ac.in` (password: `iimb2024`)
- Student: `student@iimb.ac.in` (password: `iimb2024`)

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
iimb-samarpan/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── layout/     # Layout components (header, footer)
│   │   │   └── ...         # Feature-specific components
│   │   ├── pages/          # Application pages
│   │   │   ├── admin/      # Admin-only pages
│   │   │   ├── student/    # Student-specific pages
│   │   │   └── ...         # Shared pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   └── main.tsx        # Application entry point
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection configuration
│   ├── storage.ts         # Data access layer
│   ├── routes.ts          # API route definitions
│   ├── replitAuth.ts      # Authentication setup
│   └── index.ts           # Server entry point
├── shared/                 # Shared code between client and server
│   └── schema.ts          # Database schema and types
├── attached_assets/        # Project assets and documentation
├── package.json           # Project dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── vite.config.ts         # Vite build configuration
└── tsconfig.json          # TypeScript configuration
```

## 🎯 Key Concepts

### Enhanced Coin Reward System
- **Flexible Hourly Rates**: Customizable coins per hour (starting from 1, fully manual)
- **Iterative Accumulation**: Coins calculated from each approved hour submission
- **Auto-Capping**: Opportunities auto-close when hour requirements are met
- **Maximum Limits**: Each opportunity has a maximum coin cap
- **Display Format**: Shows as "XX coins/hr (max XX coins)"
- **Real-time Tracking**: Progress bars show completion status

### User Roles
- **Students**: Can browse opportunities, apply, and track progress
- **Administrators**: Can manage opportunities, review applications, assign hours

### Opportunity Types
- **Teaching**: Educational and tutoring opportunities
- **Donation**: Fundraising and charity drives
- **Mentoring**: Guidance and coaching roles
- **Community Service**: General volunteer work

### Enhanced Application Workflow
1. Student applies to opportunity
2. Admin reviews and accepts/rejects application
3. Student begins volunteer work and submits hours iteratively
4. Admin reviews and approves each hour submission
5. Multiple submissions allowed until opportunity completion
6. Opportunity auto-closes when total approved hours meet requirements
7. Student receives accumulated coins based on approved hours

## 🔐 Authentication

The platform uses Replit's OpenID Connect authentication with:
- Domain restriction to `@iimb.ac.in` emails
- Automatic role assignment based on email patterns
- Secure session management with PostgreSQL storage
- Refresh token handling for extended sessions

## 🎨 Design System

### Color Palette
- **Primary**: IIMB Red (`hsl(347, 85%, 47%)`)
- **Secondary**: IIMB Gold (`hsl(45, 90%, 58%)`)
- **Neutral**: IIMB Navy (`hsl(220, 26%, 14%)`)

### Typography
- **Primary Font**: Inter (sans-serif)
- **Heading Font**: Merriweather (serif)
- **Monospace**: JetBrains Mono

### Components
- Enterprise-grade component library with IIMB branding
- Consistent spacing, shadows, and animations
- Professional gradients and micro-interactions

## 📊 Database Schema

### Core Tables
- **users**: Student and admin profiles
- **opportunities**: Volunteer opportunities
- **applications**: Student applications to opportunities
- **badges**: Achievement badges
- **user_badges**: User badge assignments
- **sessions**: Authentication sessions

### Key Relationships
- Users can have many applications
- Opportunities belong to a creator (admin)
- Applications link users to opportunities
- Badges can be earned by multiple users

## 🧪 Testing

### Manual Testing
1. **Student Workflow**:
   - Login as student
   - Browse and filter opportunities
   - Apply to opportunities
   - Check dashboard for application status

2. **Admin Workflow**:
   - Login as admin
   - Create new opportunities
   - Review student applications
   - Assign completion hours and provide feedback

### Test Accounts
- Admin: `admin@iimb.ac.in` / `iimb2024`
- Student: `student@iimb.ac.in` / `iimb2024`

## 🚀 Production Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database schema push
npm run db:push

# Force database schema push (use with caution)
npm run db:push --force
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Refer to the deployment guide for common issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏫 About IIM Bangalore

Indian Institute of Management Bangalore (IIMB) is one of India's premier business schools, committed to excellence in management education and research. The Samarpan platform reflects IIMB's values of social responsibility and community engagement.

---

*Built with ❤️ by Rounak and Bharat for the IIM Bangalore community*
