/*global haDash, Backbone*/

haDash.Routers = haDash.Routers || {};

(function() {
  'use strict';

  var $main = $('#main');

  haDash.Routers.Router = Backbone.Router.extend({
    //http://sizeableidea.com/adding-google-analytics-to-your-backbone-js-app/
    initialize: function() {
      this.bind('route', this.pageView);
    },

    routes: {
      '': 'dashboard',
      'dashboard/': 'dashboard',
      'mixes/': 'mixes',
      'mixes/:id': 'mixDetail',
      'media/': 'media',
      'media/:id': 'mediaDetail',

      'signin/': 'signin',
      'login/': 'signin',

      'signout/': 'signout',

      'beta-signup/': 'signup',
      'signup/': 'signup',

      'reset-password/': 'resetPassword',
      'choose-password/': 'choosePassword',
      'token/:token': 'signInToken',

      'add-media/': 'addMedia',
      'settings/': 'settings'
    },

    addMedia: function() {
      console.log('ADD MEDIA');
      $main.empty().append(
        new haDash.Views.AddMediaView({
          model: new haDash.Models.MediaModel()
        }).render().el
      );
    },

    dashboard: function() {
      // console.log('Dashboard N/A');
      document.location = '/media/';
    },

    mixes: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.mixes').addClass('active');
      document.title = "Hyperaudio Mixes";
      // if (!haDash.mixCollection) {
        haDash.mixCollection = new haDash.Collections.MixCollection();
      // }

      haDash.mixListView = new haDash.Views.MixListView({
        collection: haDash.mixCollection
      });

      $main.empty().append(haDash.mixListView.renderEmpty().el);
      haDash.mixCollection.fetch();
    },

    media: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.media').addClass('active');
      document.title = "Hyperaudio Media";
      // console.log('MEDIA');

      // if (!haDash.mediaCollection) {
        haDash.mediaCollection = new haDash.Collections.MediaCollection();
      // }

      // if (!haDash.mediaListView) {
        haDash.mediaListView = new haDash.Views.MediaListView({
          collection: haDash.mediaCollection
        });
      // }
      $main.empty().append(haDash.mediaListView.renderEmpty().el);
      haDash.mediaCollection.fetch();

    },

    mediaDetail: function(id) {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.media').addClass('active');
      var model = new haDash.Models.MediaModel({_id: id});
      model.fetch({
        url: haDash.API + '/media/' + id
      });

      $main.empty().append(
        new haDash.Views.MediaDetailView({
          model: model
        }).render().el
      );
    },

    mixDetail: function(id) {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.mixes').addClass('active');
      var model = new haDash.Models.MixModel({_id: id});
      model.fetch({
        url: haDash.API + '/mixes/' + id
      });

      $main.empty().append(
        new haDash.Views.MixDetailView({
          model: model
        }).render().el
      );
    },

    signin: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.login').addClass('active');
      document.title = "Hyperaudio Login";
      $main.empty().append(new haDash.Views.SignInView({}).el);
    },

    signout: function() {
      document.title = "Hyperaudio Logout";

      $.ajax({
        url: haDash.API + '/logout',
        contentType: "application/json; charset=utf-8",
          dataType: "json",
        xhrFields: {
          withCredentials: true
        },
        method: 'post',
        data: JSON.stringify({
          _csfr: 'TODO'
        }),
        success: function() {
          // haDash.whoami(function() {
          //   haDash.router.navigate("mixes/", {trigger: true});
          // });
          document.location = '/';
        }
      });

    },

    signup: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.register').addClass('active');
      document.title = "Hyperaudio Sign Up";
      $main.empty().append(new haDash.Views.SignUpView({}).el);
    },

    resetPassword: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.login').addClass('active');
      document.title = "Hyperaudio Reset Password";
      $main.empty().append(new haDash.Views.ResetPasswordView({}).el);
    },

    choosePassword: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.login').addClass('active');
      document.title = "Hyperaudio Choose a Password";
      $main.empty().append(new haDash.Views.ChoosePasswordView({}).el);
    },

    signInToken: function (token) {
      $.ajax({
          url: haDash.API + '/token-login',
          contentType: "application/json; charset=utf-8",
            dataType: "json",
          xhrFields: {
            withCredentials: true
          },
          method: 'post',
          data: JSON.stringify({
            'access-token': token
          })
        })
        .done(function(whoami) {
          console.log(whoami);
          // changePassword();
          haDash.setUser(whoami);
          if (whoami.user) {
            haDash.router.navigate("choose-password/", {trigger: true});
          }
        })
        .fail(function() {
          console.log('error');
        });
    },

    pageView : function(){
      var url = Backbone.history.getFragment();

      if (!/^\//.test(url) && url != "") {
          url = "/" + url;
      }

      if(! _.isUndefined(window._gaq)){
        _gaq.push(['_trackPageview', url]);
      }
    },

    settings: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.settings').addClass('active');
      document.title = "Hyperaudio Settings";
      $main.empty().append(new haDash.Views.Settings({}).el);
    }

  });

})();
