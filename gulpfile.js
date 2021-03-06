'use strict';
var path = require('path');
var gulp = require('gulp');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var babel = require('gulp-babel');
var shell = require('shelljs');

// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-core/register');

var handleErr = function (err) {
  console.log(err.message);
  process.exit(1);
};

gulp.task('static', function () {
  return gulp.src(['server/**/*.js', 'modules/**/*.js', 'jobs/**/*.js', 'auth/**/*.js', 'persistence/**/*.js'])
    .pipe(excludeGitignore())
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs())
    .on('error', handleErr);
});

gulp.task('nsp', function (cb) {
  nsp('package.json', cb);
});

gulp.task('pre-test', function () {
  return gulp.src(['modules/**/*.js', 'app.js','server/*.js',  'loader.js', 'models/**/*.js', 'persistence/**/*.js'])
    .pipe(babel())
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['cleanDev', 'pre-test'], function (cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function (err) {
      mochaErr = err;
      console.log(err);
    })
    .pipe(istanbul.writeReports())
    .on('end', function () {
      cb(mochaErr);
    });
});

gulp.task('coveralls', ['test'], function () {
  if (!process.env.CI) {
    return;
  }

  return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
    .pipe(coveralls());
});

gulp.task('cleanDev', function(){
  var localDBFile = 'db.test.sqlite';
  if(shell.test('-f', localDBFile)){
    console.log('====================');
    shell.rm(localDBFile);
  }
  shell.exec('sequelize db:migrate');
});

gulp.task('babel', function () {
  return gulp.src('lib/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('prepublish', ['nsp', 'babel']);
gulp.task('default', ['cleanDev', 'static', 'test', 'coveralls']);
