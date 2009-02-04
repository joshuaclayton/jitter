// tweet read handler;
$(document).bind("jitter-tweet-read", function(event, info) {
  info.tweets.siblings(".current").removeClass("current").end().addClass("read");
  if(info.markAsCurrent)    { info.tweets.addClass("current"); }
  if(info.scrollToCurrent)  { $(document).scrollTo($("div.tweet.current"), 200); }
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
    
    var $tweetElements = $wrapper.children().hide().prependTo($target.find(".tweets"));
    
    if($.jitter.window.currentlyFilteredToFeed(info.jitter.feed) || $.jitter.window.currentlyFilteredToAll()) {
      $tweetElements.fadeIn("slow");
    }
  }
});

// refresh timestamps and update unread counts
$(document).bind("jitter-success", function(event, info) {
  $.jitter.window.refreshTimestamps();
  $(document).data("jitter-unread", ($(document).data("jitter-unread") || 0) + info.data.length);
  $(document).data("jitter-unread-" + info.jitter.feed.className, ($(document).data("jitter-unread-" + info.jitter.feed.className) || 0) + info.data.length);
});

// tweet read/unread count
$(document).bind("jitter-tweet-read", function(event, info) {
  $.each(info.tweets, function(index, tweet) {
    if($(tweet).data("tweet-read") === true) { return; }
    var unreadCountHandle = "jitter-unread-" + $(tweet).data("jitter").feed.className,
        unreadCount = $(document).data(unreadCountHandle);
    $(tweet).data("tweet-read", true);
    $(document).data("jitter-unread", $(document).data("jitter-unread") - 1);
    $(document).data(unreadCountHandle, unreadCount - 1);
  });
});

// create filter link when jitter starts
$(document).bind("jitter-started", function(event, info) {
  $.jitter.window.build.filter(info.jitter).appendTo($(".jitter-filters"));
});

$(document).bind("jitter-change", function(event, info) {
  if(info.jitter.feed.className) {
    $("div.tweet:not(." + info.jitter.feed.className + ")").hide();
    $("div.tweet." + info.jitter.feed.className).show();
  } else {
    $("div.tweet").show();
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