var apihost = process.env.API_HOST || 'rubberduckapi';
var apiport = process.env.API_PORT || '80';
var token = process.env.BOT_TOKEN || '';

var TelegramBot = require('node-telegram-bot-api'),
    bot = new TelegramBot(token, { polling: true });

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
              bot.sendMessage(msg.chat.id, botResponse, {
                'reply_markup': {
                  'hide_keyboard': true
                }
              });
            }
          }
        });
  }
};

var duckReport = function(msg, match) {
  var external_ducks = '';
  if (match.length === 2 && match[1]) {
    external_ducks = match[1];
  }
  request('http://' + apihost + '/fulldialog?duck_id=telegram:' + msg.chat.id +
      '&external_ducks=' + external_ducks,
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var jsResponse = JSON.parse(body);
          var keyboard = [];
          var botResponse = 'I\'d sent our conversation, ' +
              'good luck with that. Be sure to check in the spam folder. ' +
              'The mails from ducks don\'t get along with spam folders :) ' +
              '(use /reset to start again)';
          if (jsResponse.dialog.length <= 1) {
            botResponse = 'Quack quack quack, quack quack. Quack?';
            if (jsResponse.dialog.length === 1) {
              setTimeout(function() {
                bot.sendMessage(msg.chat.id,
                    jsResponse.dialog[0].replace(/Q:/, ''), {
                      'reply_markup': {
                        'hide_keyboard': true
                      }
                  });
              }, 1000);
            }
          } else if (!external_ducks) {
            botResponse = 'You need to set a destination mail. ' +
                'Ducks cannot read minds, you know? ' +
                '(something like /report donald@duck.me)';
            if (jsResponse.external_ducks) {
              keyboard = [{
                'text': '/report ' + jsResponse.external_ducks
              }];
            }
          }
          if (keyboard.length > 0) {
            bot.sendMessage(msg.chat.id, botResponse, {
              'reply_markup': {
                'keyboard': [keyboard],
                'resize_keyboard': true,
                'one_time_keyboard': true,
                'selective': true
              }
            });
          } else {
            bot.sendMessage(msg.chat.id, botResponse, {
              'reply_markup': {
                'hide_keyboard': true
              }
            });
          }
        }
      });
};

bot.onText(/^\/start.*/, function(msg, match) {
  msg.text = '';
  duckCall(msg);
});
bot.onText(/^\/reset.*/, function(msg, match) {
  msg.text = 'reset';
  duckCall(msg);
});
bot.onText(/^\/report(?: (.*))?/, function(msg, match) {
  duckReport(msg, match);
});

bot.on('message', duckCall);

console.log('bot server started...' + token + '...');
