(function($) {
  var buildCookieString = function(name, value, options) {
    if(name.indexOf("=") != -1) { return; } // bad data
    var result = [];
    result.push(name + "=" + escape(JSON.stringify(value)));
    if(options.expires)         { result.push("expires=" + new Date(new Date().getTime() + (options.expires * 1000)).toGMTString()); }
    if(options.path)            { result.push("path=" + escape(options.path)); }
    if(options.domain)          { result.push("domain=" + escape(options.domain)); }
    if(options.secure === true) { result.push("secure"); }
    return result.join(";");
  };
  
  $.cookieJar = {
    prefix: "_cookie_jar_",
    get: function(name) {
      var cookies = document.cookie.match($.cookieJar.prefix + name + '=(.*?)(;|$)');
      return cookies ? JSON.parse(unescape(cookies[1])) : null;
    },
    set: function(name, value) {
      var options = arguments[2] || {};
      document.cookie = buildCookieString($.cookieJar.prefix + name, value, options);
      return value;
    },
    remove: function(name) { document.cookie = buildCookieString($.cookieJar.prefix + name, "", {expires: -10}); }
  };
})(jQuery);