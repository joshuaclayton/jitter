String.prototype.cssClassify = function(sep) {
  sep = sep || "-";
  return this.replace(/[^\x00-\x7F]+/, '')
    .replace(/[^\w\-_\+]+/g, sep)
    .replace(new RegExp(sep + "+"), sep)
    .replace(new RegExp("^" + sep + "|" + sep + "$"), '')
    .toLowerCase();
};

String.prototype.interpolate = function(obj) {
  var result = this,
      matches = result.match(/\{\w+\}/g);
  $.each(matches, function(i, item) {
    var k = item.replace(/\{|\}/g, '');
    if(obj[k]) {
      result = result.replace(new RegExp(item), obj[k]);
    }
  });
  return result;
};

String.prototype.strip = function() {
  return this.replace(/^ +| +$/g, '');
};

(function($) {
  $.twitter = {
    urls: {
      user: "http://twitter.com/{username}",
      status: "http://twitter.com/{username}/status/{id}"
    },
    userURL: function(tweet) {
      var username, displayName;
      
      if(typeof(tweet) == "object") {
        username    = $.twitter.username(tweet);
        displayName = $.twitter.displayName(tweet);
      } else if(typeof(tweet) == "string") {
        username = tweet.replace(/\@/, '');
        displayName = tweet;
      }
      
      return $("<a />").attr({href: $.twitter.urls.user.interpolate({username: username}), target: "_blank"}).html(displayName);
    },
    tweetURL: function(tweet) {
      return $.twitter.urls.status.interpolate({username: $.twitter.username(tweet), id: tweet.id});
    },
    image: function(tweet) {
      return $("<img />").attr({src: (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url), width: 48, height: 48});
    },
    linkedText: function(tweet) {
      var text = tweet.text,
          urlMatches = text.match(/https?\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!]/g),
          twitterReplies = text.match(/(\@\w+)/g);
      
      if(urlMatches) {
        $.each(urlMatches, function(idx, item) {
          text = text.replace(RegExp(item, "g"), $("<a/>").attr({href: item, target: "_blank"}).html(item).outerHTML());
        });
      }
      
      if(twitterReplies) {
        $.each(twitterReplies, function(idx, item) {
          text = text.replace(RegExp(item, "g"), $.twitter.userURL(item).outerHTML());
        });
      }
      
      return text;
    },
    timestamp: function(tweet) {
      return new Date(tweet.created_at).toUTCString();
    },
    prettyTimestamp: function(tweet) {
      return $.prettyDate(tweet.created_at);
    },
    username: function(tweet) {
      return tweet.user ? tweet.user.screen_name : tweet.from_user;
    },
    displayName: function(tweet) {
      return tweet.user ? tweet.user.name : tweet.from_user;
    }
  };
})(jQuery);

(function($) {
  $.fn.outerHTML = function() {
    return $("<div/>").append(this.eq(0).clone()).html();
  };
  
  $.fn.defaultValueActsAsHint = function() {
    var handleItem = function(idx, item) {
      var $item = $(item);
      $item
        .data("defaultValue", $item.val())
        .addClass("hint")
        .focus(function() {
          if($(this).data("defaultValue") != $(this).val()) { return; }
          $(this).removeClass("hint").val("");
        }).blur(function() {
          if($(this).val().strip() != "") { return; }
          $(this).addClass("hint").val($(this).data("defaultValue"));
        });
    };
    
    var $inputs = $("<div/>").append(this).find("input");
    var $textareas = $("<div/>").append(this).find("textarea");
    
    $.each($inputs, handleItem);
    $.each($textareas, handleItem);
    
    return this;
  };
})(jQuery);

(function($) {
  $.prettyDate = function(time) {
    var date = new Date(time || ""),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
      return time;

    return day_diff == 0 && (
        diff < 60 && "just now" ||
        diff < 120 && "1 minute ago" ||
        diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
        diff < 7200 && "1 hour ago" ||
        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
      day_diff == 1 && "Yesterday" ||
      day_diff < 7 && day_diff + " days ago" ||
      day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
  };
})(jQuery);

(function($) {
  $.log = function(text) {
    if(window.console) {
      window.console.log(text);
    } else {
      alert(text);
    }
  };
})(jQuery);