var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  mocha = require('gulp-mocha');

var running = {};
var watching = {};

gulp.task('jshint', function () {
  running.jshint = ['gulpfile.js', 'lib/**/*.js', 'test/**/*.js'];
  return gulp.src(running.jshint)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('mocha', function () {
  running.mocha = ['lib/**/*.js', 'test/**/*.js'];
  return gulp.src(running.mocha[1])
    .pipe(mocha({reporter: 'spec'}));
});

gulp.task('watch', function () {
  Object.keys(running).forEach(function (key) {
    if(!watching[key]) {
      watching[key] = gulp.watch(running[key], [key]);
    }
  });
});