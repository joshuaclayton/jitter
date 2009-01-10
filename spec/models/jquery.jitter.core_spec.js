Screw.Unit(function() {
  describe("$.jitter.core", function() {
    describe("function setup", function() {
      var jitter;
      
      before(function() {
        // stub out ajax call
        $.ajax = function(options) {};
      });

      it("should assign options.currentFeed to correct feed", function() {
        jitter = $.jitter({feed: "search", query: "jquery"});
        expect(jitter.options().currentFeed).to(equal, $.jitter.feeds.search);
      });
      
      describe("with potentially passed settings", function() {
        it("should use defaults if no settings are passed", function() {
          jitter = $.jitter();
          delete(jitter.options().currentFeed);
          expect(jitter.options()).to(equal, $.jitter.defaults);
        });
        
        it("should use passed settings if assigned", function() {
          jitter = $.jitter({refreshRate: 20, feed: "userTimeline", username: "username"});
          delete(jitter.options().currentFeed);
          expect(jitter.options()).to(equal, $.extend({}, $.jitter.defaults, jitter.options()));
        });
      });
      
      it("should call the jQuery timer if valid", function() {
        var timerCalled = false;
        $.timer = function() { timerCalled = true; return {stop: function() {}, reset: function() {}}; };
        jitter = $.jitter();
        expect(timerCalled).to(be_true);
      });
      
      it("should properly return feed class", function() {
        jitter = $.jitter({feed: "search", query: "Three Separate Words"});
        expect(jitter.feedClass()).to(equal, "search-three-separate-words");
      });
      
      it("should properly return feed title", function() {
        jitter = $.jitter({feed: "search", query: "Three Separate Words"});
        expect(jitter.feedTitle()).to(equal, "Search Results for 'Three Separate Words'");
      });
      
      after(function() {
        jitter.stop();
      });
    });
    
    describe("AJAX options within updateTweets", function() {
      var jitter, options;
      
      before(function() {
        $.ajax = function(opts) { options = opts; };
      });
      
      it("should be assigned a 'jsonp' data type", function() {
        jitter = $.jitter();
        expect(options.dataType).to(equal, "jsonp");
      });
      
      it("should be a GET request", function() {
        jitter = $.jitter();
        expect(options.type).to(equal, "GET");
      });
      
      after(function() {
        jitter.stop();
      });
    });
    
    describe("URL building", function() {
      var jitter, options;
      
      before(function() {
        stubTimer();
        $.ajax = function(opts) { options = opts; };
      });
      
      it("should generate the correct URLs and params", function() {
        jitter = $.jitter({feed: "search", query: "blueprint css"});
        expect(options.url).to(equal, "http://search.twitter.com/search.json?q=blueprint+css");
        jitter = $.jitter({feed: "groupTimeline", users: ["person1", "person2"], groupName: "Test Group"});
        expect(options.url).to(equal, "http://search.twitter.com/search.json?q=from%3Aperson1+OR+from%3Aperson2");
        jitter = $.jitter({feed: "friendsTimeline", username: "name", password: "pass"});
        expect(options.url).to(equal, "http://name:pass@twitter.com/statuses/friends_timeline.json");
      });
    });
    
    describe("error handling", function() {
      var jitter;
      
      before(function() {
        stubTimer();
      });
      
      it("should properly catch search errors", function() {
        var errorResult = {};
        var errorHandler = function(e) { errorResult = e; };
        jitter = $.jitter({feed: "search", query: null, onError: errorHandler});
        expect(errorResult).to(equal, $.jitter.errors.invalidSearchRequest);
        expect(jitter).to(be_undefined);
      });
      
      it("should properly catch group timeline errors", function() {
        var errorResult = {};
        var errorHandler = function(e) { errorResult = e; };
        jitter = $.jitter({feed: "groupTimeline", onError: errorHandler});
        expect(errorResult).to(equal, $.jitter.errors.invalidGroupTimelineRequest);
        expect(jitter).to(be_undefined);
      });
      
      it("should properly catch user timeline errors", function() {
        var errorResult = {};
        var errorHandler = function(e) { errorResult = e; };
        jitter = $.jitter({feed: "userTimeline", username: null, onError: errorHandler});
        expect(errorResult).to(equal, $.jitter.errors.invalidUserTimelineRequest);
        expect(jitter).to(be_undefined);
      });
    });
    
    describe("AJAX response handling", function() {
      var jitter, options;
      
      var searchResponse, directMessagesResponse, standardResponse;
      
      before(function() {
        stubTimer();
        $.ajax = function(opts) { options = opts; };
        searchResponse = {"results":[{"text":"@levarburton  you can contact leo laporte at these 2 twitter accounts @LeoLaporte  d twitlive . this is for this week in tech.","to_user_id":423949,"to_user":"LevarBurton","from_user":"virgiliocorrado","id":1109678669,"from_user_id":632616,"iso_language_code":"en","profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/63261252\/1280_wallpaper_normal.jpg","created_at":"Sat, 10 Jan 2009 20:58:15 +0000"},{"text":"Trying to figure out twitter...","to_user_id":null,"from_user":"AbiWells","id":1109678660,"from_user_id":3493459,"iso_language_code":"en","profile_image_url":"http:\/\/static.twitter.com\/images\/default_profile_normal.png","created_at":"Sat, 10 Jan 2009 20:58:15 +0000"},{"text":"How do you upload pics to twitter? I thought I'd figured it out on my phone, but it refuses to post anything. Do I need a separate app?","to_user_id":null,"from_user":"hanamelia","id":1109678657,"from_user_id":2749156,"iso_language_code":"en","profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/63859088\/Wedding_3_2_normal.jpg","created_at":"Sat, 10 Jan 2009 20:58:15 +0000"},{"text":"Anyone know of some good sites to make twitter look less generic ?","to_user_id":null,"from_user":"pawstv","id":1109678549,"from_user_id":2975736,"iso_language_code":"en","profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/67335234\/ppl-paw-tranparent_normal.gif","created_at":"Sat, 10 Jan 2009 20:58:10 +0000"},{"text":"you can twitter from inside the www.greensandcornbread.com social network. Now that's cool.  Working on some other new features now too.","to_user_id":null,"from_user":"rapbrain","id":1109678508,"from_user_id":2066272,"iso_language_code":"en","profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/70394658\/1.1_normal.JPG","created_at":"Sat, 10 Jan 2009 20:58:08 +0000"}],"since_id":0,"max_id":1109678669,"refresh_url":"?since_id=1109678669&q=twitter","results_per_page":5,"next_page":"?page=2&max_id=1109678669&rpp=5&q=twitter","completed_in":0.056787,"page":1,"query":"twitter"};
        directMessagesResponse = [{"recipient":{"description":"Rails Programmer at Fusionary Media","url":"http:\/\/www.jdclayton.com","name":"Joshua Clayton","followers_count":88,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/66333766\/n503157481_5115_normal.jpg","protected":false,"screen_name":"joshuaclayton","location":"iPhone: 42.916784,-85.735909","id":10293122},"sender_screen_name":"danielmorrison","created_at":"Fri Jan 09 13:53:31 +0000 2009","sender":{"description":"I write code between hanging out at conferences.","url":"http:\/\/daniel.collectiveidea.com","name":"Daniel Morrison","followers_count":443,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/58460226\/danielmorrison_icon_normal.jpg","protected":false,"screen_name":"danielmorrison","location":"Holland, MI","id":8906},"recipient_screen_name":"joshuaclayton","recipient_id":10293122,"text":"thanks, but think we'll skip the ajax project & avoid .net for another day.","sender_id":8906,"id":49640388},{"recipient":{"description":"Rails Programmer at Fusionary Media","url":"http:\/\/www.jdclayton.com","name":"Joshua Clayton","followers_count":88,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/66333766\/n503157481_5115_normal.jpg","protected":false,"screen_name":"joshuaclayton","location":"iPhone: 42.916784,-85.735909","id":10293122},"sender_screen_name":"slewpop","created_at":"Fri Jan 09 13:17:20 +0000 2009","sender":{"description":"Loves Wiffleball and hanging with his kids.","url":"http:\/\/www.fusionary.com","name":"Steve","followers_count":44,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/14561552\/or-sprlt_normal.jpg","protected":true,"screen_name":"slewpop","location":"Grand Rapids, MI","id":11665},"recipient_screen_name":"joshuaclayton","recipient_id":10293122,"text":": very, very cool article!","sender_id":11665,"id":49637425}];
        standardResponse = [{"in_reply_to_screen_name":null,"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"followers_count":48858,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"created_at":"Thu Jan 08 17:50:42 +0000 2009","text":"Catching back up to a time http:\/\/tinyurl.com\/89o9l9","favorited":false,"id":1104810045,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"in_reply_to_screen_name":null,"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48862,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Tue Jan 06 22:54:05 +0000 2009","text":"Normal message delivery has been restored. We discovered some inefficiencies that will make this less of a problem in the future.","id":1100532671,"source":"web"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48855,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Tue Jan 06 18:37:42 +0000 2009","text":"Delivery delays http:\/\/tinyurl.com\/7bxk9y","in_reply_to_screen_name":null,"id":1100051701,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48848,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"in_reply_to_screen_name":null,"created_at":"Mon Jan 05 19:06:58 +0000 2009","text":"Multiple accounts hacked. Situation stable. http:\/\/tinyurl.com\/9td4k5","id":1097712976,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"user":{"description":"Always wondering what everyone's doing.","followers_count":48863,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","url":"http:\/\/twitter.com","screen_name":"twitter","name":"Twitter","protected":false,"location":"San Francisco, CA","id":783214},"favorited":false,"created_at":"Sun Jan 04 02:53:01 +0000 2009","text":"Check out our blog post about \"Phishing\" http:\/\/tinyurl.com\/88mas4","in_reply_to_screen_name":null,"id":1094494094,"source":"web"},{"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"user":{"description":"Always wondering what everyone's doing.","followers_count":48863,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","url":"http:\/\/twitter.com","screen_name":"twitter","name":"Twitter","protected":false,"location":"San Francisco, CA","id":783214},"favorited":false,"created_at":"Sun Jan 04 00:06:08 +0000 2009","text":"Don't Click That Link! http:\/\/tinyurl.com\/9sste4","in_reply_to_screen_name":null,"id":1094248438,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48857,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Sat Jan 03 23:23:40 +0000 2009","text":"! be careful of DMs with a link to blogspot.com that seemingly redirects to Twitter.com and asks for your credentials (we're on the case)","in_reply_to_screen_name":null,"id":1094186670,"source":"<a href=\"http:\/\/83degrees.com\/to\/powertwitter\">Power Twitter<\/a>"},{"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"user":{"description":"Always wondering what everyone's doing.","followers_count":48851,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","url":"http:\/\/twitter.com","screen_name":"twitter","name":"Twitter","protected":false,"location":"San Francisco, CA","id":783214},"in_reply_to_screen_name":null,"favorited":false,"created_at":"Sun Dec 28 20:43:58 +0000 2008","text":"Have you ever tried an Advanced Search? http:\/\/search.twitter.com\/advanced","id":1082764732,"source":"web"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48854,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"in_reply_to_screen_name":null,"favorited":false,"created_at":"Wed Dec 24 00:35:58 +0000 2008","text":"Updates to name search \/ Email from Yahoo http:\/\/tinyurl.com\/7qv9sr","id":1075363404,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48858,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Tue Dec 23 21:39:20 +0000 2008","text":"Yay for new and improved People Search! Who are you looking for? http:\/\/twitter.com\/invitations","in_reply_to_screen_name":null,"id":1075088077,"source":"web"},{"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"user":{"description":"Always wondering what everyone's doing.","followers_count":48851,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","url":"http:\/\/twitter.com","screen_name":"twitter","name":"Twitter","protected":false,"location":"San Francisco, CA","id":783214},"in_reply_to_screen_name":null,"favorited":false,"created_at":"Tue Dec 23 18:30:13 +0000 2008","text":"The update problem in some browsers has been resolved (it was fixed yesterday). Thanks to our friends at Mozilla for the assist.","id":1074762932,"source":"web"},{"in_reply_to_screen_name":null,"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48849,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Tue Dec 23 01:57:43 +0000 2008","text":"Here's a nice story: \"Twitter flash mob helps homeless\" http:\/\/bit.ly\/N7ZU","id":1073468012,"source":"web"},{"in_reply_to_screen_name":null,"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48855,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Mon Dec 22 19:07:35 +0000 2008","text":"Unable to post http:\/\/tinyurl.com\/97h9ca","id":1072801735,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"followers_count":48866,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"created_at":"Sun Dec 21 17:13:11 +0000 2008","text":"Noticing that \"Twitt\" made the NYTimes list of 2008 buzzwords while \"Tweet\" made TIME's list\u2014not too shabby!","favorited":false,"in_reply_to_screen_name":null,"id":1070765778,"source":"web"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48857,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_screen_name":null,"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Sun Dec 21 02:06:19 +0000 2008","text":"The stale timeline problem should now be resolved. If you are still seeing problems please let us know.","id":1069881824,"source":"web"},{"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"user":{"description":"Always wondering what everyone's doing.","followers_count":48859,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","url":"http:\/\/twitter.com","screen_name":"twitter","name":"Twitter","protected":false,"location":"San Francisco, CA","id":783214},"favorited":false,"created_at":"Sat Dec 20 17:57:44 +0000 2008","in_reply_to_screen_name":null,"text":"Stale timelines http:\/\/tinyurl.com\/a7ep44","id":1069265630,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"user":{"description":"Always wondering what everyone's doing.","followers_count":48863,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","url":"http:\/\/twitter.com","screen_name":"twitter","name":"Twitter","protected":false,"location":"San Francisco, CA","id":783214},"favorited":false,"created_at":"Fri Dec 19 22:56:46 +0000 2008","text":"Odd formatting on www.twitter.com http:\/\/tinyurl.com\/4zfscz","in_reply_to_screen_name":null,"id":1068051098,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48852,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"in_reply_to_screen_name":null,"created_at":"Thu Dec 18 00:00:50 +0000 2008","text":"We've resolved the problem whereby users were only receiving SMS from a limited set of folks.","id":1063886565,"source":"web"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48855,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"truncated":false,"favorited":false,"created_at":"Wed Dec 17 19:10:15 +0000 2008","text":"SMS delivery problems & Follower counts http:\/\/tinyurl.com\/3vuxq5","in_reply_to_screen_name":null,"id":1063363504,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"},{"user":{"description":"Always wondering what everyone's doing.","url":"http:\/\/twitter.com","name":"Twitter","followers_count":48863,"profile_image_url":"http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/24254342\/twitter_bird_profile_normal.png","protected":false,"screen_name":"twitter","location":"San Francisco, CA","id":783214},"in_reply_to_status_id":null,"in_reply_to_user_id":null,"created_at":"Sat Dec 13 21:09:01 +0000 2008","truncated":false,"text":"User deletion disabled http:\/\/tinyurl.com\/6azwdx","in_reply_to_screen_name":null,"favorited":false,"id":1055807567,"source":"<a href=\"http:\/\/twitterfeed.com\">twitterfeed<\/a>"}];
      });
      
      it("should reassign search results' data.results property to the data object so it can parse correctly", function(){
        jitter = $.jitter({feed: "search", query: "twitter", onUpdate: function(t) {}});
        options.success(searchResponse);
        expect(jitter.tweets()).to(equal, searchResponse.results);
      });
      
      describe("sinceID handling", function() {
        it("should assign sinceID and keep track of it", function() {
          var sinceID = standardResponse[0].id;
          jitter = $.jitter({feed: "userTimeline", username: "twitter", onUpdate: function(t) {}});
          options.success(standardResponse);
          expect(jitter.tweets()).to(equal, standardResponse);
          jitter.updateTweets();
          
          expect(jitter.options().currentFeed.trackSince).to(be_true);
          expect(options.url).to(match, new RegExp(sinceID));
        });
        
        it("should change sinceID if additional data is present in a subsequent callback", function() {
          var sinceID = standardResponse[0].id,
              sinceID2 = standardResponse[1].id;
          jitter = $.jitter({feed: "userTimeline", username: "twitter", onUpdate: function(t) {}});
          options.success(standardResponse);
          jitter.updateTweets();
          
          expect(jitter.options().currentFeed.trackSince).to(be_true);
          standardResponse.shift();
          options.success(standardResponse);
          jitter.updateTweets();
          expect(options.url).to(match, new RegExp(sinceID2));
        });
        
        it("shouldn't change sinceID without additional data in a subsequent callback", function() {
          var sinceID = standardResponse[0].id;
          jitter = $.jitter({feed: "userTimeline", username: "twitter", onUpdate: function(t) {}});
          options.success(standardResponse);
          jitter.updateTweets();
          
          expect(jitter.options().currentFeed.trackSince).to(be_true);
          standardResponse.shift();
          options.success([]);
          jitter.updateTweets();
          expect(options.url).to(match, new RegExp(sinceID));
        });
      });
    });
  });
});