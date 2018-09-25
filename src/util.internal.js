// This file is used to use TypeScript-illegal or difficult code.
// Mainly is used for Parcel patching, since Parcel isn't officially made for execution outside of CLI.

const Bundle = require("parcel/src/Bundle");
const Path = require("path");
const parcelLogger = require("parcel/src/Logger");

// Logger Patch - Disables clutter messages and routes through our logging
parcelLogger.clear = () => undefined;
parcelLogger.writeLine = (_,msg) => console.log(msg);
const oldStatus = parcelLogger.status.bind(parcelLogger);
parcelLogger.status = (emoji, message, color) => {
    if (emoji.includes("⏳") && !message.includes("Building...")) return;
    oldStatus(emoji, message, color);
}

// Disables the hash in file name output
Bundle.prototype.getHashedBundleName = function() {
    // If content hashing is enabled, generate a hash from all assets in the bundle.
    // Otherwise, use a hash of the filename so it remains consistent across builds.
    let ext = Path.extname(this.name);
    let entryAsset = this.entryAsset || this.parentBundle.entryAsset;
    let name = Path.basename(entryAsset.name, Path.extname(entryAsset.name));
    let isMainEntry = entryAsset.options.entryFiles[0] === entryAsset.name;
    let isEntry =
      entryAsset.options.entryFiles.includes(entryAsset.name) ||
      Array.from(entryAsset.parentDeps).some(dep => dep.entry);

    // If this is the main entry file, use the output file option as the name if provided.
    if (isMainEntry && entryAsset.options.outFile) {
      let extname = Path.extname(entryAsset.options.outFile);
      if (extname) {
        ext = this.entryAsset ? extname : ext;
        name = Path.basename(entryAsset.options.outFile, extname);
      } else {
        name = entryAsset.options.outFile;
      }
    }

    // If this is an entry asset, don't hash. Return a relative path
    // from the main file so we keep the original file paths.
    if (isEntry) {
      return Path.join(
        Path.relative(
          entryAsset.options.rootDir,
          Path.dirname(entryAsset.name)
        ),
        name + ext
      );
    }

    // If this is an index file, use the parent directory name instead
    // which is probably more descriptive.
    if (name === 'index') {
      name = Path.basename(Path.dirname(entryAsset.name));
    }

    // Add the content hash and extension.
    return name + ext;
}