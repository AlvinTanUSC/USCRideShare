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
- ✅ User authentication (mock Google OAuth)
- ✅ Create ride listings
- ✅ Browse rides with filters (destination, date, time)
- ✅ View ride details
- ✅ Time flexibility matching
- ✅ Mobile-responsive design

### Future Features
- ❌ Real Google OAuth integration
- ❌ Request/Match system
- ❌ In-app messaging
- ❌ Email notifications

## Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL database (Supabase account)
- Maven

## Setup Instructions

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

# Configure database connection
# Edit src/main/resources/application.yml
# Set your Supabase connection details:
# - DATABASE_URL
# - DB_USERNAME
# - DB_PASSWORD

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL (already set in .env)
# VITE_API_URL=http://localhost:8080

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Rides

- `POST /api/rides` - Create a new ride
  - Headers: `X-User-Id: <uuid>`
  - Body: RideRequest JSON

- `GET /api/rides` - Get all active rides
  - Query params: `destination`, `date`, `time` (optional)

- `GET /api/rides/{id}` - Get ride by ID

## Development Notes

### Authentication
Currently using a mock authentication system for development:
- Login page accepts any @usc.edu email
- Stores mock user ID and token in localStorage
- Backend expects `X-User-Id` header

**TODO**: Replace with real Google OAuth 2.0

### Time Filtering
The time filter respects ride flexibility:
- Exact matches: rides at the specified time
- Flexible matches: rides within ±timeFlexibilityMinutes of filter time

### Validation
- Frontend: Inline validation for better UX
- Backend: Server-side validation for security
- Both use the same rules for consistency

## Environment Variables

### Backend (application.yml)
```yaml
DATABASE_URL=jdbc:postgresql://...
DB_USERNAME=postgres
DB_PASSWORD=...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080
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

1. **Authentication**: Replace mock auth with real Google OAuth

// TODO: add authentication for rides

2. **User Management**: Need `/api/me` endpoint to get current user
3. **Error Handling**: Add more specific error messages
4. **Loading States**: Improve loading skeletons
5. **Mobile UX**: Test and improve mobile experience
6. **Transport Method**: Field was removed (not in DB schema)

## Contributing

This is a student project for USC. For questions or contributions, please contact the development team.

## License

MIT License - See LICENSE file for details
