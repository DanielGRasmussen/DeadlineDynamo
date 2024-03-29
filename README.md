# DeadlineDynamo
Instructure Canvas has a dashboard which shows assignments to students primarily by due date. This can lead to poor time management and a false sense of security as some days seem completely open, while others are flooded with assignments.

Deadline Dynamo is a web extension that uses the Canvas API to fetch the user's course data and intelligently suggest a more even workload. Each assignment is prioritized by several factors, and a reasonably accurate estimate is given for how long each assignment will take to complete. These estimates are used to balance the student's workload across the week. The user can also specify their own plan. Whatever plan they choose will be displayed at the home page of Instructure where they usually can see assignments by due date.

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable developer mode
6. Click "Load unpacked" and select this repository's folder
