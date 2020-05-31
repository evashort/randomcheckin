// AWS Lambda function randomcheckin
// This function is triggered on a schedule

const AWS = require('aws-sdk')
const Discord = require('discord.js')

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function shuffle(array) {
    for (let i = 0; i < array.length; i++) {
        let offset = Math.floor(Math.random() * (array.length - i))
        let tmp = array[i]
        array[i] = array[i + offset]
        array[i + offset] = tmp
    }
}

function postCheckinPairs(guild) {
    var checkinChannel = null
    for (var [channel_id, _] of guild.channels.cache) {
        var channel = guild.channels.resolve(channel_id)
        if (channel.name == 'checkin') {
            checkinChannel = channel
            break
        }
    }

    if (checkinChannel === null){
        console.log('no channel named checkin')
        console.log(guild.channels.cache)
        throw 'no channel named checkin'
    }

    checkinUsers = []
    for (var [member_id, _] of guild.members.cache) {
        var member = guild.members.resolve(member_id)
        for (var [role_id, role] of member.roles.cache) {
            if (role.name == 'weekly-checkin') {
                checkinUsers.push(member.user)
            }
        }
    }

    shuffle(checkinUsers)
    if (checkinUsers.length % 2) {
        checkinUsers.push(randomChoice(checkinUsers))
    }

    var messageString = 'checkin pairs:\n'
    for (let i = 0; i < checkinUsers.length; i += 2) {
        var user1 = checkinUsers[i]
        var user2 = checkinUsers[i + 1]
        messageString += `<@${user1.id}> and <@${user2.id}>\n`
    }

    var promise = checkinChannel.send(messageString.trimRight())
    return promise
}

exports.handler = async function (event) {
    const client = new Discord.Client()

    return new Promise(function (resolve, reject) {
        client.once(
            'ready',
            async function() {
                var promises = []
                for (var [guild_id, _] of client.guilds.cache) {
                    var guild = client.guilds.resolve(guild_id)
                    promises.push(postCheckinPairs(guild))
                }

                try {
                    await Promise.all(promises)
                } catch(err) {
                    reject(err)
                }

                client.destroy()
                resolve(
                    {
                        statusCode: 200,
                        body: JSON.stringify('Hello from Lambda!')
                    }
                )
            }
        )

        var secretsManager = new AWS.SecretsManager({region: 'us-west-1'})
        secretsManager.getSecretValue(
            {SecretId: 'randomcheckin'},
            function(err, data) {
                if (err) {
                    throw err
                }

                secret = JSON.parse(data.SecretString)
                client.login(secret.bot_token)
            }
        )
    })
}

if (require.main === module) {
    exports.handler({}).then(
        function(response) {
            console.log(response)
            process.exit(0)
        }
    )
}
