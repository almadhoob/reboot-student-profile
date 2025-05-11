# Reboot Student Profile

This project is a Single Page Application (SPA) designed for managing student profiles, including authentication and displaying user achievements. The application interacts with the Reboot Coding Institute's GraphQL API to retrieve and display student information.

## Project Structure
SPA
```
.
├── index.html           # Main entry point for the application
├── assets
│   ├── fav
│   |   ├── about.txt           # Favicon information
│   |   └── site.webmanifest    # Favicon maifest
│   └── svg
│       └── icons.js            # SVG icons used in the application
├── controllers
│   ├── app.js           # Initializes the application and manages state
│   ├── router.js        # Handles routing between different views
│   ├── auth.js          # Manages authentication logic
│   ├── graphql.js       # Functions for making GraphQL queries
│   ├── utils.js         # Utility functions for data formatting and validation
│   └── services
│       ├── api.js              # API request functions
│       ├── auth-service.js     # Authentication-related API requests
│       └── storage-service.js  # Local storage management
├── styles
│   ├── style.css        # General styles for the application
│   ├── login.css        # Styles specific to the login page
│   └── profile.css      # Styles specific to the profile page
├── views
│   ├── home.js          # Homepage view logic
│   ├── login.js         # Login view logic
│   ├── profile.js       # Profile view logic
│   └── components       # Reusable UI components
│       ├── navbar.js    # Navigation bar component
│       ├── footer.js    # Footer component
│       └── charts       # Chart components for data visualization
│           ├── xpChart.js
│           ├── skillsChart.js
│           └── gradesChart.js
├── LICENSE              # MIT License
└── README.md            # Documentation for the project
```

## Setup Instructions

1. Clone the repository to your local machine.
2. Open `index.html` in your web browser to run the application.
3. Ensure you have a valid JWT token for authentication with the GraphQL API.

## Usage

- Navigate to the login page to authenticate.
- Once logged in, you can view your profile, which includes your identification, XP amount, grades, audits, skills, and interactive SVG graphs for user achievements.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License by Ahmed Almadhoob.
