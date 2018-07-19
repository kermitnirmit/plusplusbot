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
    
    // uncomment to add rate-limiting for all messages
    // const check = await pau.check(message)
    // if (check !== true) { 
    //     return;
    // }
    if (message.mentions.users.first() === undefined) { //no mentions so dont do anything

    } else { //some mentions so do something
        if (message.mentions.users.size > 1 && (message.cleanContent.endsWith('++') || message.cleanContent.endsWith('--') || message.cleanContent.endsWith('/score'))) {
            message.channel.send("Cannot change multiple scores at once. Pick one.");
        } else if (message.mentions.users.first().id === message.author.id && (message.cleanContent.endsWith('++') || message.cleanContent.endsWith('--') || message.cleanContent.endsWith('/score'))) { //dont let them change score of self
            message.channel.send("Cannot change your own score! Have a :cookie: instead.");
            return;
        } else if (message.mentions.users.first().id === "443870600327331842" && (message.cleanContent.endsWith('++') || message.cleanContent.endsWith('--') || message.cleanContent.endsWith('/score'))) {
            message.channel.send("Sorry, I don't have a score. Try someone else.");
        } else { //someone else was mentioned, so now find out if its ++ or --
            // uncomment to add rate-limiting only on specific messages
            // const check = await pau.check(message)
            // if (check !== true) { 
            //     return;
            // }
            let type
            if (message.cleanContent.endsWith('--')) {
                type = 'minus'
                const check = await pau.check(message)
                if (check !== true) { 
                    return;
                }
            } else if (message.cleanContent.endsWith('++')) {
                 type = 'plus'
                 const check = await pau.check(message)
                 if (check !== true) { 
                     return;
                 }
            } else if (message.cleanContent.endsWith('/score')) {
                type = 'scoreCheck';
            } else if (message.cleanContent.endsWith('/rank')) {
                type = 'rankCheck';
            } else if (message.cleanContent.endsWith('/sugar')) {
                type = 'sugar';
            } else {
                return;
            }
            let target = message.mentions.users.first().id
            if (!client.scores.has(target)) { //if theyre not there, instantiate them with a score of 0
                client.scores.set(target, {
                  score: 0,
                  posScore: 0,
                  negScore: 0
                })
            }
            let current = client.scores.getProp(target, "score");
            
            let addon
            if (type === 'minus') {
                let minuses = client.scores.getProp(message.author.id, "negScore");
                client.scores.setProp(target, "score", --current)
                client.scores.setProp(message.author.id, "negScore", (minuses + 1))
                addon = chooseNegative();
            } else if (type === 'plus') {
                let pluses = client.scores.getProp(message.author.id, "posScore");
                client.scores.setProp(target, "score", ++current)
                client.scores.setProp(message.author.id, "posScore", (pluses + 1))
                addon = choosePositive();
            } else if (type === 'scoreCheck') {
                message.channel.send(message.mentions.users.first() + " has " + current +" points.");
                return;
            } else if (type === 'rankCheck') {
                getTargetRank(message, message.mentions.users.first().id);
                return;
            } else if (type === 'sugar') {
                getSugar(message, message.mentions.users.first().id);
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
              score: 0,
              posScore: 0,
              negScore: 0
            })
        }
        let current = client.scores.getProp(target, "score");
        if (current === 1) {
            message.channel.send("You are currently at " + current +" point.");
        } else {
            message.channel.send("You are currently at " + current +" points.");
        }
    }
    if(message.content === "/leaderboard") { 
        getLeaderboard(message);
    }
    if(message.content === "/rank") {
        getRank(message);
    }
    if (message.content === "/sugar") {
        let target = message.author.id.toString();
        if (!client.scores.has(target)) { //if theyre not there, instantiate them with a score of 0
            client.scores.set(target, {
              score: 0,
              posScore: 0,
              negScore: 0
            })
        }
        let current = client.scores.getProp(target, "score");
        let posNum = client.scores.getProp(target, "posScore");
        var negNum = client.scores.getProp(target, "negScore");
        if (posNum === 0 && negNum === 0) {
            message.channel.send("You've never given nor taken any points");
            return;
        }
        if (negNum === 0) {
            let net = posNum - negNum;
            message.channel.send("You've given " + posNum + " point(s) and taken away " + negNum + " point(s) \nOverall, you've given " + net + " point(s). \nYou are 100% positive");
            return;
        } else {
            let net = posNum - negNum;
            let total = posNum + negNum;
            let positivity = posNum / total * 100;
            let num = positivity.toString(); //If it's not already a String
            num = num.slice(0, (num.indexOf("."))+3); //With 3 exposing the hundredths place
            let realPos = num;
            message.channel.send("You've given " + posNum + " point(s) and taken away " + negNum + " point(s) \nOverall, you've given " + net + " point(s). \nYou are " + realPos + "% positive");
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

function getLeaderboard(message) { 
    var toReturn;
    MongoClient.connect('mongodb://plusplus:adder@ds119820.mlab.com:19820/plusplusdb', function(err, db) {
        if (err) throw err;
        var dbo = db.db("plusplusdb");
        var mysort = { "value.score": -1 };
        dbo.collection("user_scores").find().sort(mysort).toArray(function(err, result) {
            if (err) throw err;
            var finalMessage = "Rank   Points \t   User \n\n";
            var finalMessage2 = "Rank   Points \t   User \n\n";
            var count = 1;
            result.forEach(element => {
                if (count <= 60) {
                    finalMessage += count + '\t\t\t';
                    count++;
                    finalMessage += element.value.score + '\t\t\t';
                    finalMessage += '<@' + element._id + '>' + "\n";
                } else {
                    finalMessage2 += count + '\t\t\t';
                    count++;
                    finalMessage2 += element.value.score + '\t\t\t';
                    finalMessage2 += '<@' + element._id + '>' + "\n";
                }
            });
            message.channel.send("Sent to you as a PM.");
            message.author.send(finalMessage);
            message.author.send(finalMessage2);
          db.close();
        });
    }); 
}
function getRank(message) { 
    let target = message.author.id.toString();
    MongoClient.connect('mongodb://plusplus:adder@ds119820.mlab.com:19820/plusplusdb', function(err, db) {
        if (err) throw err;
        var dbo = db.db("plusplusdb");
        var mysort = { "value.score": -1 };
        dbo.collection("user_scores").find().sort(mysort).toArray(function(err, result) {
          if (err) throw err;
          var finalMessage = "";
          var count = 1;
          result.forEach(element => {
              if(element._id === target) {
                  finalMessage += "Your rank is " + count + ". You have " + element.value.score + " point(s).";
                  message.channel.send(finalMessage);
                  return;
              } else {
                  count++;
              }
          });
          db.close();
        });
    }); 
}
function getTargetRank(message, target) { 
    MongoClient.connect('mongodb://plusplus:adder@ds119820.mlab.com:19820/plusplusdb', function(err, db) {
        if (err) throw err;
        var dbo = db.db("plusplusdb");
        var mysort = { "value.score": -1 };
        dbo.collection("user_scores").find().sort(mysort).toArray(function(err, result) {
          if (err) throw err;
          var finalMessage = "";
          var count = 1;
          result.forEach(element => {
              if(element._id === target) {
                  finalMessage += '<@' + target + ">" + " is ranked " + count + " with " + element.value.score + " point(s).";
                  message.channel.send(finalMessage);
                  return;
              } else {
                  count++;
              }
          });
          db.close();
        });
    }); 
}
function getSugar(message, target) {
    if (!client.scores.has(target)) { //if theyre not there, instantiate them with a score of 0
        client.scores.set(target, {
            score: 0,
            posScore: 0,
            negScore: 0
        })
    }
    let current = client.scores.getProp(target, "score");
    let posNum = client.scores.getProp(target, "posScore");
    let negNum = client.scores.getProp(target, "negScore");
    if (posNum === 0 && negNum === 0) {
        let net = posNum - negNum;
        message.channel.send("<@" + target + ">" + " has not given nor taken any points.");
        return;
    }
    if (negNum === 0) {
        let net = posNum - negNum;
        message.channel.send("<@" + target + ">" + " has given " + posNum + " point(s) and taken away " + negNum + " point(s) \nOverall, you've given " + net + " point(s). \nYou are 100% positive");
        return;
    } else {
        let net = posNum - negNum;
        let total = posNum + negNum;
        let positivity = posNum / total * 100;
        let num = positivity.toString(); //If it's not already a String
        num = num.slice(0, (num.indexOf("."))+3); //With 3 exposing the hundredths place
        let realPos = num;
        message.channel.send("<@" + target + ">" + " has given " + posNum + " point(s) and taken away " + negNum + " point(s) \nOverall, you've given " + net + " point(s). \nYou are " + realPos + "% positive");
    }
}
client.on('ready', () => {
    console.log("bot is ready");
})
client.login(process.env.TOKEN)

