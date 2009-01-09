(function($) {
  $.timer = function (interval, callback) {
    interval = interval || 100;
    if (!callback) { return false; }
    var _timer = function (i, c) {
      var public = {};
      public.stop = function () { clearInterval(public.id); };
      public.internalCallback = function () { c(public); };
      public.reset = function (resetInterval) {
        if (public.id) { clearInterval(public.id); }
        resetInterval = resetInterval || public.interval;
        public.id = setInterval(public.internalCallback, resetInterval);
      };
      public.interval = i;
      public.id = setInterval(public.internalCallback, public.interval);
      return public;
    };
    return _timer(interval, callback);
  };
})(jQuery);
