# MongoDB QueryStats Web Application

A simple React/Node.js web application that connects to MongoDB and displays database collections and queryStats results in an interactive table format.

## Features

- **Database Connection**: Connects to MongoDB using settings from `settings.json`
- **Collection Browser**: View and browse all collections in your database
- **Data Table**: Interactive table with pagination, expandable cells, and sorting
- **QueryStats Execution**: Execute MongoDB queryStats command with optional filters
- **Real-time Data**: Live connection status and real-time data fetching
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

- **Backend**: Node.js/Express server with MongoDB driver
- **Frontend**: React application with modern UI components
- **Configuration**: JSON-based settings for easy deployment

## Prerequisites

- Node.js 18.x or later
- MongoDB database (local or cloud)
- npm or yarn package manager

## Installation

1. **Install server dependencies**:
   ```bash
   cd querystats/webapp
   npm install
   ```

2. **Install client dependencies**:
   ```bash
   npm run client:install
   # or manually:
   # cd client && npm install
   ```

3. **Configure database connection**:

   **Option 1 (Recommended): Use environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and set your MongoDB password
   MONGODB_PWD=your-actual-password
   ```

   The `settings.json` uses `<secret>` placeholder which gets replaced by `MONGODB_PWD`:
   ```json
   {
     "mongodb": {
       "uri": "mongodb+srv://user:<secret>@cluster.mongodb.net",
       "database": "your-database-name"
     }
   }
   ```

   **Option 2: Override entire URI**
   ```bash
   # Set the complete MongoDB URI in .env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net
   ```

## Usage

### Development Mode

Run both server and client in development mode:
```bash
npm run dev:all
```

This will start:
- Node.js server on `http://localhost:3001`
- React development server on `http://localhost:3000`

### Individual Services

**Start only the server**:
```bash
npm run dev
# or
npm start
```

**Start only the client**:
```bash
npm run client
```

### Production Mode

1. **Build the React app**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   NODE_ENV=production npm start
   ```

The production server will serve the React app and API from the same port.

## API Endpoints

The server provides the following REST API endpoints:

### Health Check
- **GET** `/api/health` - Server and database connection status

### Collections
- **GET** `/api/collections` - List all collections in the database

### Data Access
- **GET** `/api/data/:collection` - Get paginated data from a collection
  - Query params: `limit`, `skip`, `sort`, `order`

### QueryStats
- **POST** `/api/querystats` - Execute MongoDB queryStats command
  - Body: `{ "transformIdentifiers": {...} }`

### Search
- **POST** `/api/search/:collection` - Search/filter data in a collection
  - Body: `{ "query": {...}, "limit": 50, "skip": 0 }`

## Configuration

### settings.json

```json
{
  "mongodb": {
    "uri": "mongodb://localhost:27017",
    "database": "admin",
    "collection": "queryStats",
    "options": {
      "serverSelectionTimeoutMS": 10000,
      "connectTimeoutMS": 10000,
      "socketTimeoutMS": 30000
    }
  },
  "server": {
    "port": 3001,
    "cors": {
      "origin": "http://localhost:3000",
      "credentials": true
    }
  },
  "app": {
    "name": "MongoDB QueryStats Viewer",
    "version": "1.0.0"
  }
}
```

### Environment Variables

**Server Configuration:**
- `NODE_ENV` - Set to `production` for production builds
- `PORT` - Override server port (defaults to settings.json value)

**MongoDB Configuration:**
- `MONGODB_PWD` - MongoDB password (replaces `<secret>` in settings.json URI)
- `MONGODB_DATABASE` - Override database name from settings.json
- `MONGODB_URI` - Complete MongoDB URI (overrides settings.json URI entirely)

**Security:**
- `CORS_ORIGIN` - Override CORS origin for API requests

## Features in Detail

### Collection Browser
- Lists all collections in the connected database
- Click any collection to view its data
- Shows collection names in an organized sidebar

### Data Table
- **Pagination**: Navigate through large datasets
- **Expandable Cells**: Click any cell to expand/collapse content
- **JSON Formatting**: Automatically formats complex objects
- **Responsive**: Adapts to different screen sizes

### QueryStats Panel
- Execute MongoDB queryStats command
- Optional collection filtering
- Custom transform identifiers (JSON format)
- Real-time execution with loading states

### Error Handling
- Connection status monitoring
- User-friendly error messages
- Graceful degradation when database is unavailable

## Development

### Project Structure
```
webapp/
├── settings.json          # Configuration
├── package.json          # Server dependencies
├── server.js            # Express server
├── client/              # React application
│   ├── package.json     # Client dependencies
│   ├── public/          # Static assets
│   └── src/             # React components
│       ├── App.js       # Main application
│       ├── App.css      # Styles
│       └── components/  # UI components
└── README.md           # This file
```

### Adding New Features

1. **Server-side**: Add new routes in `server.js`
2. **Client-side**: Create new components in `client/src/components/`
3. **Styling**: Update `client/src/App.css`

### Debugging

- Server logs are printed to console
- Client development tools available in browser
- MongoDB connection status shown in header

## Deployment

### Docker (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Cloud Deployment

1. Build the application: `npm run build`
2. Set environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check MongoDB URI in `settings.json`
2. **Port Already in Use**: Change port in settings or kill existing process
3. **Build Errors**: Ensure all dependencies are installed

### Logs

- Server logs: Check console output
- Client logs: Check browser developer tools
- MongoDB logs: Check your MongoDB deployment logs

## License

MIT License - see LICENSE file for details.
