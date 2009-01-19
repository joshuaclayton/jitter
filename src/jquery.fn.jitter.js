(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".tweets").length) {
      target.append($("<div class='tweets prepend-6 span-18 last'/>"));
    }
    
    $.jitter.builder(target, options);
    
    $(".tweet").live("click", function(e) {
      $(this).siblings().removeClass("current");
      $(this).addClass("read").addClass("current");
      e.stopPropagation();
    });
    
    var triggerTweet = function(t) {
      t.trigger("click");
      $(document).scrollTo($(".tweet.current"), 500);
    };
    
    $(document).keydown(function(e) {
      var currentTweet = $(".tweet.current").length;
      if(e.which == 72) { // h
        $(".tweet.read").hide();
      } else if(e.which == 85) { // u
        $(".tweet.read:hidden").show();
      } else if(e.which == 79) {// o
        window.location = $(".tweet .author .displayName a").attr("href");
      } else if(e.which == 74) { // j
        triggerTweet($(".tweet:visible:eq(0)"));
      } else if(e.which == 73) { // i
        triggerTweet($(".tweet.current").prev(":visible"));
      } else if(e.which == 76) { // l
        triggerTweet($(".tweet:visible:last"));
      } else if(e.which == 75) { // k
        triggerTweet($(".tweet.current").next(":visible"));
      }
    });
    
    return target;
  };
})(jQuery);