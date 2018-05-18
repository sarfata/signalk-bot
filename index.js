#!/usr/bin/env node

var Botkit = require('botkit');
var express = require('express');
var request = require('request');
const NMEA0183Parser = require('@signalk/nmea0183-signalk')
const CanBoatJS = require('canboatjs').FromPgn
const n2kSignalk = require('@signalk/n2k-signalk');

// Load configuration
require('dotenv').config()
const port = process.env.PORT || 3000
const botToken = process.env.BOTTOKEN;

const nmeaParser = new NMEA0183Parser()

var app = express()

app.listen(port, () => {
  console.log(`Listening on port {port}`)
})

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
app.post('/tosignalk', function(req, res) {
  res.send('in progress...');
});

var controller = Botkit.slackbot({
  debug: true
});

var bot = controller.spawn({
  token: botToken
}).startRTM();

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', (bot, message) => {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face'
  }, (err, res) => {
    if (err) {
      bot.botkit.log("failed to add emoji reaction :(", err);
    }
  });

  bot.reply(message, "Hello!");
});

const nmea0183regexp = /(\$.*\*[a-zA-Z0-9]{2})/
const nmea2000PcdinRegexp = /(\$PCDIN.*\*[a-zA-Z0-9]{2})/

//2017-04-15T14:57:58.471Z,3,126208,204,172,21,00,00,ef,01,ff,ff,ff,ff,ff,ff,04,01,3b,07,03,04,04,5c,05,0f,ff
const nmea2000ActisenseRegexp = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z,[^\s]*)/

controller.hears(['convert (.*)'], 'direct_message,direct_mention,mention', (bot, message) => {
  var data = message.match[1];

  // Search for a NMEA0183 sentence in the message
  var matches;
  if ((matches = data.match(nmea2000PcdinRegexp))!=null || (matches=data.match(nmea2000ActisenseRegexp)) != null) {
    data = matches[1];

    // Unrecognized sentences do not trigger an error so we use a timeout to catch them.
    var timeout = setTimeout(() => {
      bot.reply(message, `CanboatJS was unable to convert \`${data}\`. Sorry :/`)
    }, 200);

    const parser = new CanBoatJS({format: 1})
    parser.on('pgn', pgn => {
      clearTimeout(timeout);

      var signalk = n2kSignalk.toDelta(pgn);

      bot.reply(message, `\`${data}\` converts via CanboatJS to:\`\`\`${JSON.stringify(pgn)}\`\`\`\n`
      + `And via n2k-signalk to: \`\`\`${JSON.stringify(signalk)}\`\`\``);
    });
    var errorFn = (pgn, error) => {
      clearTimeout(timeout);

      bot.reply(message, `Error parsing ${ pgn.pgn}: *${ error }*`)
    }
    parser.on('warning', errorFn)
    parser.on('error', errorFn)

    parser.parseString(data)
  } 
  else if (data.match(nmea0183regexp)) {
    // keep only the nmea sentence
    data = data.match(nmea0183regexp)[1];
    nmeaParser.parse(data).then(result => {
      if (result) {
        bot.reply(message, "According to @signalk/nmea0183-signalk, `" + data 
        + "` converts to \n```" + JSON.stringify(result.delta) + "```");
      }
      else {
        bot.reply(message, `Sorry @signalk/nmea0183-signalk, does not have a conversion for \`${ data }\`.`);
      }
    })
    .catch(error => {
      bot.reply(message, "@signalk/nmea0183-signalk was not able to convert `" + data + "`:\n*" + error.message + "*");
    });
  }
  else {
    bot.reply(message, "I am not sure what to do with " + message.match[1]);
  }
})