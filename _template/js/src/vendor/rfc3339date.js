/*
 * rfc3339date.js version 0.1.3
 *
 * Adds ISO 8601 / RFC 3339 date parsing to the Javascript Date object.
 * Usage:
 *   var d = Date.parseISO8601( "2010-07-20T15:00:00Z" );
 *   var d = Date.parse( "2010-07-20T15:00:00Z" );
 * Tested for compatibilty/coexistence with:
 *   - jQuery [http://jquery.com]
 *   - datejs [http://www.datejs.com/]
 *
 * Copyright (c) 2010 Paul GALLAGHER http://tardate.com
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */

/*
 * Number.prototype.toPaddedString
 * Number instance method used to left-pad numbers to the specified length
 * Used by the Date.prototype.toRFC3339XXX methods
 */
Number.prototype.toPaddedString = function(len , fillchar) {
  var result = this.toString();
  if(typeof(fillchar) == 'undefined'){ fillchar = '0' };
  while(result.length < len){ result = fillchar + result; };
  return result;
}

/*
 * Date.prototype.toRFC3339UTCString
 * Date instance method to format the date as ISO8601 / RFC 3339 string (in UTC format).
 * Usage: var d = new Date().toRFC3339UTCString();
 *              => "2010-07-25T11:51:31.427Z"
 * Parameters:
 *  supressFormating : if supplied and 'true', will force to remove date/time separators
 *  supressMillis : if supplied and 'true', will force not to include milliseconds
 */
Date.prototype.toRFC3339UTCString = function(supressFormating , supressMillis){
  var dSep = ( supressFormating ? '' : '-' );
  var tSep = ( supressFormating ? '' : ':' );
  var result = this.getUTCFullYear().toString();
  result += dSep + (this.getUTCMonth() + 1).toPaddedString(2);
  result += dSep + this.getUTCDate().toPaddedString(2);
  result += 'T' + this.getUTCHours().toPaddedString(2);
  result += tSep + this.getUTCMinutes().toPaddedString(2);
  result += tSep + this.getUTCSeconds().toPaddedString(2);
  if((!supressMillis)&&(this.getUTCMilliseconds()>0)) result += '.' + this.getUTCMilliseconds().toPaddedString(3);
  return result + 'Z';
}

/*
 * Date.prototype.toRFC3339LocaleString
 * Date instance method to format the date as ISO8601 / RFC 3339 string (in local timezone format).
 * Usage: var d = new Date().toRFC3339LocaleString();
 *              => "2010-07-25T19:51:31.427+08:00"
 * Parameters:
 *  supressFormating : if supplied and 'true', will force to remove date/time separators
 *  supressMillis : if supplied and 'true', will force not to include milliseconds
 */
Date.prototype.toRFC3339LocaleString = function(supressFormating , supressMillis){
  var dSep = ( supressFormating ? '' : '-' );
  var tSep = ( supressFormating ? '' : ':' );
  var result = this.getFullYear().toString();
  result += dSep + (this.getMonth() + 1).toPaddedString(2);
  result += dSep + this.getDate().toPaddedString(2);
  result += 'T' + this.getHours().toPaddedString(2);
  result += tSep + this.getMinutes().toPaddedString(2);
  result += tSep + this.getSeconds().toPaddedString(2);
  if((!supressMillis)&&(this.getMilliseconds()>0)) result += '.' + this.getMilliseconds().toPaddedString(3);
  var tzOffset = -this.getTimezoneOffset();
  result += ( tzOffset<0 ? '-' : '+' )
  result += (tzOffset/60).toPaddedString(2);
  result += tSep + (tzOffset%60).toPaddedString(2);
  return result;
}

/*
 * Date.parseRFC3339
 * extend Date with a method parsing ISO8601 / RFC 3339 date strings.
 * Usage: var d = Date.parseRFC3339( "2010-07-20T15:00:00Z" );
 */
Date.parseRFC3339 = function(dString){
  if (typeof dString != 'string') return;
  var result;
  var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)?(:)?(\d\d)?([\.,]\d+)?($|Z|([+-])(\d\d)(:)?(\d\d)?)/i;
  var d = dString.match(new RegExp(regexp));
  if (d) {
    var year = parseInt(d[1],10);
    var mon = parseInt(d[3],10) - 1;
    var day = parseInt(d[5],10);
    var hour = parseInt(d[7],10);
    var mins = ( d[9] ? parseInt(d[9],10) : 0 );
    var secs = ( d[11] ? parseInt(d[11],10) : 0 );
    var millis = ( d[12] ? parseFloat(String(1.5).charAt(1) + d[12].slice(1)) * 1000 : 0 );
    if (d[13]) {
      result = new Date(0);
      result.setUTCFullYear(year);
      result.setUTCMonth(mon);
      result.setUTCDate(day);
      result.setUTCHours(hour);
      result.setUTCMinutes(mins);
      result.setUTCSeconds(secs);
      result.setUTCMilliseconds(millis);
      if (d[13] && d[14]) {
        var offset = (d[15] * 60)
        if (d[17]) offset += parseInt(d[17],10);
        offset *= ((d[14] == '-') ? -1 : 1);
        result.setTime(result.getTime() - offset * 60 * 1000);
      }
    } else {
      result = new Date(year,mon,day,hour,mins,secs,millis);
    }
  }
  return result;
};

/*
 * Date.parse
 * extend Date with a parse method alias for parseRFC3339.
 * If parse is already defined, chain methods to include parseRFC3339
 * Usage: var d = Date.parse( "2010-07-20T15:00:00Z" );
 */
if (typeof Date.parse != 'function') {
  Date.parse = Date.parseRFC3339;
} else {
  var oldparse = Date.parse;
  Date.parse = function(d) {
    var result = Date.parseRFC3339(d);
    if (!result && oldparse) {
      result = oldparse(d);
    }
    return result;
  }
}