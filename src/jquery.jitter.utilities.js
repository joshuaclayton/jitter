(function($) {
  $.extend(String.prototype, {
    cssClassify: function(sep) {
      sep = sep || "-";
      return this.replace(/[^\x00-\x7F]+/, '')
        .replace(/[^\w\-_\+]+/g, sep)
        .replace(new RegExp(sep + "+"), sep)
        .replace(new RegExp("^" + sep + "|" + sep + "$"), '')
        .toLowerCase();
    },
    toCSSClass: function() { return (arguments[0] || "") + "." + this; },
    interpolate: function(obj) {
      var result = this;
      $.each(result.match(/\{\w+\}/g), function(i, item) {
        var k = item.replace(/\{|\}/g, '');
        if(obj[k]) { result = result.replace(new RegExp(item), obj[k]); }
      });
      return result;
    },
    strip: function() { return this.replace(/^ +| +$/g, ''); }
  });
  $.extend(Array.prototype, {
    compact: function() {
      var result = [];
      $.each(this, function(idx, item) {
        if(item === null) { return; }
        result.push(item);
      });
      return result;
    },
    uniq: function() {
      var resultArray = this.sort(function(a,b) { if(JSON.stringify(a) == JSON.stringify(b)) { return 0; } if(JSON.stringify(a) > JSON.stringify(b)) { return 1; } return -1; }),
          first = 0,
          last = resultArray.length;

      for(var alt; (alt = first) != last && ++first != last; ) {
        if(resultArray[alt] === resultArray[first] || JSON.stringify(resultArray[alt]) == JSON.stringify(resultArray[first])) {
          for(; ++first != last;) {
            if (resultArray[alt] !== resultArray[first] && JSON.stringify(resultArray[alt]) != JSON.stringify(resultArray[first])) { resultArray[++alt] = resultArray[first]; }
          }
          ++alt;
          resultArray.length = alt;
          return resultArray;
        }
      }

      return resultArray;
    },
    remove: function(obj) {
      if(typeof(obj) == "object") {
        var translatedThis = [];
        $.each(this, function(idx, item) {
          translatedThis.push(JSON.stringify(item));
        });
        var idx = translatedThis.indexOf(JSON.stringify(obj));
        if(idx != -1) { this.splice(idx, 1); }
      } else {
        this.splice(this.indexOf(obj), 1);
      }
      return this;
    }
  });
})(jQuery);

(function($) {
  $.twitter = {
    urls: {
      user: "http://twitter.com/{username}",
      status: "http://twitter.com/{username}/status/{id}"
    },
    domID: function(tweet) { return "tweet-{id}".interpolate({id: tweet.id}); },
    tweetURL: function(tweet) { return $.twitter.urls.status.interpolate({username: $.twitter.username(tweet), id: tweet.id}); },
    image: function(tweet) { return $("<img />").attr({src: (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url), width: 48, height: 48}); },
    timestamp: function(tweet) { return new Date(tweet.created_at).toUTCString(); },
    prettyTimestamp: function(tweet) { return $.prettyDate(tweet.created_at); },
    username: function(tweet) { return tweet.user ? tweet.user.screen_name : tweet.from_user; },
    displayName: function(tweet) { return tweet.user ? tweet.user.name : tweet.from_user; },
    userURL: function(tweet) {
      var username, displayName;
      
      if(typeof(tweet) == "object") {
        username    = $.twitter.username(tweet);
        displayName = $.twitter.displayName(tweet);
      } else if(typeof(tweet) == "string") {
        username    = tweet.replace(/\@/, '');
        displayName = tweet;
      }
      
      return $("<a />").attr({href: $.twitter.urls.user.interpolate({username: username}), target: "_blank"}).html(displayName);
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
    }
  };
})(jQuery);

(function($) {
  $.fn.outerHTML = function() { return $("<div/>").append(this.eq(0).clone()).html(); };
  $.guid = function() { return +new Date(); };
})(jQuery);

(function($) {
  $.prettyDate = function(time) {
    var date = new Date(time || ""),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) { return time; }
    
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
