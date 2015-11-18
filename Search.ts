module Search {
	
	/**
	 * Presents the path to each property on the object using breadth first searching
	 * @param {Object} obj The object to navigate
	 * @param {Function} action A function which receives the path as an array, return true to stop navigation for that branch
	 */
	
	export function breadth(obj: Object, action: (path: string[]) => boolean): void {
		var queue: string[][] = [[]];
		
		while(queue.length) {
			var path = queue.shift();
			if (action(path)) continue;
			var inst = Resolve.path(obj, path);
			if (!(inst instanceof Object)) continue;
			for (var i in inst) {
				var next = path.concat(i);
				queue.push(next);
			}
		}
	}
	
	/**
	 * Presents the path to each property on the object using depth first searching
	 * @param {Object} obj The object to navigate
	 * @param {Function} action A function which receives the path as an array, return true to stop navigation for that branch
	 */
	
	export function depth(obj: Object, action: (path: string[]) => boolean): void {
		var queue: string[][] = [[]];
		
		while(queue.length) {
			var path = queue.shift();
			if (action(path)) continue;
			var inst = Resolve.path(obj, path);
			if (!(inst instanceof Object)) continue;
			for (var i in inst) {
				var next = path.concat(i);
				queue.unshift(next);
			}
		}
	}
}

module Resolve {
	/**
	 * Resolves an object's path using an array of strings as keys
	 * @param {Object} obj Object to search inside
	 * @param {Array} path The route to the property to assign
	 */
	export function path(obj: Object, path: string[]): Object {
		var result = obj;
		var follow = (value) => result = result[value];
		path.forEach(follow);
		return result;
	}
	
	/**
	 * Assigns a value to a specific route on a path
	 * @param {Object} obj Object to assign to
	 * @param {Array} path The route to the property to assign
	 * @param {Object} val The value to assign into the path for obj
	 */
	export function assign(obj: Object, path: string[], val: Object): void {
		var inner = Resolve.path(obj, path.slice(0, -1));
		inner[path[path.length - 1]] = val;
	}
}
