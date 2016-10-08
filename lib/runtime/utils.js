exports.pathResolver = function pathResolver(base, path) {
    base = base.slice();
    path = path.slice();

    while (base.length && path[0] === '..') {
        path.shift();
        base.pop();
    }

    return base.concat(path);
};

exports.pathSpliter = function pathSpliter(path) {
    var splitPath;

    if (path instanceof Array) {
        splitPath = path;
    } else if (typeof path === 'string') {
        if (path.match(/[/]|[.][.]/)) {
            splitPath = path.split('/');
        } else {
            splitPath = path.split('.');
        }

        if (!splitPath[0] && !splitPath[1]) {
            splitPath = ['.'];
        }

        var barsProp = splitPath.pop()
            .split('@');
        if (barsProp[0]) {
            splitPath.push(barsProp[0]);
        }
        if (barsProp[1]) {
            splitPath.push('@' + barsProp[1]);
        }
    } else {
        throw 'bad arrgument: expected String | Array<String>.';
    }

    return splitPath;
};

function findPath(arg) {
    if (arg) {
        if (arg.type === 'insert') {
            return arg.path;
        } else if (
            arg.type === 'opperator' ||
            arg.type === 'transform'
        ) {
            for (var i = 0; i < arg.arguments.length; i++) {
                var argI = findPath(arg.arguments[i]);
                if (argI.type === 'insert') {
                    return argI.argument;
                }
            }
        }
    }

    return '';
}

exports.findPath = findPath;
