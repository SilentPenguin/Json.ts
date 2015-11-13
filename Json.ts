module Json {
	export function serialize(obj: Object):string {
		return JSON.stringify(map(obj));
	}
	
	export function deserialize(json: string): Object {
		return unmap(JSON.parse(json));
	}
	
	function map(obj: Object): Object {
		var map: Object,
			paths: Object[],
			references: Object[];
			
		map = {};
		paths = ['#'];
		references = [obj];
		
		var insertReferences = function(item, i) {
			if (!(item.inst[i] instanceof Object)) {
				item.node[i] = item.inst[i];
				return;
			}
			
			var index = references.indexOf(item.inst[i]);
			
			if (index > -1) {
				item.node[i] = {'$ref': paths[index]};
				return;
			}
			
			var path = item.path + '/' + i;
			paths.push(path);
			references.push(item.inst[i]);
			item.node[i] = item.inst[i];
			return {'path': path, 'inst': item.inst[i], 'node': item.node[i]};
		};
		
		breadthSearch({'path': '#', 'inst': obj, 'node': map}, (item) => item['inst'], insertReferences);

		return map;
	}
	
	function unmap(json: Object): Object {
		var removeReferences = function(item, i) {
			var keys = Object.keys(item[i]);
			
			if (keys.length != 1 || keys[0] != '$ref')
				return item[i];
			item[i] = locate(json, item[i]['$ref']);
		}
		
		breadthSearch(json, (item) => item, removeReferences)
		
		return json;
	}
	
	function locate(json: Object, $ref:String):Object {
		var result: Object,
			queue: string[];
		
		queue = $ref.split('/');
		
		var followPath = (value) => result = value == '#' ? json : result[value];
		
		queue.forEach(followPath)
		
		return result;
	}
	
	function breadthSearch(start: Object, selector: (next: Object) => Object, action:(item: Object, i:Object)=> Object)
	{
		var queue = [start];
		while(queue.length){
			var item = queue.shift();
			for(var i in selector(item)){
				var result = action(item, i);
				if (result == undefined) continue;
				queue.push(result);
			}
		}
	}
}
