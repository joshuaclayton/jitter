(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".jitter-filters").length) {
      var filters = $("<div class='jitter-filters span-6'/>");
      
      var filterAll = 
        $("<a/>")
          .html("All Feeds")
          .attr({href: "#", id: "tweets"})
          .addClass("active allTweets");
      filters.append(filterAll);
      target.prepend(filters);
    }
    
    if(!target.find(".tweets").length) {
      target.append($("<div class='tweets span-18 last'/>"));
    }
    
    var builder = $.jitter.builder(target, options);
    
    $(".allTweets").click(function() {
      var $this = $(this);
      $this.siblings().removeClass("active");
      $this
        .addClass("active")
        .data("displayTweets", ".tweet");
      builder.showTweets(target, $this.data("displayTweets"), builder.showTweetCount($this));
    });
    
    return target;
  };
})(jQuery);