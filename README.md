# Reboot Student Profile

This project is a Single Page Application (SPA) designed for managing student profiles, including authentication and displaying user achievements. The application interacts with the Reboot Coding Institute's GraphQL API (compliant with the 01 Edu system) to retrieve and display student information.

## Project Structure

```
.
├── index.html                  # Main entry point for the application
├── assets
│   ├── styles.css              # General styles for the application
│   └── svg
│       └── icons.js            # SVG icons used in the application
├── services
│   ├── app.js                  # Initializes the application and manages state
│   ├── router.js               # Handles routing between different templates
│   ├── auth.js                 # Manages authentication logic
│   ├── graphql.js              # Functions for making GraphQL queries
│   └── utils.js                # Utility functions for data formatting and validation
├── templates
│   ├── home.js                 # Homepage view logic
│   ├── login.js                # Login view logic
│   ├── profile.js              # Profile view logic
│   ├── stats.js                # Stats view logic
│   └── components
│       ├── navbar.js           # Navigation bar component
│       ├── footer.js           # Footer component
│       └── charts
│           ├── levelChart.js   # Chart to visualize XP
│           ├── skillsChart.js  # Chart to visualize skills
│           └── gradesChart.js  # Chart to visualize grades
├── LICENSE                     # MIT License
└── README.md                   # Documentation for the project
```

## Setup Instructions

1. Clone the repository to your local machine.
2. Open `index.html` in your web browser to run the application.

## Usage

- Navigate to the login page to authenticate.
- Once logged in, you can view your profile.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed by Ahmed Almadhoob under the MIT License.
