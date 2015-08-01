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
      bower: {
        files: ['bower.json'],
        tasks: ['bowerInstall']
      },
      js: {
        files: ['<%= config.app %>/scripts/{,*/}*.js'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        tasks: ['useminPrepare', 'usemin', 'browserify'],
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      styles: {
        files: ['<%= config.app %>/styles/{,*/}*.css'],
        tasks: [],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
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
    mocha: {
      all: {
        options: {
          run: true,
          urls: ['http://localhost:<%= connect.options.port %>/index.html']
        }
      }
    },

    // Automatically inject Bower components into the HTML file
    bowerInstall: {
      app: {
        src: [
          '<%= config.app %>/*.html'
        ]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      options: {
        dest: '<%= config.dist %>'
      },
      html: [
        '<%= config.app %>/popup.html',
        '<%= config.app %>/options.html'
      ]
    },

    // Performs rewrites based on rev and the useminPrepare configuration
    usemin: {
      options: {
        assetsDirs: ['<%= config.dist %>', '<%= config.dist %>/images']
      },
      html: ['<%= config.dist %>/{,*/}*.html'],
      css: ['<%= config.dist %>/styles/{,*/}*.css']
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

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= config.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          // removeCommentsFromCDATA: true,
          // collapseWhitespace: true,
          // collapseBooleanAttributes: true,
          // removeAttributeQuotes: true,
          // removeRedundantAttributes: true,
          // useShortDoctype: true,
          // removeEmptyAttributes: true,
          // removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.app %>',
          src: '*.html',
          dest: '<%= config.dist %>'
        }]
      }
    },

    // By default, your `index.html`'s <!-- Usemin block --> will take care of
    // minification. These next options are pre-configured if you do not wish
    // to use the Usemin blocks.
    // cssmin: {
    //   dist: {
    //     files: {
    //       '<%= config.dist %>/styles/main.css': [
    //         '<%= config.app %>/styles/{,*/}*.css'
    //       ]
    //     }
    //   }
    // },
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
    // concat: {
    //   dist: {}
    // },

    browserify: {
      basic: {
        files: {
          '<%= config.dist %>/scripts/background.js': ['<%= config.app %>/scripts/background.js'],
          '<%= config.dist %>/scripts/contentscript.js': ['<%= config.app %>/scripts/contentscript.js'],
          '<%= config.dist %>/scripts/inpage.js': ['<%= config.app %>/scripts/inpage.js'],
        },
      },
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
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
      }
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
      dev: [
        'browserify',
      ],
      dist: [
        'imagemin',
        'svgmin',
        'browserify',
      ],
      test: [
        'browserify',
      ]
    },


  });

  grunt.registerTask('dev', function () {
    grunt.task.run([
      'clean',
      'concurrent:dev',
      'connect:dev',
      'copy',

      'watch',
    ]);
  });

  grunt.registerTask('test', [
    // 'jshint',
    'concurrent:test',
    'connect:test',
    'copy',

    'mocha',
  ]);

  grunt.registerTask('build', [
    'clean',
    'concurrent:dist',
    'uglify',
    'copy',
    'chromeManifest:dist',
    'compress',
  ]);

  grunt.registerTask('default', [
    'test',
    'build',
  ]);
};
