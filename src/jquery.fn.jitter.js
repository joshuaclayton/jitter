(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".jitter-filters").length) {
      var filters = $("<div class='jitter-filters'/>");
      var filterAll = 
        $("<a/>").
          html("All Feeds").
          attr({href: "#", id: "tweets"}).
          addClass("active allTweets");
      filters.append(filterAll);
      target.prepend(filters);
    }
    
    if(!target.find(".tweets").length) {
      target.append($("<div class='tweets'/>"));
    }
    
    var builder = $.jitter.builder(target, options);
    
    $(".allTweets").click(function() {
      var $this = $(this);
      $this.parent().children().removeClass("active");
      $this.
        addClass("active").
        attr("displayTweets", ".tweet");
      builder.showTweets(target, $this.attr("displayTweets"), builder.showTweetCount($this));
    });
    
    return target;
  };
})(jQuery);