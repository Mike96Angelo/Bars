function registerConfig(bars, options) {
    var key;

    if (typeof options.transforms === 'object') {
        for (key in options.transforms) {
            if (options.transforms.hasOwnProperty(key)) {
                bars.registerTransform(key, options.transforms[key]);
            }
        }
    }

    if (typeof options.blocks === 'object') {
        for (key in options.blocks) {
            if (options.blocks.hasOwnProperty(key)) {
                bars.registerBlock(key, options.blocks[key]);
            }
        }
    }

    if (typeof options.partials === 'object') {
        for (key in options.partials) {
            if (options.partials.hasOwnProperty(key)) {
                bars.registerPartial(key, options.partials[key]);
            }
        }
    }
}

module.exports = registerConfig;
