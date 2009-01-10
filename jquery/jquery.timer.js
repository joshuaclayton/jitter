(function($) {
  $.timer = function (interval, callback) {
    interval = interval || 100;
    if (!callback) { return false; }
    var _timer = function (i, c) {
      var self = {};
      self.stop = function () { clearInterval(self.id); };
      self.internalCallback = function () { c(self); };
      self.reset = function (resetInterval) {
        if (self.id) { clearInterval(self.id); }
        resetInterval = resetInterval || self.interval;
        self.id = setInterval(self.internalCallback, resetInterval);
      };
      self.interval = i;
      self.id = setInterval(self.internalCallback, self.interval);
      return self;
    };
    return _timer(interval, callback);
  };
})(jQuery);
