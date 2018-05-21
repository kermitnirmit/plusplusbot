const Discord = require('discord.js')

const config = require('./config.json')
const Pauser = require('./Pauser.js')
const pau = new Pauser()
// const request = require('request-promise-native')
const client = new Discord.Client()
const Enmap = require('enmap')
const EnmapMongo = require('enmap-mongo')
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
client.scores = new Enmap({ provider: new EnmapMongo({
    name: `user_scores`,
    dbName: `plusplusdb`,
    url: 'mongodb://plusplus:adder@ds119820.mlab.com:19820/plusplusdb'
  })
});

client.on('message', async (message) => {
    if (message.author.bot) {
        return;
    }
    const check = await pau.check(message)
    if (check !== true) { 
        return;
    }
    if(message.mentions.users.first() === undefined) { //no mentions so dont do anything

    } else { //some mentions so do something
        if (message.mentions.users.size > 1 && (message.cleanContent.endsWith('++') || message.cleanContent.endsWith('--'))) {
            message.channel.send("Cannot change multiple scores at once. Pick one.");
        } else if (message.mentions.users.first().id === message.author.id) { //dont let them change score of self
            message.channel.send("Cannot change your own score! Have a :cookie: instead.");
            return;
        } else if (message.mentions.users.first().id === "443870600327331842") {
            message.channel.send("Sorry, I don't have a score. Try someone else.");
        } else { //someone else was mentioned, so now find out if its ++ or --
            let type
            if (message.cleanContent.endsWith('--')) {
              type = 'minus'
            } else if (message.cleanContent.endsWith('++')) {
              type = 'plus'
            } else if (message.cleanContent.endsWith('/score')) {
              type = 'scoreCheck';
            } else {
                return;
            }
            let target = message.mentions.users.first().id
            if (!client.scores.has(target)) { //if theyre not there, instantiate them with a score of 0
                client.scores.set(target, {
                  score: 0
                })
            }
            let current = client.scores.getProp(target, "score");
            let addon
            if (type === 'minus') {
                client.scores.setProp(target, "score", --current)
                addon = chooseNegative();
            } else if (type === 'plus') {
                client.scores.setProp(target, "score", ++current)
                addon = choosePositive();
            } else if (type === 'scoreCheck') {
                message.channel.send(message.mentions.users.first() + " has " + current +" points.");
                return;
            }
            
            if (current === 1) {
                message.channel.send(addon + " " + message.mentions.users.first() + " now at " + client.scores.getProp(target, "score") + " point.");
            } else {
                message.channel.send(addon + " " + message.mentions.users.first() + " now at " + client.scores.getProp(target, "score") + " points.");
            }
        }
    }
    if(message.content === "/score") { 
        let target = message.author.id.toString();
        if (!client.scores.has(target)) { //if theyre not there, instantiate them with a score of 0
            client.scores.set(target, {
              score: 0
            })
        }
        let current = client.scores.getProp(target, "score");
        if (current === 1) {
            message.channel.send("You are currently at " + current +" point.");
        } else {
            message.channel.send("You are currently at " + current +" points.");
        }

    }

})
function choosePositive() { 
    var pos = ["Bravo!", "Niceeeee", "Well done!", "Impressive!", "Slick!", "+1 GOE", "Splendid!", "Wow!"];
    var chooser = Math.floor(Math.random() * 6);
    return pos[chooser];
}
function chooseNegative() { 
    var neg = ["RIP.", "That's a m00d.", "aw.", "sad.", "not cool.", "-1 GOE.", "Unlucky.", "Unfortunate"];
    var chooser = Math.floor(Math.random() * 8);
    return neg[chooser];
}
client.on('ready', () => {
    console.log("bot is ready");
})
client.login(config.token)
