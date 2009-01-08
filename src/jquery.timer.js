(function($) {
  $.timer = function (interval, callback) {
    var interval = interval || 100;
    if (!callback) { return false; }
    _timer = function (interval, callback) {
      this.stop = function () { clearInterval(self.id); };
      this.internalCallback = function () { callback(self); };
      this.reset = function (val) {
        if (self.id) { clearInterval(self.id); }
        var val = val || 100;
        this.id = setInterval(this.internalCallback, val);
      };
      this.interval = interval;
      this.id = setInterval(this.internalCallback, this.interval);
      var self = this;
      
      return self;
    };
    return _timer(interval, callback);
  };
})(jQuery);
