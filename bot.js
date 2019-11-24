var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

//Requirements for google sheets
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';




// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

//Basic Logs
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});


//Reactions to messages
bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!!!'
                });
            break;
        
         }
     }

    //
    if(message == 'What is the answer to life, the universe, and everything?'){
        bot.sendMessage({
            to:channelID,
                message: '42'
            });
        ; 
    }
    if(message.substring(0,10) == 'babblefish') {
    //Potentially some for of translation?
        bot.sendMessage({
            to:channelID,
                message: 'The poor Babel fish by effectively removing all barriers to communication between different races and cultures, has caused more and bloodier wars than anything else in the history of creation'
        });
    ; 
    }

    if(message.substring(0,10) == '!sheets'){
        //Implments a function to read mixer stats from a google sheet

        //Authorize function for sheets
        function authorize(credentials, callback) {
            const {client_secret, client_id, redirect_uris} = credentials.installed;
            const oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirect_uris[0]);
        
            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getNewToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            return callback(oAuth2Client);
            });
        }

        //Get new Token for google sheets  
        function getNewToken(oAuth2Client, callback) {
            const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error while trying to retrieve access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
            });
        }
        




        /**
         * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
         */
        async function listMixerStats(auth) {
        const sheets = google.sheets({version: 'v4', auth});
        await sheets.spreadsheets.values.get({
            spreadsheetId: '1yObdyGAsbbpAc8GFut0TSJ-1Tg4ghGt2snCs6i0zK_w',
            range: 'Stats Sheet!A:A',
            }, 
            async (err, res) => {
                //if (err) return console.log('The API returned an error: ' + err);
                try{
                const rows = res.data.values;
                lastMix = rows[0][0]+" "+rows[1][0];
                totalCash = rows[3][0]+" "+rows[4][0];
                cashLast = rows[6][0]+" "+rows[7][0];
                let outString = lastMix+"\n"+totalCash+"\n"+cashLast;
                console.log(outString);
                bot.sendMessage({
                    to:channelID,
                        message: outString
                });
                }
                catch(err){
                    return console.log('The API returned an error: ' + err);
                }
            });
        }


        // Load client secrets from a local file.
        fs.readFile('credentials.json', async (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Sheets API.
                authorize(JSON.parse(content), listMixerStats);
        });


  

    }
});


