(function($) {
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings),
        self = {feed: $.jitter.feeds.process(options)};
    
    var calculateRefreshRate = function() {
      return 1000 * options.refreshRate;
    };
    
    (function() {
      if(self.guid) { return; }
      self.guid = "guid";
    })();
    
    var triggerData = function(data) {
      return {data: data, jitter: self};
    };
    
    var updateTweets = function() {
      $.ajax({
        type: "GET",
        url: self.feed.url({jitter: self}),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }
          if(!!self.feed.trackSince && data[0]) { self.sinceID = data[0].id; }
          $(document).trigger("jitter-success", triggerData(data));
        }
      });
    };
    
    self.start = function() {
      updateTweets();
      if(!self.timer) {
        self.timer = $.timer(calculateRefreshRate(), function(t) { updateTweets(); });
        this.stop = function() { self.timer.stop(); };
      }
    };
    
    return self;
  };
})(jQuery);