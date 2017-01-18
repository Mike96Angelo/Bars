var Generator = require('generate-js');

var MapIterator = Generator.generate(function MapIterator(map, keys, values) {
    var _ = this;

    if (!Map.isCreation(map)) {
        throw new TypeError('Cannot construct MapIterator from non-Map objects.');
    }


    _.keys = keys;
    _.values = values;
    _.index = 0;

    _.map = map;
});

MapIterator.definePrototype({
    next: function next() {
        var _ = this,
            value,
            done = _.index >= _.map.size;

        if (_.keys && _.values) {
            value = [_.map._keys[_.index], _.map._values[_.index]];
        } else if (_.keys) {
            value = _.map._keys[_.index];
        } else if (_.values) {
            value = _.map._values[_.index];
        } else {
            done = true;
        }

        _.index++;

        return {
            value: value,
            done: done
        };
    }
});

var Map = Generator.generate(function Map(arr) {
    var _ = this;
    _.clear();

    if (arr) {
        for (var i = 0; i < arr.length; i++) {
            _.set(arr[i][0], arr[i][1]);
        }
    }
});

Map.definePrototype({
    size: {
        get: function get() {
            var _ = this;

            return this._keys.length;
        }
    },
    get: function get(key) {
        var _ = this;

        var index = _._keys.indexOf(key);

        return _._values[index];
    },
    set: function set(key, value) {
        var _ = this;

        var index = _._keys.indexOf(key);

        if (index === -1) {
            _._keys.push(key);
            _._values.push(value);
        } else {
            _._values[index] = value;
        }

        return _;
    },
    has: function has(key) {
        var _ = this;

        return _._keys.indexOf(key) !== -1;
    },
    delete: function _delete(key) {
        var _ = this;

        var index = _._keys.indexOf(key);
        var r = index !== -1;

        if (r) {
            _._keys.splice(index, 1);
            _._values.splice(index, 1);
        }

        return r;
    },
    clear: function clear() {
        var _ = this;
        _._keys = [];
        _._values = [];
        return _;
    },
    keys: function keys() {
        var _ = this;

        return new MapIterator(_, true, false);
    },
    forEach: function forEach(func, thus) {
        var _ = this;

        for (var i = 0; i < _.keys.length; i++) {
            func.call(thus || _, _._values[i], _.keys[i], thus || _);
        }

        return _;
    },
    values: function values() {
        var _ = this;

        return new MapIterator(_, false, true);
    },
    entries: function entries() {
        var _ = this;

        return new MapIterator(_, true, true);
    }
});

module.exports = Map;

if (typeof window === 'object') {
    if (!window.Map) {
        window.Map = Map;
    }
}
