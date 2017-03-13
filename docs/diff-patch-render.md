model => diff => patches => render

From the model and template we calculate diffs of template model dependencies.
Using the template model dependencies diffs we calculate patches to the DOM that need to occur.
Finally we apply the Patches to the DOM.

The Bars template compiler is smart enough to build a DOM-like tree while differentiating static and dynamic portions of the tree.  This allow us to calculate diffs much faster as we only need to check thing we know might change.

fully static:
```handlebars
<div class="main">
    <span> some text here </span>
</div>
```
tree:
```javascript
root:STATIC
    divNode:STATIC
        attrs:STATIC
            class => 'main':STATIC
        props:STATIC
        binds:STATIC
        children:STATIC
            spanNode:STATIC
                attrs:STATIC
                props:STATIC
                binds:STATIC
                children:STATIC
                    textNode:STATIC
                        value => ' some text here ':STATIC
```

since the whole tree is static it well only be rendered once and the diff calculation will short circuit at the vary beginning.

partly dynamic (most things are never fully dynamic):

```handlebars
<div class="main">
    <span>{{text}}</span>
</div>
```
tree:
```javascript
root:DYNAMIC
    divNode:DYNAMIC
        attrs:STATIC
            class => 'main':STATIC
        props:STATIC
        binds:STATIC
        children:DYNAMIC
            spanNode:DYNAMIC
                attrs:STATIC
                props:STATIC
                binds:STATIC
                children:DYNAMIC
                    textNode:DYNAMIC
                        value => text:DYNAMIC
```

As we can see there is a dynamic path that is created straight form the root to the part of the template that changes.

After the initial render all subsequent renders use just the dynamic sub set of the tree.

dynamic sub set:
```javascript
root:DYNAMIC
    divNode:DYNAMIC
        children:DYNAMIC
            spanNode:DYNAMIC
                children:DYNAMIC
                    textNode:DYNAMIC
                        value => text:DYNAMIC
```

Further optimizations are made by flattening parts of the tree where possible.

flattened:
```javascript
root->divNode->children->spanNode->children->textNode->value => text:DYNAMIC
```

This way we don't have to walk the tree each time to find each dynamic render point.

After the original tree is rendered we create an optimized dynamic update tree.  From this optimized tree we calculate model dependencies diffs which we then patch into the rendered DOM view.

To optimize the model dependencies diff calculation we store the previous model dependencies and compare those to the updated model.  This allow us to optimize transforms/expression strategies by not executing them if the input model dependencies have not changed.
