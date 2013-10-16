// Application bootstrapper.
Application = {
  
  API: 'https://10.0.54.74',
  
  initialize: function() {
    var HomeView = require('views/home_view');

    var LoginView = require('views/login_view');
    var RegisterView = require('views/register_view');

    var MediaView = require('views/media_view');
    var TranscriptsView = require('views/transcripts_view');
    var MixesView = require('views/mixes_view');
    
    var Router = require('lib/router');
    
    this.homeView = new HomeView();

    this.loginView = new LoginView();
    this.registerView = new RegisterView();

    this.mediaView = new MediaView();
    this.transcriptsView = new TranscriptsView();
    this.mixesView = new MixesView();
    
    this.router = new Router();
    
    if (typeof Object.freeze === 'function') Object.freeze(this);
  },
  
  user: null,
  
  whoami: function() {
    $.get(this.API + '/whoami', function(whoami) {
      console.log(whoami);
      if (whoami.user) {
        this.user = whoami.user;
        $('body').removeClass('anonymous').addClass('user');
        $('#userName').text(this.user.username);
      } else {
        this.user = null;
        $('body').removeClass('user').addClass('anonymous');
        $('#userName').text('Account');
      }
    });
  }
}

module.exports = Application;
