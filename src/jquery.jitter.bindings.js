// tweet read handler;
$(document).bind("jitter-tweet-read", function(event, info) {
  if(info.tweets.siblings(".current").length) {
    info.tweets.siblings(".current").removeClass("current");
  }
  
  info.tweets.addClass("read");
  if(info.markAsCurrent)    { info.tweets.addClass("current"); }
  if(info.scrollToCurrent)  { $.jitter.window.tweets.current.scrollTo(); }
});

// building tweet HTML / appending to document
$(document).bind("jitter-success", function(event, info) {
  var tweets = info.data,
      $target = $.jitter.window.container();
  
  if(!$target) { return; }
  
  if(tweets.length) {
    var $wrapper = $("<div/>");
    $.each(tweets, function(index, tweet) {
      $.jitter.window.build.tweet(tweet, info.jitter).appendTo($wrapper);
    });
    
    var $tweetElements = $wrapper.children().hide().prependTo($target.find("div.tweets"));
    
    if($.jitter.window.currentlyFilteredToFeed(info.jitter.feed) || $.jitter.window.currentlyFilteredToAll()) {
      $tweetElements.fadeIn("slow", function() { $.jitter.window.tweets.current.scrollTo(); });
    }
  }
});

// refresh timestamps and update unread counts
$(document).bind("jitter-success", function(event, info) {
  $(document).data("jitter-unread", ($(document).data("jitter-unread") || 0) + info.data.length);
  $(document).data("jitter-unread-" + info.jitter.feed.className, ($(document).data("jitter-unread-" + info.jitter.feed.className) || 0) + info.data.length);
});

// tweet read/unread count
$(document).bind("jitter-tweet-read", function(event, info) {
  $.each(info.tweets, function(index, tweet) {
    if($(tweet).data("tweet-read") === true) { return; }
    var unreadCountHandle = "jitter-unread-" + $(tweet).data("jitter").feed.className,
        unreadCount = $(document).data(unreadCountHandle);
        
    $(document).data(unreadCountHandle, unreadCount - 1);
    
    $(tweet).data("tweet-read", true);
    $(document).data("jitter-unread", $(document).data("jitter-unread") - 1);
  });
});

// create filter link when jitter starts
$(document).bind("jitter-started", function(event, info) {
  $.jitter.window.build.filter(info.jitter).appendTo($(".jitter-filters"));
});

$(document).bind("jitter-change", function(event, info) {
  if(info.jitter.feed.className) {
    $("div.tweet:visible").hide();
    $("div.tweet." + info.jitter.feed.className).show();
  } else {
    $("div.tweet:hidden").show();
  }
  $.jitter.window.tweets.current.setToFirst();
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
      if($(".jitter-filter." + className)) {
        $(".jitter-filter." + className).data("unreadCount", val);
      }
    }
  }
});

$(document).bind("setData", function(e, key, val) {
  if(/^jitter-current$/.test(key)) {
    $(document).trigger("jitter-change", {jitter: val});
  }
});

$(document).ready(function() {
  $.timer(60 * 1000 * 5, function(t) {
    $.jitter.window.refreshTimestamps(); 
  });
  
  $.timer(10 * 1000, function(t) {
    $("div.tweet.read:not(.current)").slideUp();
  });
});