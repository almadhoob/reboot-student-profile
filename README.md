# Reboot Student Profile

This project is a Single Page Application (SPA) designed with plain HTML, CSS, and JavaScript. The application interacts with the Reboot01 GraphQL API (compliant with the 01 Edu system) to retrieve and display student profiles, including authentication and displaying user achievements, XP progress, and grade statistics.

## Features

- **Authentication**: Secure login using Basic Auth with JWT tokens
- **Profile Management**: View student information, XP, level, and progress
- **Statistics Dashboard**: Interactive charts showing XP progress and grade performance
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Data**: Fetches live data from 01 Edu GraphQL API
- **Error Handling**: Comprehensive error handling with fallback modes

## Project Structure

```
.
├── index.html                  # Main entry point for the application
├── assets/
│   ├── style.css              # Comprehensive styles for the application
│   └── favicon.ico            # Favicon for the application
├── services/
│   ├── app.js                 # Application initialization and state management
│   ├── router.js              # Hash-based SPA routing with auth guards
│   ├── auth.js                # Authentication logic with JWT handling
│   ├── graphql.js             # GraphQL API client and data transformation
│   └── utils.js               # Utility functions for formatting and validation
├── templates/
│   ├── home.js                # Landing page with login call-to-action
│   ├── login.js               # Authentication form
│   ├── profile.js             # User profile with grades and audits
│   ├── stats.js               # Statistics dashboard with charts
│   ├── error.js               # 404 error page
│   └── components/
│       ├── levelChart.js      # D3.js XP progress visualization
│       └── gradesChart.js     # D3.js grades performance chart
├── LICENSE                    # MIT License
└── README.md                  # This documentation
```

## API Integration

This application integrates with the **01 Edu GraphQL API** and uses the following entities:

- **user**: Basic user information (id, login)
- **transaction**: XP transactions for progress tracking
- **progress**: Academic progress data (grades, completion status)
- **result**: Audit results and peer evaluations
- **object**: Course/project metadata

### GraphQL Queries Used

- Normal queries: Basic field selection
- Nested queries: Related data fetching (transactions with objects)
- Filtered queries: Using `where` clauses and `order_by` arguments

## Setup Instructions

### Option 1: Online Access
Visit the live application: [http://almadhoob.github.io/reboot-student-profile](http://almadhoob.github.io/reboot-student-profile)

### Option 2: Local Development

1. Clone the repository:
   ```bash
   git clone git@github.com:almadhoob/reboot-student-profile.git
   cd reboot-student-profile
   ```

2. Serve the application using a local HTTP server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

## Usage

1. **Home Page**: Welcome page with login button
2. **Login**: Authenticate using your 01 Edu credentials
3. **Profile**: View your academic progress, grades, and audits
4. **Statistics**: Interactive charts showing XP progress and performance metrics

### Authentication

- Use your standard 01 Edu/Reboot01 username and password
- The application stores JWT tokens securely in localStorage
- Automatic logout on token expiration

### Features Available

- **XP Tracking**: Visual representation of your experience points over time
- **Grade Analysis**: Performance metrics across different subjects
- **Audit History**: Peer evaluations and feedback
- **Progress Statistics**: Success rates and completion metrics

## Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript ES6+ modules
- **Styling**: Modern CSS with gradients and glassmorphism effects
- **Charts**: D3.js for interactive data visualizations
- **API**: GraphQL with Hasura-style filtering and ordering

### Browser Compatibility
- Modern browsers with ES6 module support
- Responsive design for mobile and desktop
- Progressive enhancement for chart features

### Error Handling
- Network error recovery
- Authentication failure handling
- Graceful degradation when charts fail to load
- Mock data for development/testing

## Development

### Adding New Features
1. Create new template in `templates/`
2. Add route in `services/router.js`
3. Update navigation in relevant templates
4. Add corresponding styles in `assets/style.css`

### GraphQL Queries
- Modify queries in `services/graphql.js`
- Follow 01 Edu schema conventions
- Use proper filtering and ordering

## Contributing

Feel free to submit issues or pull requests for:
- Bug fixes
- Feature improvements
- UI/UX enhancements
- Performance optimizations

## License

This project is licensed by Ahmed Almadhoob under the MIT License. See [LICENSE](LICENSE) for details.

## Support

For issues related to:
- **API Access**: Contact your 01 Edu administrators
- **Application Bugs**: Submit an issue on GitHub
- **Feature Requests**: Create a pull request or issue
