(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".tweets").length) {
      target.append($("<div class='tweets prepend-6 span-18 last'/>"));
    }
    
    var builder = $.jitter.builder(target, options);
    
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
          
          if(keyPressed == "H") {
            e.preventDefault();
            hideVisibleTweets();
          } else if(keyPressed == "U") {
            e.preventDefault();
            showHiddenTweets();
          } else if(keyPressed == "O") {
            e.preventDefault();
            openTweetAuthorTwitterPage();
          } else if(keyPressed == "P") {
            e.preventDefault();
            openTweetLinkedURLs();
          } else if(keyPressed == "J") {
            e.preventDefault();
            setCurrentToFirstTweet();
          } else if(keyPressed == "I") {
            e.preventDefault();
            setCurrentToPrevTweet();
          } else if(keyPressed == "L") {
            e.preventDefault();
            setCurrentToLastTweet();
          } else if(keyPressed == "K") {
            e.preventDefault();
            setCurrentToNextTweet();
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