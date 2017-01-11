var browserify = require('browserify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

var minify = require('gulp-minify');

gulp.task('bars', function () {
    var b = browserify({
        entries: 'index.js',
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

gulp.task('bars-compiled', function () {
    var b = browserify({
        entries: 'compiled/index.js',
        standalone: 'Bars'
    });

    return b.bundle()
        .pipe(source('bars-compiled.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./src'))
        .pipe(minify({
            ext: {
                min: '.min.js'
            }
        }))
        .pipe(gulp.dest('./src'));
});

gulp.task('app', function () {
    var b = browserify({
        entries: 'app.js',
        standalone: 'App'
    });

    return b.bundle()
        .pipe(source('bars-app.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./src'))
        .pipe(gulp.dest('./demo'))
        .pipe(minify({
            ext: {
                min: '.min.js'
            }
        }))
        .pipe(gulp.dest('./src'));
});

gulp.task('app-compiled', function () {
    var b = browserify({
        entries: 'compiled/app.js',
        standalone: 'App'
    });

    return b.bundle()
        .pipe(source('bars-app-compiled.js'))
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

gulp.task('default', ['bars', 'bars-compiled', 'app', 'app-compiled']);
