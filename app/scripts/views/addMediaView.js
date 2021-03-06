/*global haDash, Backbone, JST*/

haDash.Views = haDash.Views || {};

(function() {
  'use strict';

  haDash.Views.AddMediaView = Backbone.View.extend({
    id: 'addMediaView',

    template: JST['app/scripts/templates/addMedia.ejs'],

    initialize: function() {
      // this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      // this.$el.foundation('reveal', 'open');

      return this;
    },

    events: {
      'click button': 'addVideo'
    },

    // https://gist.github.com/takien/4077195
    YouTubeGetID: function(url) {
      var ID = '';
      url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
      if (url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_-]/i);
        ID = ID[0];
      } else {
        ID = null;
      }
      return ID;
    },

    addVideo: function() {
      if (!haDash.user) {
        haDash.router.navigate('signin/', { trigger: true });
        this.remove();
      }

      var url = this.$el.find('input').val();
      var ytID = this.YouTubeGetID(url);

      var model = this.model;
      var view = this;

      if (ytID) {
        $.ajax({
          url:
            'https://api.embedly.com/1/oembed?' +
            $.param({
              url: url,
              key: '1db39c7647084d758a34ddd62d2d74e6'
            }),
          success: function(ytData) {
            console.log(ytData);

            //clean yt json
            // var cleanYtData = {};
            //
            // function ytClone(destination, source) {
            //   for (var property in source) {
            //     var prop = property.replace(/\$/g, '_');
            //     if (typeof source[property] === "object" &&
            //      source[property] !== null ) {
            //       destination[prop] = destination[prop] || {};
            //       ytClone(destination[prop], source[property]);
            //     } else {
            //       destination[prop] = source[property];
            //     }
            //   }
            //   return destination;
            // };
            //
            // ytClone(cleanYtData, ytData);

            // var duration = cleanYtData.entry.media_group.media_content["0"].duration;
            // if (duration > 30*60) {
            //   var pass = prompt('Please enter your code to process audio/video longer than 30 minutes','');
            //   if (pass != '808080') {
            //     return;
            //   }
            // }

            // model.set('created', haDash.user);
            model.set('owner', haDash.user);

            var title = ytData.title; // ytData.entry.title["$t"];
            if (!title || title == '') {
              title = 'Untitled';
            }
            model.set('label', title);

            model.set('desc', ytData.description);
            model.set('meta', {
              youtube: ytData
            });
            model.set('source', {
              youtube: {
                type: 'video/youtube',
                url: ytData.url,
                thumbnail: ytData.thumbnail_url
              }
            });

            console.log(model);

            haDash.mediaListView.collection.add(model);

            model.save(null, {
              success: function() {
                haDash.router.navigate('media/', { trigger: true });
                view.remove();
              }
            });
          },
          error: function(ytData) {
            alert('YouTube API threw an error, the video might not exist, or it is private');
          }
        });
      } else if (url.toLowerCase().indexOf('archive.org') >= 0) {
        console.log('IA detected, trying magic.');

        //var curl = 'http://www.corsproxy.com/' + url.replace('http://', '').replace('https://', '');
        // var curl = 'http://cors.hyperaudio.net/proxy.php?csurl=' + escape(url);
        // $.get(curl, function (page) {
        $.ajax({
          url: haDash.API + '/media/about',
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          method: 'post',
          data: JSON.stringify({
            url: url
          })
        })
        .done(function(data) {
        // $.post(curl, {
        //   url: url
        // }, function(data) {
          var page = data.data;
          var title = $(page)
            .filter('meta[property="og:title"]')
            .attr('content');
          var desc = $(page)
            .filter('meta[property="og:description"]')
            .attr('content');
          var thumb = $(page)
            .filter('meta[property="og:image"]')
            .attr('content')
            .replace('https://', 'http://');
          var video0 = $(page)
            .filter('meta[property="og:video"]')
            .attr('content');
          var ext0 = video0.split('.').pop();

          model.set('owner', haDash.user);
          model.set('label', title);
          model.set('desc', desc);
          model.set('meta', {});

          var source = {};

          if (video0 && ext0) {
            source[ext0] = {
              url: video0
            };
            if (thumb) source[ext0].thumbnail = thumb;
            if (ext0 != 'mp4') {
              source.mp4 = {
                url: video0.replace('.' + ext0, '.mp4'),
                thumbnail: thumb
              };
            }
          } else {
            source.unknown = {
              url: url
            };
          }

          model.set('source', source);

          console.log(model);

          haDash.mediaListView.collection.add(model);

          model.save(null, {
            success: function() {
              haDash.router.navigate('media/', { trigger: true });
              view.remove();
            }
          });
          ////
        }).fail(function(e) {
          var ee = $('<pre></pre>').text(e.stack);
          $('#genericError')
            .show()
            .text('Server Error: ' + e.message)
            .append(ee);
        });
      } else {
        //if (confirm('Cannot recognise this URL as an YouTube or Internet Archive Video; choose [cancel] to abort or [ok] to continue')) {

        // var curl = haDash.API + '/about';
        // $.post(curl, { url: url }, function(info) {
        $.ajax({
          url: haDash.API + '/media/about',
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          method: 'post',
          data: JSON.stringify({
            url: url
          })
        })
        .done(function(info) {
          console.log(info);
          // if (typeof info == 'string') {
          if (info.data) {
            alert('URL points to a page not to a media file');
            return;
          }

          if (
            info.headers['content-type'].indexOf('video') != 0 &&
            info.headers['content-type'].indexOf('audio') != 0
          ) {
            alert('URL points to ' + info.headers['content-type'] + ' which is not to a media file');
            return;
          }

          ///"content-length": "4062859",
          if (info.headers['content-length'] && parseInt(info.headers['content-length']) > 300000000) {
            alert(
              'URL points to a ' +
                info.headers['content-length'] +
                'bytes file which is too large for us (please use max 300MB)'
            );
            return;
          }

          var type = info.headers['content-type'].split('/')[1];
          // source[type] = url;
          var source = {};
          source[type] = {
            type: info.headers['content-type'],
            url: url
          };

          // non YT, hope for the best
          model.set('owner', haDash.user);
          model.set('label', 'untitled');
          model.set('desc', url);
          model.set('meta', {});
          model.set('source', source);

          console.log(model);

          haDash.mediaListView.collection.add(model);

          model.save(null, {
            success: function() {
              haDash.router.navigate('media/', { trigger: true });
              view.remove();
            }
          });
        }).fail(function(e) {
          var ee = $('<pre></pre>').text(e.stack);
          $('#genericError')
            .show()
            .text('Server Error: ' + e.message)
            .append(ee);
        }); //post
        //}//confirm
      } //else
    }
  });
})();

/*
          label: "Empty",
          desc: "no content",
          type: "text",
          // sort: 0,
          owner: null,
          meta: {},
          transcripts: []
*/
