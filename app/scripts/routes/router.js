/*global haDash, Backbone*/

haDash.Routers = haDash.Routers || {};

(function() {
  'use strict';

  var $main = $('#main');

  /////////////////////////////////////////////////////
  // https://github.com/STRML/backbone.routeNotFound //
  /////////////////////////////////////////////////////
  /*global Backbone: true, _:true */
  (function() {
    /**
     * Backbone.routeNotFound
     *
     * Simple plugin that listens for false returns on Backbone.history.loadURL and fires an event
     * to let the application know that no routes matched.
     *
     * @author STRML
     */
    var oldLoadUrl = Backbone.History.prototype.loadUrl;

    _.extend(Backbone.History.prototype, {
      /**
       * Override loadUrl & watch return value. Trigger event if no route was matched.
       * @return {Boolean} True if a route was matched
       */
      loadUrl: function() {
        var matched = oldLoadUrl.apply(this, arguments);
        if (!matched) {
          this.trigger('routeNotFound', arguments);
        }
        return matched;
      }
    });
  }.call(this));
  /////////////////////////////////////////////////////

  haDash.Routers.Router = Backbone.Router.extend({
    //http://sizeableidea.com/adding-google-analytics-to-your-backbone-js-app/
    initialize: function() {
      this.bind('route', this.pageView);
      this.listenTo(Backbone.history, 'routeNotFound', this.onRouteNotFound);
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
      'logout/': 'signout',

      'register/': 'signup',
      'signup/': 'signup',

      'reset-password/': 'resetPassword',
      'choose-password/': 'choosePassword',
      'token/:token': 'signInToken',

      'add-media/': 'addMedia',
      'settings/': 'settings',

      '404/': 'notFound'
    },

    addMedia: function() {
      $main.empty().append(
        new haDash.Views.AddMediaView({
          model: new haDash.Models.MediaModel()
        }).render().el
      );
    },

    dashboard: function() {
      if (document.location.hash && document.location.hash.startsWith('#!/')) {
        return haDash.router.navigate(document.location.hash.substring(2), { trigger: true });
      }

      document.location = '/media/';
    },

    mixes: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.mixes').addClass('active');
      document.title = 'Hyperaudio Mixes';
      haDash.mixCollection = new haDash.Collections.MixCollection();

      haDash.mixListView = new haDash.Views.MixListView({
        collection: haDash.mixCollection
      });

      $main.empty().append(haDash.mixListView.renderEmpty().el);
      haDash.mixCollection.fetch();
    },

    media: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.media').addClass('active');
      document.title = 'Hyperaudio Media';
      haDash.mediaCollection = new haDash.Collections.MediaCollection();

      haDash.mediaListView = new haDash.Views.MediaListView({
        collection: haDash.mediaCollection
      });

      $main.empty().append(haDash.mediaListView.renderEmpty().el);
      haDash.mediaCollection.fetch();
    },

    mediaDetail: function(id) {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.media').addClass('active');
      var model = new haDash.Models.MediaModel({ _id: id });
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
      var model = new haDash.Models.MixModel({ _id: id });
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
      document.title = 'Hyperaudio Login';
      $main.empty().append(new haDash.Views.SignInView({}).el);
    },

    signout: function() {
      document.title = 'Hyperaudio Logout';

      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      document.location = '/';
    },

    signup: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.register').addClass('active');
      document.title = 'Hyperaudio Sign Up';
      $main.empty().append(new haDash.Views.SignUpView({}).el);
    },

    resetPassword: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.login').addClass('active');
      document.title = 'Hyperaudio Reset Password';
      $main.empty().append(new haDash.Views.ResetPasswordView({}).el);
    },

    notFound: function() {
      $('.header-navigation a').removeClass('active');
      document.title = '404 Not Found';
      $main.empty().append(new haDash.Views.NotFoundView({}).el);
    },

    choosePassword: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.login').addClass('active');
      document.title = 'Hyperaudio Choose a Password';
      $main.empty().append(new haDash.Views.ChoosePasswordView({}).el);
    },

    signInToken: function(token) {
      var payload = JSON.parse(window.atob(token.split('.')[1]));

      if (payload.email) {
        $.ajax({
          url: haDash.API + '/accounts/email/' + token,
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          method: 'put',
          data: JSON.stringify({})
        })
          .done(function(data) {
            console.log(data);
            alert('Email address changed to ' + payload.email);
            haDash.router.navigate('media/', { trigger: true });
          })
          .fail(function() {
            console.log('error');
          });
      } else {
        $.ajax({
          url: haDash.API + '/auth/whoami/' + token,
          method: 'get'
        })
          .done(function(whoami) {
            console.log(whoami);
            haDash.setUser(whoami);
            if (whoami.user) {
              window.localStorage.setItem('user', payload.user);
              window.localStorage.setItem('token', token);
              haDash.router.navigate('choose-password/', { trigger: true });
            }
          })
          .fail(function() {
            console.log('error');
          });
      }
    },

    pageView: function() {
      var url = Backbone.history.getFragment();

      if (!/^\//.test(url) && url != '') {
        url = '/' + url;
      }

      if (!_.isUndefined(window._gaq)) {
        _gaq.push(['_trackPageview', url]);
      }
    },

    settings: function() {
      $('.header-navigation a').removeClass('active');
      $('.header-navigation a.settings').addClass('active');
      document.title = 'Hyperaudio Settings';
      $main.empty().append(new haDash.Views.SettingsView({}).el);
    },

    onRouteNotFound: function() {
      console.log('Route not found, redirecting...');
      Backbone.history.navigate('404/', { trigger: true });
    }
  });
})();
