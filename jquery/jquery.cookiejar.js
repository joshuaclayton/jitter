(function($) {
  var buildCookieString = function(name, value) {
    if(name.indexOf("=") != -1) { return; } // bad data
    var result  = [],
        options = arguments[2] || {};
    
    result.push(name + "=" + encodeURIComponent(JSON.stringify(value)));
    if(options.expires)         { result.push("expires=" + new Date(new Date().getTime() + (options.expires * 1000)).toGMTString()); }
    if(options.path)            { result.push("path=" + encodeURIComponent(options.path)); }
    if(options.domain)          { result.push("domain=" + encodeURIComponent(options.domain)); }
    if(options.secure === true) { result.push("secure"); }
    return result.join(";");
  };
  
  $.cookieJar = {
    prefix: "_cookie_jar_",
    get: function(name) {
      var cookies = document.cookie.match($.cookieJar.prefix + name + '=(.*?)(;|$)');
      return cookies ? JSON.parse(decodeURIComponent(cookies[1])) : null;
    },
    set: function(name, value) { document.cookie = buildCookieString($.cookieJar.prefix + name, value, arguments[2]); },
    remove: function(name) { document.cookie = buildCookieString($.cookieJar.prefix + name, "", {expires: -10}); }
  };
})(jQuery);