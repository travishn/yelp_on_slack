'use strict';
require('dotenv').config();
const YelpAPIUtil = require('./util/yelp_api_helpers');
const express = require('express');

//Set up mongoose connection
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO);

const Channel = require('./models/channel');
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//USE THIS FORMAT TO CATCH ERRORS for DB creations
// Channel.create({channel_id: '1', access_token: '2', webhook_url: '3'}, function(err, result){
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(result);
//   }
// });

const request = require('request');
const yelp = require('yelp-fusion');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('querystring');
const slackTestFunction = require('./routes.js');
const debug = require('debug')('yelp_on_slack:server');
// const { createMessageAdapter } = require('@slack/interactive-messages');
const client = yelp.client(process.env.YELP_KEY);
const {
  IncomingWebhook
} = require('@slack/client');

// const slackInteractions = createMessageAdapter(process.env.SLACK_VERIFICATION_TOKEN);

const app = express();

// extended: true allows nested objects
app.use(bodyParser.urlencoded({ extended: true }));
// specifying that we want json to be used

app.use(bodyParser.json());

app.set('port', process.env.PORT || 5000);

app.get('/', (req, res) => {
  // res.render('my-app/src/index');
  res.json({hello: 'world'});
});

app.get('/auth', (req, res) => {
  // when a team installs our app on their workspace by pressing our "add to slack" button, they will get re-directed to our /auth route with a code they get from the oauth.access website.

  const options = {
    uri: 'https://slack.com/api/oauth.access?code=' +
      req.query.code +
      '&client_id=' + process.env.SLACK_CLIENT_ID +
      '&client_secret=' + process.env.SLACK_CLIENT_SECRET + 
      '&redirect_uri=https://yelponslack.herokuapp.com/',
    method: 'GET'
  };

  // we then take the code, put it in the above options object, and then make a new request to Slack, which authorizes our app to do stuff with the workspace. this is the only time we get access to the workspace's webhook url, slack access token, workspace name, etc. via the body, which we store in JSONresponse.
  request(options, (error, response, body) => {
    const JSONresponse = JSON.parse(body);
    if (!JSONresponse.ok) {
      console.log(JSONresponse);
      res.send("Error encountered: \n" + JSON.stringify(JSONresponse)).status(200).end();
    } else {
      // extract workspace information from JSONresponse after workspace installs our app
      const channelAccessToken = JSONresponse.access_token;
      const channelName = JSONresponse.incoming_webhook.channel;
      const channelId = JSONresponse.incoming_webhook.channel_id;
      const webHookUrl = JSONresponse.incoming_webhook.url;
      const conditions = { channel_id: channelId};
      const newEntry = { channel_id: channelId, access_token: channelAccessToken, webhook_url: webHookUrl };
      Channel.findOneAndUpdate(conditions, newEntry, {upsert: true}, function(err, doc){
        if (err) return res.send(500, {error: err});
        return res.send('Saved!');
      });
      // res.send(JSONresponse);
    }
  });
});

// SLACK
app.get('/slacktest', slackTestFunction);
// /yack slash command send HTTP post request to this url. We send back a dialog window.
app.post('/posttest', (req, res) => {

  // trigger id lets us match up our response to whatever action triggered it
  // this topmost token refers to the token sent by the request specifying that it came from slack
  const { token, channel_id, trigger_id} = req.body;
  let slackAccessToken;
  Channel.findOne({ channel_id: channel_id}).then(channel => {
    slackAccessToken = channel.access_token;
    
    if (token === process.env.SLACK_VERIFICATION_TOKEN) {
      // dialog object
   
    const dialog = {
      // token that allows us to take actions on behalf of the workplace/user
      token: slackAccessToken,
      trigger_id, 
      // convert to a json string
      dialog: JSON.stringify({
        title: 'Create a Poll',
        callback_id: 'submit-form',
        submit_label: 'Submit',
        elements: [{
          label: 'Search Term',
          name: "search",
          type: 'text',
          placeholder: 'e.g. Japanese tapas'
          },
          {
            label: 'Price',
            type: 'select',
            name: 'price',
            options: [
              { label: "$",value: 1 },
              { label: "$$", value: 2 },
              { label: "$$$", value: 3 },
              { label: '$$$$', value: 4 }
            ]
          },
          {
            label: 'Distance',
            type: 'select',
            name: 'distance',
            options: [
              { label: "0.5mi",value: 0.5},
              { label: "1.0mi",value: 1.0},
              { label: "1.5mi",value: 1.5},
              { label: "2.0mi",value: 2.0}
            ]
          },
          {
            label: 'Location',
            name: "location",
            type: 'text',
            placeholder: 'Starting Location'
          }
        ]
      })
    };
    // send an http post request to open the dialog, and we pass the dialog
    axios.post('https://slack.com/api/dialog.open', qs.stringify(dialog))
      .then((result) => {
        debug('dialog.open: %o', result.data);
        res.send(JSON.stringify(req.body));
      }).catch((error) => {
        debug('dialog.open call failed: $o', error);
        res.sendStatus(501);
      });
  } else {
    debug('Verification token mismatch');
    res.sendStatus(400);
  }
  }, () => {
    res.sendStatus(505);
  });
});

//route to accept button-presses and form submissions
app.post('/interactive-component', (req, res) => {
  const body = JSON.parse(req.body.payload);
  Channel.findOne({channel_id: body.channel.id}).then( channel => {
    // check for verification token
    if (body.token === process.env.SLACK_VERIFICATION_TOKEN) {
      debug(`Form submission received: ${body.submission.trigger_id}`);
  
      // default response so slack doesnt close our request
      res.send('');
    
      const data = {
        term: body.submission['search'],
        price: body.submission['price'],
        location: body.submission['location'],
        radius: YelpAPIUtil.milesToMeters(body.submission['distance']),
        channel: channel
      };
      axios.post('http://yelponslack.herokuapp.com/restaurants', data);
      
  
    } else {
      debug("Token mismatch");
      res.sendStatus(500);
      }
    }
  );

});

// YELP
app.post('/restaurants', function (req, res) {

  client.search({
    term: req.body.search,
    location: req.body.location,
    price: req.body.price,
    sort_by: 'rating'
  }).then(response => {
    const businesses = selectRandomRestaurants(response.jsonBody.businesses);
    restaurantMessage(businesses, req.body.channel.webhook_url);
  });
});

const selectRandomRestaurants = (businesses) => {
  const arr = [];
  while (arr.length < 3) {
    var randomNum = Math.floor(Math.random() * businesses.length);
    if (arr.indexOf(randomNum) > -1 || arr.includes(businesses[randomNum])) continue;
    arr.push(businesses[randomNum]);
  }

  return arr;
};

// Helper method that selects the first three businesses that were filtered from the yelp fusion api
// Utilizes the buildRestaurantMessage helper method located in the util folder to create message format
const restaurantMessage = (businesses, webHook) => {
  const webHookUrl = new IncomingWebhook(webHook);
  const test = {
    "attachments": [
      YelpAPIUtil.buildRestaurantMessage(businesses[0], 0),
      YelpAPIUtil.buildRestaurantMessage(businesses[1], 1),
      YelpAPIUtil.buildRestaurantMessage(businesses[2], 2)
    ]
  };

  webHookUrl.send(test, function (err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message successfully sent');
    }
  });
};

app.listen(app.get('port'), () => {
  console.log('App is listening on port ' + app.get('port'));
});