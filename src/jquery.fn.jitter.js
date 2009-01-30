(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".tweets").length) { target.append($("<div class='tweets prepend-6 span-18 last'/>")); }
    
    $.jitter.builder(target, options);
    
    return target;
  };
})(jQuery);