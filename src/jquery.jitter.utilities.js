(function($) {
  $.twitterURL = function(tweet) {
    var username, displayName;
    
    if(typeof(tweet) === "object") {
      username    = tweet.user ? tweet.user.screen_name : tweet.from_user;
      displayName = tweet.user ? tweet.user.name : tweet.from_user;
    } else if(typeof(tweet) === "string") {
      username = tweet.replace(/\@/, '');
      displayName = tweet;
    }
    
    return $("<a/>").
      attr("href", "http://twitter.com/" + username).
      html(displayName);
  };
  
  $.twitterImage = function(tweet) {
    return $("<img/>").attr("src", (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url));
  };
  
  $.linkTwitterUsernames = function(text) {
    var urlMatches = text.match(/https?\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!]/g);
    if(urlMatches) {
      $.each(urlMatches, function(idx, item) {
        text = text.replace(RegExp(item, "g"), '<a href="' + item + '">' + item + '</a>');
      });
    }
    
    var twitterReplies = text.match(/(\@\w+)/g);
    
    if(twitterReplies) {
      $.each(twitterReplies, function(idx, item) {
        text = text.replace(RegExp(item, "g"), $.twitterURL(item).outerHTML());
      });
    }
    
    return text;
  };
  
  $.fn.outerHTML = function() {
    return $("<div/>").append(this.eq(0).clone()).html();
  };
})(jQuery);

(function($) {
  var binder = function(e, dataKey, dataValue) {
    var $this = $(this),
        oldValue = $this.data(dataKey),
        newValue = dataValue,
        passed = {
          attr: dataKey,
          from: oldValue,
          to:   newValue
        };
    if(oldValue !== newValue) { $this.trigger(dataKey + "Changed", passed); $this.trigger("dataChanged", passed); }
  };
  
  $.fn.observeData = function() {
    return $(this).each(function() {
      $(this).bind("setData", binder);
    });
  };
})(jQuery);