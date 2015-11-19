/**
 * Decorator applied to classes, which registers them as part of the type serialiser.
 */
function serialise(key: string): (target: Object) => void;
function serialise(target: Object): void;
function serialise(argument: any): any {
	var key = argument.name || argument;
	var serialise = function(target: Object) {
		Object.defineProperty(target, '$type', { 'value': key });
		Json.TypePlugin.types[key] = target;
	}
	return key == argument ? serialise : serialise(argument);
}

namespace Json {
	/**
	 * Converts an object into the JSON format.
	 */
	export function serialise(obj: Object): string {
		return new Provider().serialise(obj);
	}

	/**
	 * Rehydrates a string back into its original Object from a JSON string.
	 */
	export function deserialise<T>(json: string): T;
	export function deserialise(json: string): Object;
	export function deserialise(json: string): Object {
		return new Provider().deserialise(json);
	}
	
	/**
	 * Used by the Provider to register plugins to transform the object passed. 
	 */
	export interface ProviderPlugin {
		map(obj: Object, map: Object, path: string[]) : boolean;
		unmap(obj: Object, path: string[]) : boolean;
	}
	
	/**
	 * Fills the clone with the same schema as the original passed.
	 */
	export class PopulatePlugin implements ProviderPlugin {
		public map (obj: Object, map: Object, path: string[]): boolean {
			if (!path.length) return;
			var inst = Resolve.path(obj, path);
			if (inst instanceof Function) return;
			var clone = Object.keys(inst).length || '$type' in inst.constructor ? Object.create(inst.constructor.prototype) : inst;
			Resolve.assign(map, path, clone);
		}
		
		public unmap (): boolean { return false; }
	}
	
	/**
	 * Cleans up the object graph, removing multiple references and replacing them with placeholder objects.
	 */
	export class ReferencePlugin implements ProviderPlugin {
		
		private paths = [];
		private references = [];
		
		public map (obj: Object, map: Object, path: string[]): boolean {
			var inst = Resolve.path(obj, path);
			
			if (!(inst instanceof Object) || inst instanceof Function) return;
			
			var index = this.references.indexOf(inst);
			
			if (index > -1) {
				Resolve.assign(map, path, {'$ref' : this.paths[index]});
				return true;
			}
			
			this.paths.push(path.join('/'));
			this.references.push(inst);
		}
		
		public unmap(obj: Object, path: string[]): boolean {
			var inst = Resolve.path(obj, path);
			var keys = Object.keys(inst);
			if (keys.length != 1 || keys[0] != '$ref') return;
			var refpath = inst['$ref'].split('/');
			var ref = Resolve.path(obj, refpath);
			Resolve.assign(obj, path, ref);
			return true;
		}
	}
	
	/**
	 * Stores types registered using the @serialise decorator. Dehydrates, and rehydrates those types.
	 */
	export class TypePlugin implements ProviderPlugin {
		static types = {};
		public map(obj: Object, map: Object, path: string[]): boolean {
			var inst = Resolve.path(obj, path);
			if (!inst.constructor.hasOwnProperty('$type')) return;
			Resolve.assign(map, path.concat('$type'), inst.constructor['$type']);
		}
		
		public unmap(obj: Object, path: string[]): boolean {
			var inst = Resolve.path(obj, path);
			if (!inst.hasOwnProperty('$type')) return;
			var type = TypePlugin.types[inst['$type']];
			var clone = Object.create(type.prototype);
			for (var i in inst) {
				if (i == '$type') continue;
				clone[i] = inst[i];
			}
			Resolve.assign(obj, path, clone);
		}
	}
	
	/**
	 * Restores Dates to date objects
	 */
	export class DatePlugin implements ProviderPlugin {
		static dateRegex = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|([+-]\d\d:\d\d))$/;
		public map () { return false; }
		
		public unmap(obj: Object, path: string[]): boolean {
			var inst = Resolve.path(obj, path);
			if (typeof inst != 'string' || !DatePlugin.dateRegex.test(inst as string)) return;
			Resolve.assign(obj, path, new Date(inst as string));
		}
	}

	/**
	 * Performs the actions to convert to and from Json, while calling the plugins to handle special functionality.
	 */
	export class Provider {
		private plugins: ProviderPlugin[] = [
			new ReferencePlugin(),
			new PopulatePlugin(),
			new TypePlugin(),
			new DatePlugin()
		];
	
		public serialise(obj: Object): string {
			return JSON.stringify(this.map(obj));
		}
	
		public deserialise(json: string): Object {
			return this.unmap(JSON.parse(json));
		}
	
		private map(obj: Object): Object {
			
			var map = {};
			var handlePlugins = (path: string[]):boolean => {
				var result = false;
				this.plugins.forEach((plugin) => result = result || plugin.map(obj, map, path));
				return result;
			};
			
			obj = {'#': obj};
			
			Search.breadth(obj, handlePlugins);
			
			return map['#'];
		}
	
		private unmap(obj: Object): Object {
			
			var handlePlugins = (path:string[]):boolean => {
				var result = false;
				this.plugins.forEach((plugin) => result = result || plugin.unmap(obj, path));
				return result;
			};
			
			obj = {'#': obj};
			
			Search.breadth(obj, handlePlugins);
			
			return obj['#'];
		}
	}
}
