var browserify = require('browserify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

var minify = require('gulp-minify');

gulp.task('package', function () {
    var b = browserify({
        entries: 'lib/bars.js',
        standalone: 'Bars'
    });

    return b.bundle()
        .pipe(source('bars.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./src'))
        .pipe(gulp.dest('./demo'))
        .pipe(gulp.dest('./benchmark'))
        .pipe(gulp.dest('./test'))
        .pipe(minify({
            ext: {
                min: '.min.js'
            }
        }))
        .pipe(gulp.dest('./src'));
});

gulp.task('runtime', function () {
    var b = browserify({
        entries: 'lib/bars-runtime.js'
    });

    return b.bundle()
        .pipe(source('bars-runtime.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./src'))
        .pipe(minify({
            ext: {
                min: '.min.js'
            }
        }))
        .pipe(gulp.dest('./src'));
});

gulp.task('watch', ['default'], function () {
    gulp.watch(['./lib/**/*'], ['default']);
});

gulp.task('default', ['package', 'runtime']);
