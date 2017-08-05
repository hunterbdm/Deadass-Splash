'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var electron = require('electron-connect').server.create();
var series = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function () {
  gulp.src('./styles/sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./styles/css'));
});

gulp.task('watch', function() {
  gulp.watch('./styles/sass/**/*.scss', ['sass']);

  gulp.start(electron.reload);
});

gulp.task('serve', function () {
	// Start browser process
  electron.start();

  // Restart browser process
  gulp.watch('main.js', electron.restart);
  // Reload renderer process
  gulp.watch(['index.js', 'index.html', 'main.js'], electron.reload);

});

gulp.task('default', series('serve', 'watch'));