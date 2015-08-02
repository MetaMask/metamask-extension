// Generated on 2015-07-31 using generator-chrome-extension 0.3.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Configurable paths
  var config = {
    app: 'app',
    dist: 'dist'
  };

  grunt.initConfig({

    // Project settings
    config: config,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['<%= config.app %>/scripts/{,*/}*.js'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        tasks: ['browserify:dev'],
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= config.app %>/*.html',
          '<%= config.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= config.app %>/manifest.json',
          '<%= config.app %>/_locales/{,*/}*.json'
        ]
      }
    },

    // Grunt server and dev server setting
    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      dev: {
        options: {
          open: false,
          base: [
            '<%= config.dist %>'
          ]
        }
      },
      test: {
        options: {
          open: false,
          base: [
            'test',
            '<%= config.app %>'
          ]
        }
      }
    },

    // Empties folders to start fresh
    clean: {
      basic: {
        files: [{
          dot: true,
          src: [
            '<%= config.dist %>/*',
            '!<%= config.dist %>/.git*'
          ]
        }]
      }
    },

    // Build js files
    browserify: {
      dist: {
        files: {
          '<%= config.dist %>/scripts/background.js': ['<%= config.app %>/scripts/background.js'],
          '<%= config.dist %>/scripts/contentscript.js': ['<%= config.app %>/scripts/contentscript.js'],
          '<%= config.dist %>/scripts/inpage.js': ['<%= config.app %>/scripts/inpage.js'],
        },
      },
      dev: {
        options: {
          watch: true,
        },
        files: {
          '<%= config.dist %>/scripts/background.js': ['<%= config.app %>/scripts/background.js'],
          '<%= config.dist %>/scripts/contentscript.js': ['<%= config.app %>/scripts/contentscript.js'],
          '<%= config.dist %>/scripts/inpage.js': ['<%= config.app %>/scripts/inpage.js'],
        },
      },
    },

    // minify js
    uglify: {
      dist: {
        files: {
          '<%= config.dist %>/scripts/background.js': [
            '<%= config.dist %>/scripts/background.js'
          ],
          '<%= config.dist %>/scripts/contentscript.js': [
            '<%= config.dist %>/scripts/contentscript.js'
          ],
          '<%= config.dist %>/scripts/inpage.js': [
            '<%= config.dist %>/scripts/inpage.js'
          ],
        }
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      basic: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          dest: '<%= config.dist %>',
          src: [
            '*.{ico,png,txt}',
            'images/{,*/}*.{webp,gif}',
            '{,*/}*.html',
            'styles/{,*/}*.css',
            'styles/fonts/{,*/}*.*',
            '_locales/{,*/}*.json',
            'manifest.json',
          ]
        }]
      },
      dev: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          dest: '<%= config.dist %>',
          src: [
            'images/{,*/}*.*',
            'scripts/chromereload.js',
          ]
        }]
      },
    },

    // Auto buildnumber, exclude dev files. smart builds that event pages
    chromeManifest: {
      dist: {
        options: {
          buildnumber: true,
          indentSize: 2,
          background: {
            target: 'scripts/background.js',
            exclude: [
              'scripts/chromereload.js'
            ]
          }
        },
        src: '<%= config.dist %>',
        dest: '<%= config.dist %>'
      },
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= config.app %>/scripts/{,*/}*.js',
        '!<%= config.app %>/scripts/vendor/*',
        'test/spec/{,*/}*.js'
      ]
    },

    // Testing
    mocha: {
      all: {
        options: {
          run: true,
          urls: ['http://localhost:<%= connect.options.port %>/index.html']
        }
      }
    },

    // The following *-min tasks produce minifies files in the dist folder
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/images',
          src: '{,*/}*.{gif,jpeg,jpg,png}',
          dest: '<%= config.dist %>/images'
        }]
      }
    },

    // Compres dist files to package
    compress: {
      dist: {
        options: {
          archive: function() {
            var manifest = grunt.file.readJSON('app/manifest.json');
            return 'package/metamask-' + manifest.version + '.zip';
          }
        },
        files: [{
          expand: true,
          cwd: 'dist/',
          src: ['**'],
          dest: ''
        }]
      }
    },

    // Run some tasks in parallel to speed up build process
    concurrent: {
      dist: [
        'imagemin',
        'browserify:dist',
      ],
    },


  });

  grunt.registerTask('dev', function () {
    grunt.task.run([
      'clean',
      'browserify:dev',
      'copy',
      'connect:dev',

      'watch',
    ]);
  });

  grunt.registerTask('test', [
    // 'jshint',
    'browserify:dist',
    'connect:test',
    'copy',

    'mocha',
  ]);

  grunt.registerTask('build', [
    'clean',
    'concurrent:dist',
    'uglify',
    'copy:dist',
    'chromeManifest:dist',
    'compress',
  ]);

  grunt.registerTask('default', [
    'test',
    'build',
  ]);
};
