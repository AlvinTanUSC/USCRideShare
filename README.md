# USC RideShare - Trojan Rides

A rideshare platform for USC students to connect and share rides to popular destinations (LAX, BUR, ONT, Union Station).

## Project Structure

```
USCRideShare/
├── backend/          # Spring Boot backend
├── frontend/         # React frontend
└── README.md
```

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL (Supabase)
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18+ (Vite)
- **Language**: JavaScript
- **Styling**: Tailwind CSS
- **Router**: React Router DOM
- **HTTP Client**: Axios

## Features

### Current Implementation
- ✅ Real Google OAuth 2.0 integration (ID token verification)
- ✅ @usc.edu email domain enforcement
- ✅ JWT-based authentication with server-issued tokens
- ✅ Create ride listings (requires authentication)
- ✅ Browse rides with filters (destination, date, time) — public endpoint
- ✅ View ride details
- ✅ Time flexibility matching
- ✅ Mobile-responsive design

### Future Features
- ❌ Request/Match system
- ❌ In-app messaging
- ❌ Email notifications
- ❌ Refresh token rotation
- ❌ OAuth scopes for profile picture/calendar access

## Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL database (Supabase account)
- Maven
- Google Cloud Project with OAuth 2.0 credentials

## Setup Instructions

### 0. Google OAuth Setup (Required)

1. Create a Google Cloud Project
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project

2. Enable Google+ API
   - Search for "Google+ API" and enable it

3. Create OAuth 2.0 Credentials
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Choose "Web application"
   - Add Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:5174` (if testing on alternate port)
     - `http://127.0.0.1:5173` and `http://127.0.0.1:5174` (recommended)
     - Your production frontend URL later
   - Copy the **Client ID** (you will not need the Client Secret for this flow)

4. Configure OAuth Consent Screen
   - OAuth consent screen → choose "External" user type
   - Fill in app name, user support email, required scopes
   - Add yourself as a test user (required for testing mode)
   - Scopes: `openid`, `email`, `profile`

### 1. Database Setup (Supabase)

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. The tables should already be created based on the schema:
   - `users`
   - `rides`
   - `matches`
   - `messages`

### 2. Backend Setup

```bash
cd backend

# Create .env file with required environment variables
cat > .env << EOF
DATABASE_URL=jdbc:postgresql://your-db-url:5432/rideshare
DB_USERNAME=postgres
DB_PASSWORD=your-password
JWT_SECRET=your-secure-secret-key-at-least-256-bits-for-hs512
JWT_EXPIRATION_MS=86400000
EOF

# Or export environment variables directly
export DATABASE_URL=jdbc:postgresql://...
export DB_USERNAME=...
export DB_PASSWORD=...

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend

# Create .env file with your Google Client ID
cat > .env << EOF
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
EOF

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Authentication

- `POST /api/auth/google` - Verify Google ID token and issue JWT
  - Body: `{ "idToken": "<Google ID token>" }`
  - Response: `{ "token": "<JWT>", "error": null }`
  - Returns 401 if: token invalid, email not verified, or not @usc.edu domain

### Rides

- `POST /api/rides` - Create a new ride (requires JWT)
  - Headers: `Authorization: Bearer <JWT>`
  - Body: RideRequest JSON
  - Returns 401 if missing/invalid JWT

- `GET /api/rides` - Get all active rides (public, no auth required)
  - Query params: `destination`, `date`, `time` (optional)

- `GET /api/rides/{id}` - Get ride by ID (public, no auth required)

## Development Notes

### Authentication Flow

1. **Frontend:** User clicks "Sign in with Google" → Google Identity Services renders sign-in button
2. **User:** Signs in with @usc.edu Google account → Google returns ID token
3. **Frontend:** Sends ID token to backend: `POST /api/auth/google`
4. **Backend:** Verifies token with Google's tokeninfo endpoint
5. **Backend:** Confirms `email_verified=true` and `email` ends with `@usc.edu`
6. **Backend:** Creates/retrieves user in database, issues server-signed JWT
7. **Frontend:** Stores JWT in localStorage, attaches to subsequent API requests
8. **Protected endpoints:** Validate JWT before processing (POST/PUT/DELETE require auth; GET public)

### Security
- JWT is signed with HS512 using a server secret key
- Client Secret is kept secure (not exposed in frontend code)
- All protected API endpoints validate JWT before execution
- Only @usc.edu emails are allowed
- Email must be verified by Google (email_verified=true)

### Time Filtering
The time filter respects ride flexibility:
- Exact matches: rides at the specified time
- Flexible matches: rides within ±timeFlexibilityMinutes of filter time

### Validation
- Frontend: Inline validation for better UX
- Backend: Server-side validation for security
- Both use the same rules for consistency

## Environment Variables

### Backend (application.yml or .env)
```yaml
DATABASE_URL=jdbc:postgresql://host:port/database
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
JWT_SECRET=your-secret-key-min-256-bits-for-hs512
JWT_EXPIRATION_MS=86400000  # 24 hours in milliseconds
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-oauth-client-id-from-google-cloud
```

**Security note:** Never commit `.env` files with real credentials. Use `.gitignore` and add to ignored patterns:
```
*.env
.env
.env.local
```

## Database Schema

### Users Table
- user_id (UUID, PK)
- email (unique, @usc.edu)
- first_name, last_name
- phone_number, profile_picture_url
- email_verified, verification_token
- created_at, last_login

### Rides Table
- ride_id (UUID, PK)
- user_id (FK → users)
- origin_location, destination
- departure_datetime
- flexible_time, time_flexibility_minutes
- max_passengers (1-3, default 2)
- cost_split_preference (EQUAL | BY_DISTANCE)
- notes (max 300 chars)
- status (ACTIVE | MATCHED | COMPLETED | CANCELLED)
- created_at, updated_at

## Testing

### Test Users
For development, you can use any @usc.edu email on the login page.

### Creating Test Rides
1. Login with a test email
2. Click "Post a Ride"
3. Fill in the form with:
   - Origin (e.g., "USC Village")
   - Destination (LAX, BUR, ONT, or Union Station)
   - Future date/time
   - Passengers, cost split preference
   - Optional: flexible time and notes

### Filtering Rides
1. Go to Browse Rides page
2. Use filters:
   - Destination dropdown
   - Date picker
   - Time input (respects flexibility)
3. Click Reset to clear filters

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Cloud Platform)
- Package: `mvn clean package`
- Deploy the JAR file to your preferred platform:
  - AWS EC2
  - Render
  - Railway
  - Fly.io

## Known Issues / TODOs

1. **User Management:** Implement `/api/me` endpoint to get current authenticated user profile
2. **Error Handling:** Add more specific error messages and proper exception handling
3. **Loading States:** Improve loading skeletons and spinners
4. **Mobile UX:** Test and improve mobile experience
5. **Email Notifications:** Implement email notifications for ride matches
6. **Profile Updates:** Allow users to update their profile information
7. **Ride Cancellation:** Implement proper ride cancellation workflow

## Contributing

This is a student project for USC. For questions or contributions, please contact the development team.

## License

MIT License - See LICENSE file for details
