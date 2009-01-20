(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".tweets").length) {
      target.append($("<div class='tweets prepend-6 span-18 last'/>"));
    }
    
    var builder = $.jitter.builder(target, options);
    
    (function() {
      $(".tweet").live("click", function(e) {
        $(this).siblings().removeClass("current");
        $(this).addClass("read").addClass("current");
      });
      
      var currentFilteredClass = function() {
        var potentialFilterClass = target.find(".jitter-filters a.active").attr("id");
        if(potentialFilterClass) {
          return "." + potentialFilterClass;
        }
        return "";
      };
      
      var triggerTweet = function(t) {
        t.trigger("click");
        $(document).scrollTo($(".tweet.current"), 200);
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

      if(!$(document).data("keypressAssigned")) {
        $(document).keydown(function(e) {
          if (/(input|textarea|select)/i.test(e.target.nodeName)) { return; } 
          
          var currentTweet = $(".tweet.current:visible").length;
          var keyPressed = String.fromCharCode(e.which);
          
          if(keyPressed == "H") {
            hideVisibleTweets();
          } else if(keyPressed == "U") {
            showHiddenTweets();
          } else if(keyPressed == "O") {
            openTweetAuthorTwitterPage();
          } else if(keyPressed == "P") {
            openTweetLinkedURLs();
          } else if(keyPressed == "J") {
            setCurrentToFirstTweet();
          } else if(keyPressed == "I") {
            setCurrentToPrevTweet();
          } else if(keyPressed == "L") {
            setCurrentToLastTweet();
          } else if(keyPressed == "K") {
            setCurrentToNextTweet();
          }
          var number = new Number(keyPressed);
          if(number) {
            var anch = $(".jitter-filters a:eq(" + number + ")");
            if(anch) { anch.trigger("click"); }
          }
        });
        $(document).data("keypressAssigned", true);
      }
    })();
    return target;
  };
})(jQuery);