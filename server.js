var apihost = process.env.API_HOST || 'rubberduckapi';
var apiport = process.env.API_PORT || '80';
var token = process.env.BOT_TOKEN || '';

var Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });

var request = require('request');

var duckCall = function(msg) {
  if (msg.text === '' || (msg.text.length > 0 && msg.text[0] !== '/')) {
    request('http://' + apihost + '/dialog?duck_id=telegram:' + msg.chat.id +
        '&answer=' + msg.text,
        function(error, response, body) {
          if (!error && response.statusCode == 200) {
            var jsResponse = JSON.parse(body);
            var botResponse = jsResponse.next_question;
            if (jsResponse.answer_type === 1) {
              var keyboard = [];
              for (var i = 0; i < jsResponse.options.length; i++) {
                keyboard.push({
                  'text': jsResponse.options[i]
                });
              }
              bot.sendMessage(msg.chat.id, botResponse, {
                'reply_markup': {
                  'keyboard': [keyboard],
                  'resize_keyboard': true,
                  'one_time_keyboard': true,
                  'selective': true
                }
              });
            } else {
              bot.sendMessage(msg.chat.id, botResponse);
            }
          }
        });
  }
};

bot.onText(/^\/start.*/, function(msg, match) {
  msg.text = '';
  duckCall(msg);
});
bot.onText(/^\/reset.*/, function(msg, match) {
  msg.text = 'reset';
  duckCall(msg);
});

bot.on('message', duckCall);

console.log('bot server started...');
