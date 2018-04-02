// ==========================================================================
// Gulp build script
// ==========================================================================
/* global require, __dirname */
/* eslint no-console: "off" */

const gulp = require('gulp');
const sass = require('gulp-sass');
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
        sass: path.join(root, 'src/sass'),
        js: path.join(root, 'src/js'),
    },
    dist: path.join(root, 'dist'),
    docs: path.join(root, 'docs'),
};

// List of tasks
const tasks = {
    sass: [],
    js: [],
};

// Browserlist
const browsers = ['> 1%'];

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

// Process SASS files
Object.keys(bundles.sass).forEach(key => {
    const name = `sass:${key}`;
    tasks.sass.push(name);

    gulp.task(name, () =>
        gulp
            .src(path.join(paths.src.sass, bundles.sass[key]))
            .pipe(
                plumber({
                    errorHandler: onError,
                }),
            )
            .pipe(sass())
            .pipe(concat(key))
            .pipe(
                autoprefixer({
                    cascade: false,
                }),
            )
            .pipe(
                cleanCSS({
                    level: {
                        1: {
                            specialComments: false,
                        },
                    },
                }),
            )
            .pipe(gulp.dest(paths.docs)),
    );
});

// Process JavaScript files
Object.keys(bundles.js).forEach(key => {
    const name = `js:${key}`;
    tasks.js.push(name);

    gulp.task(name, () => {
        const src = bundles.js[key].map(file => path.join(paths.src.js, file));

        return gulp
            .src(src)
            .pipe(
                plumber({
                    errorHandler: onError,
                }),
            )
            .pipe(sourcemaps.init())
            .pipe(concat(key))
            .pipe(
                babel({
                    presets: [[
                        'env',
                        {
                            targets: {
                                browsers,
                            },
                            useBuiltIns: true,
                            modules: false,
                        },
                    ]],
                    plugins: ['external-helpers'],
                    babelrc: false,
                }),
            )
            .pipe(
                rename({
                    suffix: '.es5',
                }),
            )
            .pipe(gulp.dest(paths.dist))
            .pipe(
                rename({
                    suffix: '.min',
                }),
            )
            .pipe(
                uglify({ compress: true }).on('error', e => {
                    console.log(e);
                }),
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

    gulp.watch(watches, tasks.sass.concat(tasks.js));
});

gulp.task('default', tasks.sass.concat(tasks.js).concat(['watch']));
