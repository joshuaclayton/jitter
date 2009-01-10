Screw.Unit(function() {
  describe("$.jitter.feeds", function() {
    describe("publicTimeline jitter", function() {
      var feed;

      before(function() {
        feed = $.jitter.feeds.publicTimeline;
      });
      
      it("should point to Twitter's public timeline", function() {
        expect(feed.url).to(equal, "http://twitter.com/statuses/public_timeline.json");
      });
      
      it("should have a name of 'public'", function() {
        expect(feed.name).to(equal, "public");
      });
      
      it("should have a title", function() {
        expect(feed.title).to_not(be_empty);
      });
      
      it("should not try to perform a searh", function() {
        expect(feed.performSearch).to(be_undefined);
      });
      
      it("should not track sinceID", function() {
        expect(feed.trackSince).to(be_undefined);
      });
    });
    
    describe("friendsTimeline jitter", function() {
      var feed;
      
      before(function() {
        feed = $.jitter.feeds.friendsTimeline;
      });
      
      it("should point to Twitter's friends timeline", function() {
        expect(feed.url).to(equal, "http://{username}:{password}@twitter.com/statuses/friends_timeline.json");
      });
      
      it("should have a name of 'friends-{username}'", function() {
        expect(feed.name).to(equal, "friends-{username}");
      });
      
      it("should have a title", function() {
        expect(feed.title).to_not(be_empty);
      });
      
      it("should not try to perform a searh", function() {
        expect(feed.performSearch).to(be_undefined);
      });
      
      it("should track sinceID", function() {
        expect(feed.trackSince).to(be_true);
      });
      
      it("should require username", function() {
        expect(feed.requiresUsername).to(be_true);
      });
      
      it("should require password", function() {
        expect(feed.requiresPassword).to(be_true);
      });
    });
    
    describe("groupTimeline jitter", function() {
      var feed;
      
      before(function() {
        feed = $.jitter.feeds.groupTimeline;
      });
      
      it("should point to Twitter's search API", function() {
        expect(feed.url).to(equal, "http://search.twitter.com/search.json");
      });
      
      it("should have a name of 'group-{groupName}'", function() {
        expect(feed.name).to(equal, "group-{groupName}");
      });
      
      it("should require users", function() {
        expect(feed.filteredUsers).to(be_true);
      });
      
      it("should have a title", function() {
        expect(feed.title).to_not(be_empty);
      });
      
      it("should not try to perform a searh", function() {
        expect(feed.performSearch).to(be_undefined);
      });
      
      it("should track sinceID", function() {
        expect(feed.trackSince).to(be_true);
      });
      
      it("should not require username", function() {
        expect(feed.requiresUsername).to(be_undefined);
      });
      
      it("should not require password", function() {
        expect(feed.requiresPassword).to(be_undefined);
      });
    });
    
    describe("userTimeline jitter", function() {
      var feed;
      
      before(function() {
        feed = $.jitter.feeds.userTimeline;
      });
      
      it("should point to Twitter's user timeline", function() {
        expect(feed.url).to(equal, "http://twitter.com/statuses/user_timeline/{username}.json");
      });
      
      it("should have a name of 'user-{username}'", function() {
        expect(feed.name).to(equal, "user-{username}");
      });
      
      it("should have a title", function() {
        expect(feed.title).to_not(be_empty);
      });
      
      it("should not try to perform a searh", function() {
        expect(feed.performSearch).to(be_undefined);
      });
      
      it("should track sinceID", function() {
        expect(feed.trackSince).to(be_true);
      });
      
      it("should require username", function() {
        expect(feed.requiresUsername).to(be_true);
      });
      
      it("should not require password", function() {
        expect(feed.requiresPassword).to(be_undefined);
      });
    });

    describe("directMessages jitter", function() {
      var feed;
      
      before(function() {
        feed = $.jitter.feeds.directMessages;
      });
      
      it("should point to Twitter's friends timeline", function() {
        expect(feed.url).to(equal, "http://{username}:{password}@twitter.com/direct_messages.json");
      });
      
      it("should have a name of 'direct-message-{username}'", function() {
        expect(feed.name).to(equal, "direct-message-{username}");
      });
      
      it("should have a title", function() {
        expect(feed.title).to_not(be_empty);
      });
      
      it("should not try to perform a searh", function() {
        expect(feed.performSearch).to(be_undefined);
      });
      
      it("should track sinceID", function() {
        expect(feed.trackSince).to(be_true);
      });
      
      it("should require username", function() {
        expect(feed.requiresUsername).to(be_true);
      });
      
      it("should require password", function() {
        expect(feed.requiresPassword).to(be_true);
      });
    });
    
    describe("search jitter", function() {
      var feed;
      
      before(function() {
        feed = $.jitter.feeds.search;
      })
      
      it("should point to Twitter's search API", function() {
        expect(feed.url).to(equal, "http://search.twitter.com/search.json");
      });
      
      it("should have a name of 'search-{query}'", function() {
        expect(feed.name).to(equal, "search-{query}");
      });
      
      it("should have a title", function() {
        expect(feed.title).to_not(be_empty);
      });
      
      it("should perform a searh", function() {
        expect(feed.performSearch).to(be_true);
      });
      
      it("should track sinceID", function() {
        expect(feed.trackSince).to(be_true);
      });
      
      it("should not require username", function() {
        expect(feed.requiresUsername).to(be_undefined);
      });
      
      it("should not require password", function() {
        expect(feed.requiresPassword).to(be_undefined);
      });
    });
  });
});
