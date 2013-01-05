;(function ( $, window, document, undefined ) {

  // setup our namespace
  var ge = {};
  
  // namespace for module code
  ge.modules = ge.modules || {};
  
  // storage for active modules
  ge.activeModules = {};
  
  // global setting variables go here
  ge.settings = {
    initialized: false
  };
  
  // global event handlers -- these are broadcast upstream to all active modules
  ge.evt = {
    'ready': function( evt ) {
      if ( 'app' in ge ) {
        ge.app.run();
      }
      $( 'a[href^="http"]' ).linkHelper();
      // calling the tipsy plugin on the social links
      if (!/iPad|iPhone|iPod|Android/i.test(navigator.userAgent))  { // Prevents tipsy from running in iPad
        $( '#social .social-link a' ).tipsy( {offset: 1, opacity: 1} );
      }
    }
  };
  
  // main ge methods go here
  ge.fn = {
    'init': function() {
      // return if this has already been run
      if ( ge.settings.initialized ) return false;
      // bindings
      $( window )
        .unbind( 'keydown.ge keypress.ge keyup.ge' )
        .bind( 'keydown.ge keypress.ge keyup.ge', function( e ) {
          return ge.fn.trigger( e.type, e );
        } );
      // if we've got the throttle plugin, use it
      if ( 'throttle' in $ ) {
        $( window )
          .unbind( 'resize.ge' )
          .bind( 'resize.ge', $.throttle( 100, function( e ) {
            return ge.fn.trigger( e.type, e );
          } ) )
          .trigger( 'resize.ge' );
      } else {
        $( window )
          .unbind( 'resize.ge' )
          .bind( 'resize.ge', function( e ) {
            return ge.fn.trigger( e.type, e );
          } )
          .trigger( 'resize.ge' );
      }
      $( document )
        .unbind( 'ready.ge' )
        .bind( 'ready.ge', function( e ) {
          return ge.fn.trigger( e.type, e );
        } );
      // attempt to set our base url based on where this script lives
      // assumes this script is being packaged into a script that lives in {base_url}/js/{package_name}.js
      var baseSrc = "/"; // default to nada
      $( 'script[src^="/"]' ).each( function() {
        $script = $( this );
        if( $script.attr( 'src' ).match( /^\/{1}[a-zA-Z0-9]+/ ) && 
          $script.attr( 'src' ).match( /^.*?(?=js\/[a-zA-Z0-9\_\-]+\.js)/ ) ) {
          baseSrc = $script.attr( 'src' ).match( /^.*?(?=js\/[a-zA-Z0-9\_\-]+\.js)/ )[0];
        }
      } );
      ge.fn.set( 'base_url', baseSrc );
      
      // setup sammy for routing
      ge.app = $.sammy( '#content', function() {
        // flag for skipping tracking on the first route
        var afterFirstRoute = false;
        this.raise_errors = false;
        
        this.bind('event-context-after', function() {
          if( 'tracking' in ge.activeModules ) {
            if ( afterFirstRoute ) {
              // if we're beyond the initial route, track it
              ge.modules.tracking.fn.trackPageview( this.path );
            } else {
              // initial route, set our flag to true so future requests are tracked
              afterFirstRoute = true;
            }
          }
        } );
      } );
      // load modules
      ge.fn.initModules();
      
      ge.settings.initialized = true;
      
    },
    // iterates over all in-memory modules and autoloads any without an autoload false flag
    initModules: function() {
      for( var moduleName in ge.modules ) {
        if( ge.modules.hasOwnProperty(moduleName) ) {
          if ( ge.modules[moduleName].autoload !== false &&  !( moduleName in ge.activeModules) ) {
            ge.fn.loadModule( moduleName );
          }
        }
      }
    },
    // loads a module into GE and fires init on it
    loadModule: function( data ) {
      var moduleName,
        moduleOptions = {};
      if( typeof data == 'string' ) {
        moduleName = data;
      } else if( typeof data == 'object' ) {
        for( var moduleData in data ) {
          if( data.hasOwnProperty( moduleData ) ) {
            moduleName = moduleData;
            moduleOptions = data[moduleData];
            break;
          }
        }
      }
      if( moduleName in ge.modules ) {
        // give this module it's own space for storing stuff if it doesn't already have it
        ge.activeModules[moduleName] = ge.activeModules[moduleName] || {};
        // if it has an init function, run it
        if( 'init' in ge.modules[moduleName].fn )
          ge.modules[moduleName].fn.init( moduleOptions );
        // if it has routes, bind them
        if( 'routes' in ge.modules[moduleName] ) {
          if ( ge.app ) {
            for ( var route in ge.modules[moduleName].routes ) {
              if ( ge.modules[moduleName].routes.hasOwnProperty( route ) ) {
                ge.app.get( route,  ge.modules[moduleName].routes[route].on );
              }
            }
          }
        }
          
      }
    },
    // fires deinit on the specified module and removes it from GE
    unloadModule: function( moduleName ) {
      if( moduleName == "all" ) {
        // unload all the currently loaded modules
        for( var module in context.modules ) {
          if( context.modules.hasOwnProperty( module ) ) {
            // if it has a deinit function, run it
            if( 'deinit' in $.markApp.modules[module].fn )
              $.markApp.modules[module].fn.deinit( context );
            // remove it from our modules
            delete context.modules[module];
          }
        }
      } else if ( moduleName in context.modules ) {
        // if it has a deinit function, run it
        if( 'deinit' in $.markApp.modules[moduleName].fn )
          $.markApp.modules[moduleName].fn.deinit( context );
        // remove it from our modules
        delete context.modules[moduleName];
      }
    },
    // triggers events on all loaded modules
    'trigger': function( eventName, eventObj, args ) {
      // Add some assurances to our eventObj
      if( typeof eventObj == "undefined" )
        eventObj = { 'type': 'custom' };
      
      // trigger the global handlers first
      if ( eventName in ge.evt ) {
        // if it returns false, stop the train
        if ( ge.evt[eventName]( eventObj ) === false ) {
          return false;
        }
      }
      // run the event handler on each module that's got it
      for( var module in ge.activeModules ) {
        if( module in ge.modules && 'evt' in ge.modules[module] && eventName in ge.modules[module].evt ) {
          ge.modules[module].evt[eventName]( eventObj, args );
        }
      }
    },
    // Adds a variable to the GE global settings
    'set': function( key, value ) {
      ge.settings[key] = value;
      return value;
    },
    // returns a variable from the GE global settings
    // defaults to the key if the variable can't be found
    'get': function( key ) {
      if( key in ge.settings ) {
        return ge.settings[key];
      } else {
        return key;
      }
    },
    // adds a key value pair to localStorage
    storeData: function( key, value ) {
      if ( typeof localStorage != 'undefined' ) {
        // use localStorage if it exists
        try {
          if( typeof value === "object" ) {
            value = JSON.stringify( value );
          }
          localStorage.setItem( key, value );
        } catch (e) {
          if ( e == QUOTA_EXCEEDED_ERR ) { /* data wasn't successfully saved due to quota exceed */ }
        }
      }
    },
    // attempts to retrieve a value from the localStorage
    getData: function( key ) {
      if ( typeof localStorage != 'undefined' ) {
        var item = localStorage.getItem( key );
        if( item ) {
          if ( item[0]=="{" ) item = JSON.parse( item );
          return item;
        } else {
          return false;
        }
      }
    },
    // uses our base_url to generate an absolute url for a path
    'url': function( path ) {
      return ge.fn.get( 'base_url' ) + path.replace( /^\//, '' );
    },
    'getCookie': function( cName ) {
      var i, x, y, 
        ARRcookies = document.cookie.split( ';' );
      for ( i = 0; i < ARRcookies.length; i++ ) {
        x = ARRcookies[i].substr(0,ARRcookies[i].indexOf( '=' ));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf( '=' )+1);
        x = x.replace( /^\s+|\s+$/g, '' );
        if ( x == cName ) {
          return unescape( y );//found cookie send value
        }
      }
      return false; //didnt find the cookie
    },
    // returns true if we are in /atwork/
    // TODO - rip this out and replace it with meaningful code
    'isAtWork': function() {
      var pageName = window.location.pathname.split('/');
      if (pageName[1] !== "atwork") {
        return false;
      } else {
        return true;
      }
    }
  };
  
  // add a delay method to the ge namespace
  ge.fn.delay = (function(){
    var timer = 0;
    return function( callback, ms ){
      clearTimeout ( timer );
      timer = setTimeout( callback, ms );
    };
  } )();
  
  
  ge.fn.init(); 
  
  return ge; 
}( GE || {}, jQuery ) );
