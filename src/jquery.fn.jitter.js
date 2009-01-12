$.fn.jitter = function(options) {
  var target = this;
  
  if(!target.find(".jitter-filters").length) {
    var filters = $("<div class='jitter-filters'/>");
    var filterAll = 
      $("<a/>").
        html("All Feeds").
        attr("href", "#").
        attr("id", "show-all").
        addClass("active").
        addClass("allTweets");
    filters.append(filterAll);
    target.prepend(filters);
  }
  
  alert(options);
  
  var builder = $.jitter.builder(target, options);
  
  if(typeof($(".allTweets").click) !== "function") {
    $(".allTweets").click(function() {
      var $this = $(this);
      $this.parent().children().removeClass("active");
      $this.addClass("active");
      $this.attr("displayTweets", ".tweet");
      builder.showTweets(target, $this.attr("displayTweets"), 20);
    });
  }
  
  return this;
};