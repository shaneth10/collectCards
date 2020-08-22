/**
 * @description: 获取手机系统
 * @return {String} iphone: 苹果系统   gphone: 安卓系统
 */
function getPlatform() {
  const SYS = /(iphone)|(mac)|(ipad)/gi.test(navigator.userAgent) ? 'iphone' : 'gphone';
  return SYS
}

/**
* @desc   判断安卓系统版本号
* @return {String} 如4.3.2或者9.0
*/
function getGphoneVersion() {
  var ua = navigator.userAgent.toLowerCase();
  var version = null;
  if (ua.indexOf("android") > 0) {
      var reg = /android [\d._]+/gi;
      var v_info = ua.match(reg);
      version = (v_info + "").replace(/[^0-9|_.]/ig, "").replace(/_/ig, ".");
  }
  return version;
}