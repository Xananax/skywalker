var RegexEscape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
RegexEscape.start = /^\//;
RegexEscape.end = /\/([gis]{1,3}?)$/;
var strToRegex = function(s){
	s = s.replace(RegexEscape.start,'');
	var m;
	if(m = s.match(RegexEscape.end)){
		m = m[1];
		s = s.replace(RegexEscape.end,'');
	}
	return new RegExp(s,m);
}