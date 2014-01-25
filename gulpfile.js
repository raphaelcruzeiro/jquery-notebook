var gulp = require('gulp'),
  lr = require('tiny-lr'),
  connect = require('connect'),
  http = require('http'),
  open = require('open'),
  uglify = require('gulp-uglify'),
  refresh = require('gulp-livereload'),
  jshint = require('gulp-jshint'),
  rename = require('gulp-rename'),
  stylish = require('jshint-stylish'),
  minifyCSS = require('gulp-minify-css'),
  autoprefixer = require('gulp-autoprefixer'),
  clean = require('gulp-clean'),
  livereload = lr(),
  yeomanConfig = {
    app: '.',
    dist: 'build',
    port: 9001
  },
  lrConfig = {
    port: 35729
  };

var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

gulp.task('scripts', function() {
  return gulp.src(['src/js/*.js', '!src/js/libs/**'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(rename(function(dir, base, ext) {
      return base + '.min' + ext;
    }))
    .pipe(uglify())
    .pipe(refresh(livereload))
    .pipe(gulp.dest(yeomanConfig.dist));
});

gulp.task('styles', function() {
  return gulp.src('src/js/*.css')
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(minifyCSS(opts))
    .pipe(rename(function(dir, base, ext) {
      return base + '.min' + ext;
    }))
    .pipe(refresh(livereload))
    .pipe(gulp.dest(yeomanConfig.dist));
});

gulp.task('clean', function() {
  return gulp.src([yeomanConfig.dist +'/*'], {read: false})
    .pipe(clean());
});

gulp.task('connect-livereload', function(){
  var middleware = [
      require('connect-livereload')({ port: lrConfig.port }),
      mountFolder(connect, yeomanConfig.app),
      connect.directory(yeomanConfig.app)
  ];

  var app = connect.apply(null, middleware);

  var server = http.createServer(app);

  server
    .listen(yeomanConfig.port)
    .on('listening', function() {
        console.log('Started connect web server on http://localhost:' + yeomanConfig.port + '.');

        open('http://localhost:' + yeomanConfig.port);
    });
});

gulp.task('tinylr', function(){
  livereload.listen(lrConfig.port, function(err){
    if (err) {
      return console.log(err);
    }
  });
});
 
gulp.task('server', ['clean'], function(){
  gulp.run('scripts', 'styles', 'connect-livereload', 'tinylr');

  gulp.watch([yeomanConfig.app + '/src/**/*.css'], function(){
    gulp.run('styles');
    console.log('Waiting...');
  });

  gulp.watch([yeomanConfig.app + '/src/**/*.js'], function(){
    gulp.src(yeomanConfig.app + '/src/**/*.js')
      .pipe(refresh(livereload));

    console.log('Waiting...');
  });

  gulp.watch([yeomanConfig.app + '/*.html'], function(){
    gulp.src(yeomanConfig.app + '/*.html')
      .pipe(refresh(livereload));
  });
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['clean'] , function() {
  gulp.run('scripts', 'styles');
});