(function($) {
  $.jitter.bindings = function() {
    $(document).bind("jitter-tweet-read", function(event, info) {
      if(!info.tweets.length) { return; }
      
      var currentSiblings = info.tweets.siblings();
      if(currentSiblings.length) {
        currentSiblings.removeClass('current');
      }
      info.tweets.filter(":not(.tweet-read)").addClass("read");
      
      if(info.markAsCurrent)    { info.tweets.addClass("current"); }
      if(info.scrollToCurrent)  { $.jitter.window.tweets.current.scrollTo(); }
    });
    
    $(document).bind("jitter-tweet-archive", function(event, info) {
      if(!info.tweets.length) { return; }
      $(document).trigger("jitter-tweet-read", {tweets: info.tweets});
      info.tweets.appendTo($("#tweets-archive").find($(info.tweets[0]).data("jitter").feed.className.toCSSClass("div")));
    });
    
    $(document).bind("jitter-tweet-delete", function(event, info) {
      info.tweets.remove();
    });
    
    $(document).bind("jitter-success", function(event, info) {
      var tweets = info.data,
          $target = $.jitter.window.container();
      
      if(!$target || !tweets.length) { return; }
      
      var $wrapper = $("<div/>");
      $.each(tweets, function(index, tweet) {
        $.jitter.window.build.tweet(tweet, info.jitter).appendTo($wrapper);
      });
      
      if(!$target.find("#tweets").find(info.jitter.feed.className.toCSSClass("div")).length) {
        var $feedWrapper = $("<div/>")
          .addClass(info.jitter.feed.className)
          .addClass("feed-wrapper");
        
        if(!$.jitter.window.currentlyFilteredToFeed(info.jitter.feed)) {
          $feedWrapper.hide();
        }
        
        $feedWrapper
          .appendTo($("#tweets"))
          .clone()
          .appendTo($("#tweets-archive"));
      }
      
      var $tweetElements = $wrapper.children()[$("#tweets").find(info.jitter.feed.className.toCSSClass("div")).find(".tweet").length ? "prependTo" : "appendTo"]($target.find("#tweets").find(info.jitter.feed.className.toCSSClass("div")));
      
      if($.jitter.window.currentlyFilteredToFeed(info.jitter.feed) || $.jitter.window.currentlyFilteredToAll()) {
        $tweetElements.fadeIn("slow");
        $.jitter.window.tweets.current.scrollTo();
      }
    });
    
    $(document).bind("jitter-success", function(event, info) {
      if(!info.data.length) { return; }
      $(document).data("jitter-unread", ($(document).data("jitter-unread") || 0) + info.data.length);
      $(document).data("jitter-unread-" + info.jitter.feed.className, ($(document).data("jitter-unread-" + info.jitter.feed.className) || 0) + info.data.length);
    });
    
    $(document).bind("jitter-tweet-read", function(event, info) {
      var $unreadTweets = info.tweets.filter(":not(.tweet-read)");
      
      if(!$unreadTweets.length) { return; }
      
      if($unreadTweets.filter($.jitter.window.currentlyFilteredClass()).length === $unreadTweets.length && $.jitter.window.currentFeed()) {
        var unreadCountHandle = "jitter-unread-" + $.jitter.window.currentFeed().className,
            unreadCount = $(document).data(unreadCountHandle);
        $(document).data(unreadCountHandle, unreadCount - $unreadTweets.length);
      } else {
        $unreadTweets.each(function(itx, tweet) {
          var unreadCountHandle = "jitter-unread-" + $(tweet).data("jitter").feed.className,
              unreadCount = $(document).data(unreadCountHandle);
          $(document).data(unreadCountHandle, unreadCount - 1);
        });
      }
      
      $(document).data("jitter-unread", $(document).data("jitter-unread") - $unreadTweets.length);
      $unreadTweets.addClass("tweet-read");
    });
    
    // create filter link when jitter starts
    $(document).bind("jitter-started", function(event, info) {
      $.jitter.window.build.filter(info.jitter).appendTo($(".jitter-filters"));
    });
    
    // create filter link when jitter stops
    $(document).bind("jitter-stopped", function(event, info) {
      $("#tweets").find(info.jitter.feed.className.toCSSClass("div")).remove();
      $("#tweets-archive").find(info.jitter.feed.className.toCSSClass("div")).remove();
      $(info.jitter.feed.className.toCSSClass(".jitter-filter")).remove();
      
      var unreadCountHandle = "jitter-unread-" + info.jitter.feed.className,
          unreadCount = $(document).data(unreadCountHandle);
      $(document).data(unreadCountHandle, 0);
      $(document).data("jitter-unread", $(document).data("jitter-unread") - unreadCount);
    });
    
    $(document).bind("jitter-change", function(event, info) {
      if(info.jitter.feed.className) {
        $("#tweets .feed-wrapper").find(".current").removeClass("current");
        $("#tweets .feed-wrapper").hide();
        $("#tweets").find(info.jitter.feed.className.toCSSClass("div")).show();
        $(".jitter-filter").removeClass("active");
        $(".jitter-filter").filter(info.jitter.feed.className.toCSSClass()).addClass("active");
      } else {
        $("#tweets div.tweet:hidden").show();
      }
    });
    
    $(document).bind("setData", function(e, key, val) {
      if(/^jitter-unread$/.test(key)) {
        var $title = $("head title"),
            strippedTitle = $title.html().replace(/\s+\(.+\)/, '');
        $title.html(strippedTitle + " (" + val + ")");
        
        if(window.document.title) { window.document.title = $title.html(); }
        if(window.fluid)          { window.fluid.dockBadge = val ? val : null; }
      } else if(/^jitter-unread\-(.+)$/.test(key)) {
        var matches = key.match(/^jitter-unread\-(.+)$/);
        if(matches){
          var className = matches[1];
          if($(className.toCSSClass(".jitter-filter"))) {
            $(className.toCSSClass(".jitter-filter")).data("unreadCount", val);
          }
        }
      }
    });
    
    $(document).bind("setData", function(e, key, val) {
      if(/^jitter-current$/.test(key)) { $(document).trigger("jitter-change", {jitter: val}); }
    });
    
    $(document).ready(function() {
      $.timer(60 * 1000, function(t) {
        $.jitter.window.refreshTimestamps();
      });
    });
  };
})(jQuery);
