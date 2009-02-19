(function($) {
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings),
        self = {feed: $.jitter.feeds.process(options), settings: options},
        tweets = false;
    
    var updateTweets = function() {
      $.ajax({
        type: "GET",
        url: self.feed.url({jitter: self}),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }
          if(!!self.feed.trackSince && data[0]) { self.sinceID = data[0].id; }
          if(tweets) { data = data.reverse(); }
          $(document).trigger("jitter-success", {data: data, jitter: self});
          if(!tweets && data) { tweets = true; }
        },
        beforeSend:function(xhr){
          if(self.feed.requiresUsername && self.feed.requiresPassword) {
            xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(self.settings.username + ":" + self.settings.password));
            xhr.setRequestHeader("Cookie", '');
          }
        }
      });
    };
    
    self.start = function() {
      $(document).trigger("jitter-started", {jitter: self});
      updateTweets();
      if(!self.timer) {
        self.timer = $.timer(1000 * options.refreshRate, function(t) { updateTweets(); });
        this.stop = function() { $(document).trigger("jitter-stopped", {jitter: self}); self.timer.stop(); return self; };
      }
      return self;
    };
    
    return self;
  };
})(jQuery);
