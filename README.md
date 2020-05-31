Once a week, this Discord bot generates a random pairing of all users who have
the `weekly-checkin` role and posts it to the `#checkin` channel. Each pair of
users can then schedule a video chat to check in with each other sometime
during the week.

The message containing the user pairing looks like this:
![Example pairing message](message_screenshot.png)

[Invite this bot to a server you manage](https://discord.com/api/oauth2/authorize?client_id=714659706961920061&permissions=2048&scope=bot)

The invite URL uses Discord's [bot authorization flow](https://discord.com/developers/docs/topics/oauth2#bot-authorization-flow) with the following query params:
- client_id=714659706961920061 (the bot's user ID)
- permissions=2048 (send messages only)
- scope=bot (a special OAuth scope that lets the bot log in with a bot token
instead of an OAuth token)

This bot is serverless. It runs as an AWS Lambda function which can be
triggered manually or on a schedule. The source code is in
[randomcheckin/index.js](randomcheckin/index.js). It uses
[discord.js](https://discord.js.org/) to interact with the
[Discord API](https://discord.com/developers/docs/intro).

## Setting up the bot in AWS
1. Store a secret in [AWS Secrets Manager](https://us-west-1.console.aws.amazon.com/secretsmanager/home?region=us-west-1#/home)
with a single key `bot_token` containing the bot's token from the
[Discord Developer Portal](https://discord.com/developers/applications/).
(Note that the bot token is different from the OAuth2 client secret although they serve a similar purpose.) Name the secret `randomcheckin`, store the secret,
and copy the Secret ARN for use in step 3.

Note: At this point, you should be able to run
[randomcheckin/index.js](randomcheckin/index.js)
locally on your computer, assuming you've installed and configured the
[AWS CLI](https://aws.amazon.com/cli/).

1. In [AWS Lambda](https://us-west-1.console.aws.amazon.com/lambda/home?region=us-west-1#/), create a new function called `randomcheckin` with the
Node.js 12.x runtime. Choose "Author from scratch" and "Create a new role with
basic Lambda permissions".

1. On the Permissions tab of your new function, click on the role name to view
it in the IAM console, then click "Add inline policy". Choose the following
policy:
    ```
    Secrets Manager > Read > GetSecretValue
    ```
    In the Resources section, choose "Specific", click Add ARN, and paste the
    Secret ARN you copied in step 1. For the policy name I just put
    `randomcheckin` again.

1. Navigate to the [randomcheckin](randomcheckin) subfolder of this repo in
your terminal and run the `npm install` command. This should create a folder
called `node_modules` inside of `randomcheckin`. Create a zip file containing
everything in the `randomcheckin` subfolder.

1. In [AWS Lambda](https://us-west-1.console.aws.amazon.com/lambda/home?region=us-west-1#/),
go back to the Configuration tab of the `randomcheckin` function and change
"Code entry type" to "Upload a .zip file". Upload the file created in the
previous step.

1. In the top left corner of the console, click the Test button. Create a new
test event called `emptyevent` containing an empty JSON object:
    ```json
    {}
    ```

1. Assuming the bot has been invited to a server, and that server has a
channel called `#checkin`, the bot should post a message in the `#checkin`
channel when you click Test.

1. Add a schedule trigger to the `randomcheckin` function:
    ```
    Add trigger > CloudWatch Events/EventBridge > Create a new rule > Schedule expression
    ```

    The rule name can be `weekly-checkin`. Then enter whatever [cron schedule](https://crontab.guru/)
    you like, for example [every Saturday at 5:20pm PDT](https://crontab.guru/#20_0_*_*_SUN)
    (Sunday at 00:20 UTC):
    ```
    cron(20 0 ? * SUN *)
    ```
