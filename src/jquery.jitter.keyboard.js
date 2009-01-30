(function($) {
  $.jitter.keyboard = function() {
    if($(document).data("keypressesBound")) { return; }
    
    var currentFilteredClass = function() {
      var potentialFilterClass = target.find(".jitter-filters a.active").attr("id");
      if(potentialFilterClass) { return "." + potentialFilterClass; }
      return "";
    };
    
    var triggerTweet = function(t) { t.trigger("click"); };
    var hideVisibleTweets = function() { $("div.tweet.read" + currentFilteredClass()).addClass("no-show"); $("div.tweet.no-show:visible").hide(); };
    var showHiddenTweets = function() { $("div.tweet.no-show" + currentFilteredClass()).show().removeClass("no-show"); };
    var openTweetAuthorTwitterPage = function() { window.open($("div.tweet.current div.author div.displayName a").attr("href"), "_blank"); };
    var openTweetLinkedURLs = function() { 
      $("div.tweet.current div.tweetBody a").each(function(idx, anchor) {
        window.open($(anchor).attr("href"), "_blank");
      });
    };
    var setCurrentToFirstTweet = function() { triggerTweet($("div.tweet:visible:first")); };
    var setCurrentToNextTweet = function() { triggerTweet($("div.tweet.current").nextAll(":visible:first")); };
    var setCurrentToPrevTweet = function() { triggerTweet($("div.tweet.current").prevAll(":visible:first")); };
    var setCurrentToLastTweet = function() { triggerTweet($("div.tweet:visible:last")); };
    var markAllAsRead = function() { }
    $(document).keydown(function(e) {
      if (/(input|textarea|select)/i.test(e.target.nodeName)) { return; }

      var keyPressed = String.fromCharCode(e.which);
      
      var keyMappings = {
        "H": hideVisibleTweets,
        "U": showHiddenTweets,
        "O": openTweetAuthorTwitterPage,
        "P": openTweetLinkedURLs,
        "J": setCurrentToFirstTweet,
        "37": setCurrentToFirstTweet,
        "I": setCurrentToPrevTweet,
        "38": setCurrentToPrevTweet,
        "L": setCurrentToLastTweet,
        "39": setCurrentToLastTweet,
        "K": setCurrentToNextTweet,
        "40": setCurrentToNextTweet
      };
      
      if(keyMappings[keyPressed] || keyMappings[e.which]) {
        e.preventDefault();
        keyMappings[keyPressed] ? keyMappings[keyPressed]() : keyMappings[e.which]();
      }
      
      var number = new Number(keyPressed);
      if(number && number >= 0) {
        var anch = $(".jitter-filters a:eq(" + number + ")");
        if(anch) { e.preventDefault(); anch.trigger("click"); }
      }
    });
    $(document).data("keypressesBound", true);
  };
})(jQuery);