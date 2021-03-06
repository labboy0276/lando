/**
 * Backdrop recipe builder
 *
 * @name backdrop
 */

'use strict';

module.exports = function(lando) {

  // Modules
  var _ = lando.node._;

  /**
   * Helper to return backdrop settings
   */
  var backdropSettings = function(config) {
    return JSON.stringify({
      databases: {
        default: {
          default: {
            driver: 'mysql',
            database: config._recipe,
            username: config._recipe,
            password: config._recipe,
            host: 'database',
            port: 3306
          }
        }
      }
    });
  };

  /*
   * Helper to download and install backdrop drush cmds
   */
  var getBackdrush = function(config) {

    // Define stable and dev versions
    var version = {
      dev: '1.x-0.x',
      stable: '0.0.5'
    };

    // Get the base URL
    var baseUrl = 'https://github.com/backdrop-contrib/drush/archive/';

    // Get the user config
    var backdrush = _.get(config, 'backdrush', 'stable');
    var isSpecial = _.includes(['dev', 'stable'], backdrush);
    var release = (isSpecial) ? version[backdrush] : backdrush;

    // Get the URL and dest
    var download = baseUrl + release + '.tar.gz';
    var dest = '~/.drush';

    // Curl and tar
    var curl = ['curl', '-fsSL', download];
    var tar = ['tar', '-xz', '--strip-components=1', '-C', dest];

    // Backdrush install command
    var backdrushInstall = [
      ['mkdir', '-p', dest],
      _.flatten([curl, ['|'], tar]),
      ['drush', 'cc', 'drush'],
    ];

    // Return
    return _.map(backdrushInstall, function(cmd) {
      return cmd.join(' ');
    }).join(' && ');

  };

  /**
   * Build out Backdrop
   */
  var build = function(name, config) {

    // Set the default php version for Backdrop
    config.php = _.get(config, 'php', '7.0');

    // Make sure we are enforcing latest stable drush
    config.drush = 'stable';

    // Start by cheating
    var build = lando.recipes.build(name, 'drupal7', config);

    // Get appserver ENV
    var envKey = 'services.appserver.overrides.services.environment';
    var env = _.get(build, envKey, {});

    // Set backdrop ENV
    env.BACKDROP_SETTINGS = backdropSettings(config);
    _.set(build, envKey, env);

    // Get appserver build
    var buildersKey = 'services.appserver.build';
    var builders = _.get(build, buildersKey, []);

    // Add the backdrop install command
    builders.push(getBackdrush(config));
    _.set(build, buildersKey, builders);

    // Return the things
    return build;

  };

  // Return the things
  return {
    build: build,
    configDir: __dirname
  };

};
