(function($) {
  var timer = function(interval, callback) {
    var self = {};
    $.extend(self, {
      id: setInterval(self.internalCallback, self.interval),
      interval: interval,
      stop: function() { clearInterval(self.id); },
      internalCallback: function() { callback(self); },
      reset: function(resetInterval) {
        if(self.id) { clearInterval(self.id); }
        self.id = setInterval(self.internalCallback, resetInterval || self.interval);
      }
    });
    return self;
  };
  
  $.timer = function(interval, callback) {
    return callback ? timer(interval || 100, callback) : false;
  };
})(jQuery);