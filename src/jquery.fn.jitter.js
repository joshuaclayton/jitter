(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".tweets").length) { target.append($("<div class='tweets prepend-6 span-18 last'/>")); }
    
    $.jitter.builder(target, options);
    
    (function() {
      var currentFilteredClass = function() {
        var potentialFilterClass = target.find(".jitter-filters a.active").attr("id");
        if(potentialFilterClass) {
          return "." + potentialFilterClass;
        }
        return "";
      };
      
      var triggerTweet = function(t) {
        t.trigger("click");
      };

      var hideVisibleTweets = function() { $(".tweet.read" + currentFilteredClass()).addClass("no-show"); $(".tweet.no-show:visible").hide(); };
      var showHiddenTweets = function() { $(".tweet.no-show" + currentFilteredClass()).show().removeClass("no-show"); };
      var openTweetAuthorTwitterPage = function() { window.open($(".tweet.current .author .displayName a").attr("href"), "_blank"); };
      var openTweetLinkedURLs = function() { 
        $(".tweet.current .tweetBody a").each(function(idx, anchor) {
          window.open($(anchor).attr("href"), "_blank");
        });
      };
      var setCurrentToFirstTweet = function() { triggerTweet($(".tweet:visible:first")); };
      var setCurrentToNextTweet = function() { triggerTweet($(".tweet.current").next(":visible")); };
      var setCurrentToPrevTweet = function() { triggerTweet($(".tweet.current").prev(":visible")); };
      var setCurrentToLastTweet = function() { triggerTweet($(".tweet:visible:last")); };
      
      $(".tweet").live("click", function(e) {
        $(this)
          .siblings().removeClass("current").end()
          .addClass("read").addClass("current");
        $(document).scrollTo($(".tweet.current"), 200);
      });
      
      if(!$(document).data("keypressAssigned")) {
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
        $(document).data("keypressAssigned", true);
      }
    })();
    return target;
  };
})(jQuery);