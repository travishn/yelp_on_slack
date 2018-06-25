# Yelp on Slack
Yelp on Slack is an app that facilitates lunch place decision making.

## Background and Overview

Deciding on a place to go for lunch is a common issue amongst teams in the workplace. Often times, with no one willing to make a final decision, teams resort to going to the same restaurant time after time. With Yelp on Slack, we intend to solve this problem by filtering data from nearby restaurants based on the average rating and review count, and presenting a curated list of options based on the user’s inputs.

## Functionality & MVPs
- [ ] Users can input a location, a maximum distance, a price range, and a time range for the poll
- [ ] Yelp on Slack will return a curated list of restaurant options along with a timed poll for users to vote using emojis
- [ ] If the poll is inconclusive, yack will independently select an option
- [ ] Menu, types of food, highlighted dish, and photos will be displayed for selected restaurants

### Bonus Features:
- [ ] Yelp on Slack will put in a reservation for the selected restaurant from poll
- [ ] Alerts that notify slack channel members when a poll is closing within a specified time
- [ ] Automatically starts poll on specified day for companies that have weekly team lunches
- [ ] Implement Google Maps API to provide directions to restaurant
- [ ] Create an option for users to vote on to create a new poll with a different curated list of restaurant options

## Technologies and Technical Challenges

### Mern Stack:
* Frontend:
  * React (v16.4.0)
* Backend:
  * MongoDB
  * Express.js
  * Node.js
### APIs:
* Yelp Fusion API
* Slack API
  * Incoming Webhook
  * Slash Commands

### Accessing Dataset
* Utilize user input to hit the fusion api at the backend search route to access restaurants in surrounding area
* Create a composite score as a function of average rating and total number of reviews to select top three restaurants
* Request information from Yelp Fusion API for each restaurant to be displayed as a message using Slack API

### Formatting Data
* Create a request to the Fusion API and format the information from the dataset to create a timed poll using the Slack API
* Explore the capabilities of the slack interface in terms of formatting for display of restaurant information

### Slack API
* Integrate webhooks and slash commands for starting a poll and shortcut commands
* Employ Slack message builder to create restaurant poll form with individual restaurant information

### UX
* Frontend Interface
  * Integrate an “Add to Slack” button that installs the Yelp on Slack app to the user’s slack workplace
  * Provide basic setup instructions and slash commands
* Backend
  * Our backend will act as a middleman for formatting data between Slack and Yelp APIs
  * After completing the restaurant poll form, slack sends JSON to our backend, which we configure to the appropriate query params format to send to yelp
  * Our backend takes yelp responses and filters the JSON dataset based on a composite score function, sending it back to slack for users to view using the Slack API

## Accomplished Over the Weekend
* Completed tutorials on Express.js, Node.js, and MongoDB
* Completed heroku set up for the app
* Determined data format and availability provided by Yelp Fusion API
* Created webhooks on group channel for slack message builder api tests
* Constructed form options for creation of timed poll 
* Connected data yielded from Yelp Fusion API to Slack API to display messages in a specific channel

## Group Members & Work Breakdown
**Travis Nguyen**, 
**Marshall Cheng**, 
**Henry Nguyen**, 
**Edmund Ho**


### Day 1
  - Determine need for own composite score function for filtering of restaurant data
  - Complete dialog option to create an interactive timed poll 
  - Determine necessary restaurant information to display to slack users
  - Format the data provided by Yelp Fusion API to Slack message builder API

### Day 2
  - Create slash command to create a timed poll
  - Start on conversion of timed poll results to create request to Yelp Fusion API
  - Research slack api auth tokens and present findings to group mates
  - Implement alert that notifies slack channel members that a poll is closing within a specified time frame

### Day 3
  - Reconvene to ensure data and project files are in an organized state
  - Run tests to ensure whether data yielded from Yelp Fusion API meet group expectations (Bayesian rating filter from yelp)
  - Walk through process of app to ensure members have general understanding of data flow
  - Reconfigure data in slack message builder to create interactive and presentable messages for slack users


### Day 4
  - Setup necessary files and components to create splash page for app
  - Create user auth for when teams add app to their workspace (determine which users have option of initializing a poll)
  - Create button that users can click to automatically install the app in their workspace

### Day 5
  - Style the splash page
  - Add directions to front end to ensure users understand purpose and commands of app

### Day 6
 - Look over project and ensure everything is functioning correctly
 - Make styling changes to ensure great UI/UX
