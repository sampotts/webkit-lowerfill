// ==========================================================================
// Gulp build script
// ==========================================================================
/* global require, __dirname */
/* eslint no-console: "off" */

const gulp = require('gulp');
const less = require('gulp-less');
const path = require('path');
const fs = require('fs');
const plumber = require('gulp-plumber');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');

const root = __dirname;

// Paths
const paths = {
    src: {
        less: path.join(root, 'src/less'),
        js: path.join(root, 'src/js'),
    },
    dist: path.join(root, 'dist'),
    docs: path.join(root, 'docs'),
};

// Task names
const names = {
    less: 'less:',
    js: 'js:',
};

// List of tasks
const tasks = {
    less: [],
    js: [],
};

// Load json
function loadJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch (err) {
        return {};
    }
}

// Get bundles
const bundles = loadJSON(path.join(__dirname, 'bundles.json'));

// Error handler
function onError(err) {
    throw err;
}

// Process LESS files
Object.keys(bundles.less).forEach(key => {
    const name = names.less + key;
    tasks.less.push(name);

    gulp.task(name, () =>
        gulp
            .src(path.join(paths.src.less, bundles.less[key]))
            .pipe(
                plumber({
                    errorHandler: onError,
                })
            )
            .pipe(less())
            .pipe(concat(key))
            .pipe(
                autoprefixer({
                    cascade: false,
                })
            )
            .pipe(
                cleanCSS({
                    level: {
                        1: {
                            specialComments: false,
                        },
                    },
                })
            )
            .pipe(gulp.dest(paths.docs))
    );
});

// Process JavaScript files
Object.keys(bundles.js).forEach(key => {
    const name = names.js + key;
    tasks.js.push(name);

    gulp.task(name, () => {
        const src = bundles.js[key].map(file => path.join(paths.src.js, file));

        return gulp
            .src(src)
            .pipe(
                plumber({
                    errorHandler: onError,
                })
            )
            .pipe(sourcemaps.init())
            .pipe(concat(key))
            .pipe(
                babel({
                    presets: ['es2015'],
                })
            )
            .pipe(
                rename({
                    suffix: '.es5',
                })
            )
            .pipe(gulp.dest(paths.dist))
            .pipe(
                rename({
                    suffix: '.min',
                })
            )
            .pipe(
                uglify({ compress: true }).on('error', e => {
                    console.log(e);
                })
            )
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(paths.dist))
            .pipe(gulp.dest(paths.docs));
    });
});

gulp.task('watch', () => {
    const watches = Object.keys(paths.src).map(type => {
        const src = paths.src[type];
        return path.join(src, '**');
    });

    gulp.watch(watches, tasks.less.concat(tasks.js));
});

gulp.task('default', tasks.less.concat(tasks.js).concat(['watch']));
