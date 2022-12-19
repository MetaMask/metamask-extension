module.exports = function (grunt) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var config = require('./Gruntfile-config.js');

    function assetModuleCwd(name) {
        return path.join('usr/module', name, 'asset');
    }

    function assetThemeCwd(name) {
        return path.join('usr/theme', name, 'asset');
    }

    function assetModuleCwdBuild(name) {
        return path.join('usr/module', name, 'asset/_build');
    }

    function assetThemeCwdBuild(name) {
        return path.join('usr/theme', name, 'asset/_build');
    }

    function wwwAssetModuleCwd(name) {
        return path.join('www/asset', 'module-' + name);
    }

    function wwwAssetThemeCwd(name) {
        return path.join('www/asset', 'theme-' + name);
    }

    function vender(name) {
        return path.join('www/static/vendor', name);
    }

    /**
     * Define module paths
     * @type {string|*}
     */
    var modules = (function () {
        var modules = [];
        if (config.modules == 'all') {
            //Auto read usr/module file name
            fs.readdirSync('usr/module')
                .forEach(function (path) {
                    if (~path.indexOf('.')) return;
                    modules.push(path);
                });
        } else if (util.isArray(config.modules)) {
            modules = config.modules;
        }

        return modules;
    })();

    /**
     * Define theme paths
     * @type {string|*}
     */
    var themes = (function () {
        var themes = [];
        if (config.themes == 'all') {
            //Auto read usr/module file name
            fs.readdirSync('usr/theme')
                .forEach(function (path) {
                    if (~path.indexOf('.')) return;
                    themes.push(path);
                });
        } else if (util.isArray(config.themes)) {
            themes = config.themes;
        }

        return themes;
    })();

    /**
     * 1. Copy for build
     * 2. publish www/asset to module asset, it will be useful when you develop in windows.After
     *    you done module asset, you can use 'grunt back'.
     */
    var copyOpts = (function () {
        var ret = {
            build: {
                files: []
            },
            www: {
                files: []
            },
            publishBack: {
                files: []
            }
        };
        modules.forEach(function (item) {
            ret.build.files.push({
                cwd: assetModuleCwd(item),
                src: ['**'],
                dest: assetModuleCwdBuild(item),
                expand: true
            });
            ret.www.files.push({
                cwd: assetModuleCwd(item),
                src: ['**'],
                dest: wwwAssetModuleCwd(item),
                expand: true
            });
            ret.publishBack.files.push({
                cwd: wwwAssetModuleCwd(item),
                src: ['**'],
                dest: assetModuleCwd(item),
                expand: true
            });
            ret.publishBack.files.push({
                cwd: path.join('www/public/', 'module-' + item),
                src: ['**'],
                dest: path.join('usr/module/', item, 'public'),
                expand: true
            });
        });
        themes.forEach(function (item) {
            ret.build.files.push({
                cwd: assetThemeCwd(item),
                src: ['**'],
                dest: assetThemeCwdBuild(item),
                expand: true
            });
            ret.www.files.push({
                cwd: assetThemeCwd(item),
                src: ['**'],
                dest: wwwAssetThemeCwd(item),
                expand: true
            });
            ret.publishBack.files.push({
                cwd: wwwAssetThemeCwd(item),
                src: ['**'],
                dest: assetThemeCwd(item),
                expand: true
            });
        });
        return ret;
    })();

    /**
     * Sync sources with www asset directory
     */
    var syncOpts = (function () {
        var ret = {
            www: {
                files: [],
                verbose: true,
                // pretend: true,
                updateAndDelete: true,
                compareUsing: 'md5'
            }
        };
        modules.forEach(function (item) {
            ret.www.files.push({
                cwd: assetModuleCwd(item),
                src: ['**'],
                dest: wwwAssetModuleCwd(item),
                expand: true
            });
        });
        themes.forEach(function (item) {
            ret.www.files.push({
                cwd: assetThemeCwd(item),
                src: ['**'],
                dest: wwwAssetThemeCwd(item),
                expand: true
            });
        });

        // console.log(ret.www.files);
        return ret;
    })();

    /**
     * Clear modules or themes asset build files
     */
    var cleanOpts = (function () {
        var ret = {
            pi: {
                src: [vender('angular') + 'pi*.min.js', vender('angular') + 'i18n/*.min.js']
            },
            build: {},
            www: {}
        };
        var builds = [];
        var www = [];
        modules.forEach(function (item) {
            builds.push(assetModuleCwdBuild(item));
            www.push(wwwAssetModuleCwd(item));
        });
        themes.forEach(function (item) {
            builds.push(assetThemeCwdBuild(item));
            www.push(wwwAssetThemeCwd(item));
        });

        ret.build.src = builds;
        ret.www.src = www;
        return ret;
    })();

    /**
     * Uglify configuration
     * @type {Array}
     */
    var uglifyOpts = (function () {
        var ret = {
            options: {
                //banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            pi: {
                cwd: vender('angular'),
                src: ['pi*.js', 'i18n/*.js'],
                expand: true,
                dest: vender('angular'),
                ext: '.min.js'
            },
            modules: {
                files: []
            },
            themes: {
                files: []
            }
        };
        modules.forEach(function (item) {
            ret.modules.files.push({
                cwd: assetModuleCwdBuild(item),
                src: '**/*.js',
                dest: assetModuleCwdBuild(item),
                expand: true
            });
        });
        themes.forEach(function (item) {
            ret.themes.files.push({
                cwd: assetThemeCwdBuild(item),
                src: '**/*.js',
                dest: assetThemeCwdBuild(item),
                expand: true
            });
        });
        return ret;
    })();

    /**
     * Cssmin configuration
     * @type {Array}
     */
    var cssminOpts = (function () {
        var list = [];
        modules.forEach(function (item) {
            list.push({
                cwd: assetModuleCwdBuild(item),
                src: '**/*.css',
                dest: assetModuleCwdBuild(item),
                expand: true
            });
        });
        themes.forEach(function (item) {
            list.push({
                cwd: assetThemeCwdBuild(item),
                src: '**/*.css',
                dest: assetThemeCwdBuild(item),
                expand: true
            });
        });
        return list;
    })();

    /**
     * Watch configuration
     * @type {{assets: {files: Array, tasks: string[]}}}
     */
    var watchOpts = (function () {
        var ret = {
            assets: {
                files: [],
                tasks: ['sync:www']
            },
            options: {
                livereload: true,
                spawn: false
            }
        };
        modules.forEach(function (item) {
            // if(item != 'meteo'){
                ret.assets.files.push(assetModuleCwd(item) + '/**/*.*');
            // }
        });
        themes.forEach(function (item) {
            ret.assets.files.push(assetThemeCwd(item) + '/**/*.*');
        });

        /**
         * Exclude some directory
         */
        if(config.exclude){
            ret.assets.files.push(config.exclude);
        }

        return ret;
    })();

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: copyOpts,
        sync: syncOpts,
        uglify: uglifyOpts,
        clean: cleanOpts,
        cssmin: cssminOpts,
        watch: watchOpts
    });

    // Load the plugin.
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-sync');

    // execute standard assets publishing (as from pi backend)
    grunt.registerTask('default', ['sync:www', 'watch']);

    //Handler asset files for optimize loading
    grunt.registerTask('optimize', ['clean', 'copy:build', 'uglify', 'cssmin']);

    //Clear modules and themes asset build
    grunt.registerTask('clear', ['clean:build']);
};