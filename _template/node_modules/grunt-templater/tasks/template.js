/**
 * Task: template
 * Description: copies a home page html file for the project dist directory
 * Dependencies: grunt, fs
 */

module.exports = function(grunt) {

  var consolidate = require('consolidate'),
      fs = require('fs');

  // TODO: ditch this when grunt v0.4 is released
  grunt.util = grunt.util || grunt.utils;

  var _ = grunt.util._;

  var extensions = {
    "dust"        : "dust",
    "eco"         : "eco",
    "ejs"         : "ejs",
    "haml"        : "haml",
    "haml-coffee" : "haml-coffee",
    "handlebars"  : "handlebars",
    "hbt"         : "handlebars",
    "hb"          : "handlebars",
    "handlebar"   : "handlebars",
    "hogan"       : "hogan",
    "jade"        : "jade",
    "jt"          : "jade",
    "jazz"        : "jazz",
    "jqtpl"       : "jqtpl",
    "jst"         : "underscore",
    "liquor"      : "liquor",
    "mustache"    : "mustache",
    "QEJS"        : "QEJS",
    "swig"        : "swig",
    "underscore"  : "underscore",
    "us"          : "underscore",
    "walrus"      : "walrus",
    "whiskers"    : "whiskers"
  };

  function getEngineOf(fileName) {
    var extension = _(fileName.match(/[^.]*$/)).last();
    return  _( _(extensions).keys() ).include(extension) ? extensions[extension] : false;
  }

  grunt.registerMultiTask('template', 'generates an html file from a specified template', function(){
    var config = this;
    var data = this.data;
    var done = this.async();


    _(['src', 'dest', 'variables']).each(function(attr){
      config.requiresConfig([config.name, config.target, attr].join('.'));
    });

    var engine = data.engine || getEngineOf(data.src);

    if(!engine){
      grunt.log.writeln("No compatible engine available");
      return false;
    }

    consolidate[engine](data.src, data.variables, function(err, html){
      if (err)
      {
        grunt.log.error(err);
        done(false);
      }
      grunt.file.write(data.dest, html);
      grunt.log.writeln("HTML written to '"+ data.dest +"'");
      done(true);
    });
  });
};
