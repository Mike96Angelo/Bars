var browserify = require('browserify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

gulp.task('js', function() {
    var b = browserify({
        entries: 'index.js'
    });

    return b.bundle()
        .pipe(source('bars.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./src'))
        .pipe(gulp.dest('./demo'))
        .pipe(gulp.dest('./benchmark'))
        .pipe(gulp.dest('./test'));
});

gulp.task('watch', ['default'], function(){
    gulp.watch(['./**/*'], ['js']);
});

gulp.task('default', ['js']);
