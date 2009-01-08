(function($) {
  $.jitter.feeds = {
    publicTimeline: {
      url: "http://twitter.com/statuses/public_timeline.json",
      name: "public",
      title: "Public Timeline"
    },
    friendsTimeline: {
      url: "http://{username}:{password}@twitter.com/statuses/friends_timeline.json",
      requiresUsername: true,
      requiresPassword: true,
      trackSince: true,
      name: "friends-{username}",
      title: "Friend Timeline for {username}"
    },
    selectedUserTimeline: {
      url: "http://search.twitter.com/search.json",
      trackSince: true,
      filteredUsers: true,
      name: "search-users-{groupName}",
      title: "{groupName} Timeline"
    },
    userTimeline: {
      url: "http://twitter.com/statuses/user_timeline/{username}.json",
      requiresUsername: true,
      trackSince: true,
      name: "user-{username}",
      title: "Timeline for {username}"
    },
    directMessages: {
      url: "http://{username}:{password}@twitter.com/direct_messages.json",
      trackSince: true,
      requiresUsername: true,
      requiresPassword: true,
      name: "direct-message-{username}",
      title: "Direct Messages for {username}"
    },
    rateLimitStatus: {
      url: "http://twitter.com/account/rate_limit_status.json"
    },
    search: {
      url: "http://search.twitter.com/search.json",
      performSearch: true,
      trackSince: true,
      name: "search-{query}",
      title: "Search Results for '{query}'"
    }
  };
})(jQuery);