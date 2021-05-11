# Json.ts
Json.ts is a thin wrapper around JSON written with Typescript which provides protection against complex object graphs.
# Differences to alternatives
The Majority of examples I looked at when creating Json.ts performed a recursive depth first search of the passed object. Often the references themselves would be buried many instances down in a circular reference where the depth search first incountered them.

With Json.ts I looked to try and maintain your original object as much as possible by performing a breadth first search and keeping additional clutter to a minimum, while still providing easy to read paths to locate objects when working with smaller documents.

References to other paths on the JSON object look like ``{'$ref':'#/absolute/path/to/object'}``. In this case ``#`` denotes the root of the document, and ``/`` marks the division between object depth.

This means that for the given example in https://github.com/jsog/jsog, a circular reference, the result produced by Json.ts is:

```json
[
    {"name": "Sally", "secretSanta": {"$ref":"#/1"}},
    {"name": "Bob", "secretSanta": {"$ref":"#/2"}},
    {"name": "Fred", "secretSanta": {"$ref":"#/0"}}
]
```

The breadth first approach makes the resulting JSON document easier to read in most instances as nesting is reduced.

# Using Json.ts

Making use of Json.ts is relatively simple: There are two methods, serialise, and deserialise.

``serialise`` accepts an object and returns a json string containing references. Any time a duplicate reference is discovered within the object, an object containing a reference path is stored in its place.

``Deserialise`` accepts a json string, and converts it back to an object, after conversion, it seeks out any objects containing only a ``$ref`` property, and replaces that object with the object located at the path.

You can also optionally mark your classes using the ``@serialise`` decorator, which will insert metadata into your object graph mapping the key you provide to the type referenced. When deserialising, the result will be constructed using the keyed object prototype to create the object, meaning your methods and static properties will be available after rehydration.
