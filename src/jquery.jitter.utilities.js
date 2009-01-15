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
        text = text.replace(RegExp(item, "g"), $.twitterURL(item).parent().html());
      });
    }
    
    return text;
  };
  
  $.fn.watchAttribute = function(attribute, triggerName) {
    var self = this;
    var cachedAttribute = self.attr(attribute);
    
    $.timer(50, function(t) {
      if(self.attr(attribute) != cachedAttribute) {
        self.trigger(triggerName);
        cachedAttribute = self.attr(attribute);
      }
    });
    
    return self;
  };
  
})(jQuery);