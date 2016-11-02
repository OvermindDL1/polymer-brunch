'use strict';

const FS = require('fs');
const Path = require('path');
const Vulcanize = require('vulcanize');
const Crisper = require('crisper');
const Analyzer = require('polymer-analyzer/lib/analyzer');
const FSUrlLoader = require('polymer-analyzer/lib/url-loader/fs-url-loader').FSUrlLoader;

// Documentation for Brunch plugins:
// https://github.com/brunch/brunch/blob/master/docs/plugins.md

// Remove everything your plugin doesn't need.
class PolymerBrunchPlugin {
  constructor(config) {
    this.config = config && config.plugins && config.plugins.polymer || {};

    this.vulcanize = this.config.vulcanize || {};
    this.vulcanize.options = this.vulcanize.options || {};
    if(this.vulcanize.options.abspath === undefined) {
      this.vulcanize.options.abspath = process.cwd();
    }
    this.vulcanize._global = new Vulcanize(this.vulcanize.options);

    this.crisper = this.config.crisper || {};
    this.crisper.options = this.crisper.options || {};
    if(this.crisper.options.htmlOutputPath === undefined) {
      this.crisper.options.htmlOutputPath = Path.posix.join(config.paths.public, "webcomponents");
    }

    // console.log("Polymer Brunch Plugin Loaded 1");
  }

  getFilenameWithNewExt(filename, newExt) {
    const ext = Path.extname(filename);
    return filename.slice(0, -ext.length) + newExt;
  }

  // file: File => Promise[Boolean]
  // Called before every compilation. Stops it when the error is returned.
  // Examples: ESLint, JSHint, CSSCheck.
  // lint(file) { return Promise.resolve(true); }

  // file: File => Promise[File]
  // Transforms a file data to different data. Could change the source map etc.
  // Examples: JSX, CoffeeScript, Handlebars, SASS.
  // compile(file) { return Promise.resolve(file); }
  compile({data, path}) {
    const self = this;
    //  TODO:  Get filename and look it up as an option to override a global options for both vulcanize and crisper:
    const vulcanize = self.vulcanize;
    const crisper = self.crisper;
    return new Promise((resolve, reject) => {
      vulcanize._global.process(path, (err, inlinedHtml) => {
        if(err) reject(err);
        else {
          if(crisper == 'disabled') resolve(inlinedHtml);
          else {
            var output = Crisper(Object.assign(crisper.options, {
              source: inlinedHtml,
              onlySplit: true,
              alwaysWriteScript: true,
            }));
            const filename = self.getFilenameWithNewExt(Path.basename(path), '.html');
            FS.writeFile(Path.posix.join(crisper.options.htmlOutputPath, filename), output.html, (e) => {
              if(e) reject(e);
              else resolve(output.js);
            });
          }
        }
      });
    });
  }

  // file: File => Promise[File]
  // Transforms a static file into different data.
  // Examples: Jade, Mustache Templates
  // compileStatic(file) { return Promise.resolve(file); }
  // compileStatic({data, path}) {
  //   return new Promise((resolve, reject) => {
  //     resolve("")
  //   });
  // }

  // file: File => Promise[Array: Path]
  // Allows Brunch to calculate dependants of the file and re-compile them too.
  // Examples: SASS '@import's, Jade 'include'-s.
  // getDependencies(file) { return Promise.resolve(['dep.js']); }

  // file: File => Promise[File]
  // Usually called to minify or optimize the end-result.
  // Examples: UglifyJS, CSSMin.
  // optimize(file) { return Promise.resolve({data: minify(file.data)}); }

  // files: [File] => null
  // Executed when each compilation is finished.
  // Examples: Hot-reload (send a websocket push).
  // onCompile(files) {}
  // onCompile(files) {
  //   console.log("POLYMER", "onCompile", files);
  // }

  // Allows to stop web-servers & other long-running entities.
  // Executed before Brunch process is closed.
  // teardown() {}
}

// Required for all Brunch plugins.
PolymerBrunchPlugin.prototype.brunchPlugin = true;

// Required for compilers, linters & optimizers.
// 'javascript', 'stylesheet' or 'template'
PolymerBrunchPlugin.prototype.type = 'template';

// Required for compilers & linters.
// It would filter-out the list of files to operate on.
PolymerBrunchPlugin.prototype.extension = 'polymer';
// PolymerBrunchPlugin.prototype.pattern = /\.js$/;

// PolymerBrunchPlugin.prototype.staticTargetExtension  = 'html';

// Indicates which environment a plugin should be applied to.
// The default value is '*' for usual plugins and
// 'production' for optimizers.
// PolymerBrunchPlugin.prototype.defaultEnv = 'production';
PolymerBrunchPlugin.prototype.defaultEnv = '*';

module.exports = PolymerBrunchPlugin;
