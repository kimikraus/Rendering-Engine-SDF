class Vector
{
	constructor(x, y, z)
	{
		this.x = x;
		this.y = y;
		this.z = z;
	}
	
	clone()
	{
		return new Vector(this.x, this.y, this.z);
	}
	
	norm()
	{
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
	}
	
	normalized()
	{
		var length = this.norm();
		return new Vector(this.x / length, this.y / length, this.z / length);
	}
	
	add(other)
	{
		return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
	}
	
	sub(other)
	{
		return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
	}
	
	mul(scalar)
	{
		return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
	}
	
	div(scalar)
	{
		return new Vector(this.x / scalar, this.y / scalar, this.z / scalar);
	}
	
	compProduct(other)
	{
		return new Vector(this.x * other.x, this.y * other.y, this.z * other.z);
	}
	
	dotProduct(other)
	{
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}
}

class Ray
{
	constructor(origin, direction)
	{
		this.origin = origin;
		this.direction = direction.normalized();
	}
	
	clone()
	{
		return new Ray(this.origin.clone(), this.direction.clone());
	}
}

class PerspectiveCamera
{
	constructor(focalLength=50, sensorWidth=32, sensorHeight=18)
	{
		this.focalLength = focalLength;
		this.sensorWidth = sensorWidth;
		this.sensorHeight = sensorHeight;
	}
	
	project(x, y)
	{
		return new Ray(new Vector(0, 0, 0), new Vector((x - 0.5) * this.sensorWidth, -(y - 0.5) * this.sensorHeight, -this.focalLength));
	}
}

class DistanceShaderPair
{
	constructor(distance, shader)
	{
		this.distance = distance;
		this.shader = shader;
	}
}

class DirectionalLight
{
	constructor(dir, color)
	{
		this.dir = dir.normalized();
		this.color = color;
	}
	
	clone()
	{
		return new DirectionalLight(this.dir.clone(), this.color.clone());
	}
	
	getType()
	{
		return typeof(DirectionalLight);
	}
}

class PositionLight
{
	constructor(position, color)
	{
		this.position = position;
		this.color = color;
	}
	
	clone()
	{
		return new PositionLight(this.position.clone(), this.color.clone());
	}
	
	getType()
	{
		return typeof(positionLight);
	}
}

function remap(number, curMin, curMax, min, max)
{
	var startMin = curMin;
	var endMin = min;
	
	curMax -= startMin;
	curMin = 0;
	
	max -= endMin;
	min = 0;
	
	number -= startMin;
	
	number /= curMax;
	number *= max;
	
	number += endMin;
	
	return number;
}

class LinearShade
{
	constructor(color, light)
	{
		this.color = color;
		this.light = light
	}
	
	shade(ray, raymarcher)
	{
		var normal = raymarcher.normal(ray.origin);
		var multiplier = normal.dotProduct(this.light.dir);
		
		if(multiplier <= 0.45)
		{
			multiplier = remap(multiplier, 0, 0.45, 0.2, 0.45);
		}
		else if(multiplier >= 0.55)
		{
			multiplier = remap(multiplier, 0.55, 1, 0.8, 1);
		} else if(multiplier <= 0.5)
		{
			//multiplier = remap(multiplier, 0.4, 0.5, 0.2, 0.5);
		} else
		{
			multiplier = remap(multiplier, 0.5, 0.55, 0.5, 0.8);
		}
		
		return this.color.compProduct(this.light.color).mul(multiplier);
	}
}

class CartoonShade
{
	constructor(color, light)
	{
		this.color = color;
		this.light = light
	}
	
	shade(ray, raymarcher)
	{
		var normal = raymarcher.normal(ray.origin);
		var multiplier = normal.dotProduct(this.light.dir);
		
		if(multiplier >= 0.5)
		{
			multiplier = 1;
		}
		else
		{
			multiplier = 0.4;
		}
		
		return this.color.compProduct(this.light.color).mul(multiplier);
	}
}

/*
class Lambertian
{
	constructor(color, light)
	{
		this.color = color;
		this.light = light;
	}
	
	shade(ray, raymarcher)
	{
		var normal = raymarcher.normal(ray.clone().origin);
		
		var r = new Ray(ray.origin.add(ray.direction.mul(-0.1)), new Vector(0, 0, 0));
		
		if(this.light.getType() == typeof(DirectionalLight))
		{
			r.direction = this.light.dir;
		} else{
			r.direction = this.light.position.sub(r.origin).normalized();
		}
		
		var distance = raymarcher.sdf(r.origin).distance;
		
		while(r.origin.norm() < raymarcher.backgroundDistance + 1000 && Math.abs(distance) > 0.0001)
		{
			r.origin = r.origin.add(r.direction.mul(distance));
			distance = raymarcher.sdf(r.origin).distance;
		}
		
		var shadowMult = 0.3;
		if(r.origin.norm() >= raymarcher.backgroundDistance + 1000)
		{
			shadowMult = 1;
		}
		
		return this.color.compProduct(this.light.color).mul(normal.dotProduct(r.direction)).mul(shadowMult);
	}
}
*/

class Lambertian
{
	constructor(color, lights)
	{
		this.color = color;
		this.lights = lights;
	}
	
	shade(ray, raymarcher)
	{
		var normal = raymarcher.normal(ray.clone().origin);
		
		var shadowMults = new Vector(0, 0, 0);
		
		for(var i = 0; i < this.lights.length; i++)
		{
			var r = new Ray(ray.origin.add(ray.direction.mul(-0.1)), new Vector(0, 0, 0));
				
			if(this.lights[i].getType() == typeof(DirectionalLight))
			{
				r.direction = this.lights[i].dir;
			}
			else
			{
				r.direction = this.lights[i].position.sub(r.origin).normalized();
			}
			
			var distance = raymarcher.sdf(r.origin).distance;
			
			while(r.origin.norm() < raymarcher.backgroundDistance + 1000 && Math.abs(distance) > 0.0001)
			{
				r.origin = r.origin.add(r.direction.mul(distance));
				distance = raymarcher.sdf(r.origin).distance;
			}
			
			if(r.origin.norm() >= raymarcher.backgroundDistance)
			{
				var shadowMult = this.lights[i].color;
			}
			else
			{
				var shadowMult = this.lights[i].color.mul(0.3);
			}
			
			var dotProduct = Math.max(0, normal.dotProduct(r.direction));
			shadowMults = shadowMults.add(shadowMult.mul(dotProduct));
		}
		//shadowMults = shadowMults.div(this.lights.length);
		
		return this.color.compProduct(shadowMults);
	}
}

class ConstantColor
{
	constructor(color)
	{
		this.color = color;
	}
	
	shade(ray, raymarcher)
	{
		return this.color;
	}
}

class Checkerboard
{
	constructor(shader1, shader2, tileSize)
	{
		this.shader1 = shader1;
		this.shader2 = shader2;
		this.tileSize = tileSize;
	}
	
	shade(ray, raymarcher)
	{
		var p = ray.origin.clone();
		
		if(p.x < 0)
		{
			p.x = Math.abs(p.x) + this.tileSize;
		}
		
		if(p.y < 0)
		{
			p.y = Math.abs(p.y) + this.tileSize;
		}
		
		if(p.z < 0)
		{
			p.z = Math.abs(p.z) + this.tileSize;
		}
		
		var x = p.x % (this.tileSize * 2) >= this.tileSize;
		var y = p.y % (this.tileSize * 2) >= this.tileSize;
		var z = p.z % (this.tileSize * 2) >= this.tileSize;
		
		if(x ^ y ^ z)
		{
			return this.shader1.shade(ray, raymarcher);
		} else
		{
			return this.shader2.shade(ray, raymarcher);
		}
	}
}

function union(sdf1, sdf2)
{
	return function(p)
	{
		if(sdf1(p).distance <= sdf2(p).distance)
		{
			return sdf1(p);
		} else
		{
			return sdf2(p);
		}
	}
}

function cutOut(sdf, cutOutSDF)
{
	return function(p)
	{
		distance = sdf(p).distance;
		cutOutDistance = cutOutSDF(p).distance;
		
		return new DistanceShaderPair(Math.max(distance, -cutOutDistance), sdf(p).shader);
	}
}

function cutOutShader(sdf, cutOutSDF)
{
	return function(p)
	{
		distance = sdf(p).distance;
		cutOutDistance = cutOutSDF(p).distance;
		
		max = Math.max(distance, -cutOutDistance);
		
		var shader = null;
		if(max == distance)
		{
			shader = sdf(p).shader;
		} else{
			shader = cutOutSDF(p).shader;
		}
		
		return new DistanceShaderPair(Math.max(distance, -cutOutDistance), shader);
	}
}

function Sphere(radius, shader)
{
	return function(p)
	{
		return new DistanceShaderPair(p.norm() - radius, shader);
	}
}

function Cube(edgeSize, shader)
{
	return function(p)
	{
		var dx = Math.abs(p.x) - edgeSize / 2;
		var dy = Math.abs(p.y) - edgeSize / 2;
		var dz = Math.abs(p.z) - edgeSize / 2;
		
		var inner = Math.min(0, Math.max(dx, dy, dz));
		
		var dx0 = Math.max(0, dx);
		var dy0 = Math.max(0, dy);
		var dz0 = Math.max(0, dz);
		
		var outer = Math.sqrt(dx0 * dx0 + dy0 * dy0 + dz0 * dz0);
		
		return new DistanceShaderPair(inner + outer, shader);
	}
}

function YPlane(y, shader)
{
	return function(p)
	{
		return new DistanceShaderPair(p.y - y, shader);
	}
}

function translate(sdf, translate)
{
	return function(p)
	{
		return sdf(p.sub(translate));
	}
}


function rotateX(sdf, rotation)
{
	let sin = Math.sin(rotation);
	let cos = Math.cos(rotation);
	
	return function(p)
	{
		var y = cos * p.y - sin * p.z;
		var z = sin * p.y + cos * p.z;
		
		return sdf(new Vector(p.x, y, z));
	}
}

function rotateY(sdf, rotation)
{
	let sin = Math.sin(rotation);
	let cos = Math.cos(rotation);
	
	return function(p)
	{
		var x = cos * p.x - sin * p.z;
		var z = sin * p.x + cos * p.z;
		
		return sdf(new Vector(x, p.y, z));
	}
}

function rotateZ(sdf, rotation)
{
	let sin = Math.sin(rotation);
	let cos = Math.cos(rotation);
	
	return function(p)
	{
		var x = cos * p.x - sin * p.y;
		var y = sin * p.x + cos * p.y;
		
		return sdf(new Vector(x, y, p.z));
	}
}

class Raymarcher
{
	constructor(sdf, background = new Background(), backgroundDistance = 1000)
	{
		this.sdf = sdf;
		this.background = background;
		this.backgroundDistance = backgroundDistance;
	}
	
	project(ray)
	{
		var r = ray.clone();
		var ds = this.sdf(r.origin);
		
		while(Math.abs(ds.distance) > 0.0001)
		{
			r.origin = r.origin.add(r.direction.mul(Math.abs(ds.distance)));
			ds = this.sdf(r.origin);
			
			if(r.origin.norm() >= this.backgroundDistance)
			{
				return this.background.project(r);
			}
		}
		
		return ds.shader.shade(r, this);
	}
	
	normal(p)
	{
		var x = this.sdf(new Vector(p.x + 0.001, p.y, p.z)).distance - this.sdf(new Vector(p.x - 0.001, p.y, p.z)).distance;
		var y = this.sdf(new Vector(p.x, p.y + 0.001, p.z)).distance - this.sdf(new Vector(p.x, p.y - 0.001, p.z)).distance;
		var z = this.sdf(new Vector(p.x, p.y, p.z + 0.001)).distance - this.sdf(new Vector(p.x, p.y, p.z - 0.001)).distance;
		
		return new Vector(x, y, z).normalized();
	}
}

class Film
{
	constructor(width, height)
	{
		this.width = parseInt(width);
		this.height = parseInt(height);
	}
	
	trigger(camera, scene, samples)
	{
		var img = new Array(this.width).fill(0).map(()=>new Array(this.height));
		for(var x = 0; x<this.width; x++)
		{
			for(var y = 0; y<this.height; y++)
			{
				var colorSum = new Vector(0, 0, 0);
				for(var sample = 0; sample < samples; sample++)
				{
					var color = scene.project(camera.project((x + Math.random()) / this.width, (y + Math.random()) / this.height));
					colorSum = colorSum.add(color);
				}
				
				var colorAvg = colorSum.div(samples);
				img[x][y] = colorAvg;
			}
		}
		return img;
	}
	
	triggerInChunks(chunkWidth, chunkHeight)
	{
		
	}
	
	triggerAntialiasingOffInChunks(camera, scene, chunkWidth, chunkHeight)
	{
		let canvas = document.getElementById("renderCanvas");
		let width = canvas.getAttribute("width");
		let height = canvas.getAttribute("height");
		let ctx = canvas.getContext("2d");
		
		var curIMGtile = new Array(chunkWidth).fill(0).map(()=>new Array(chunkHeight));
		for(var yIndex = 0; yIndex < toIntRoundUp(height / chunkHeight); y++)
		{
			for(var xIndex = 0; xIndex < toIntRoundUp(width / chunkWidth); x++)
			{
				console.log("chunk");
				
				for(var x = 0; x < chunkWidth; x++)
				{
					for(var y = 0; y < chunkHeight; y++)
					{
						curIMGtile[x][y] = scene.project(camera.project((x + xIndex * chunkWidth + 0.5) / width, (y + yIndex * chunkHeight + 0.5) / height));
					}
				}
				
				for(var imgX = 0; imgX < chunkWidth; imgX++)
				{
					for(var imgY = 0; imgY < chunkHeight; imgY++)
					{
						ctx.fillStyle = "rgba(" + (curIMGtile[imgX][imgY].x * 255) + ", " + (curIMGtile[imgX][imgY].y * 255) + ", " + (curIMGtile[imgX][imgY].z * 255) + ")";
						ctx.fillRect(xIndex * chunkWidth + imgX, yIndex * chunkHeight + imgY, 1, 1);
					}
				}
			}
		}
	}
	
	directShowTriggerAntialiasingOff(camera, scene)
	{
		let canvas = document.getElementById("renderCanvas");
		let ctx = canvas.getContext("2d");
		
		for(var x = 0; x < this.width; x++)
		{
			var y = 0;
			for(var y = 0; y < this.height; y++)
			{
				var color = scene.project(camera.project((x + 0.5) / this.width, (y + 0.5) / this.height));
				ctx.fillStyle = "rgba(" + (color.x * 255) + ", " + (color.y * 255) + ", " + (color.z * 255) + ")";
				ctx.fillRect(x, y, 1, 1);
			}
			console.log(String((x + 1)) + " columns finished!");
		}
	}
	
	triggerAntialiasingOff(camera, scene)
	{
		var img = new Array(this.width).fill(0).map(()=>new Array(this.height));
		for(var x = 0; x<this.width; x++)
		{
			for(var y = 0; y<this.height; y++)
			{
				img[x][y] = scene.project(camera.project((x + 0.5) / this.width, (y + 0.5) / this.height));
			}
		}
		return img;
	}
}

function sleep(milliseconds) {
	const date = Date.now();
	let currentDate = null;
	do {
		currentDate = Date.now();
	} while (currentDate - date < milliseconds);
}

function toIntRoundUp(value)
{
	if(value != parseInt(value))
		value = parseInt(value) + 1;
	else
		value = parseInt(value);
	
	return value;
}

class Background
{
	project(ray)
	{
		var dir = ray.direction;
		if(dir.y < 0){
			return new Vector(0.1, 0.4, 0.1);
		}
		else
		{
			return new Vector(dir.y * 2, dir.y * 4, 1.0);
		}
	}
}


function show(img)
{
	let canvas = document.getElementById("renderCanvas");
	let width = canvas.getAttribute("width");
	let height = canvas.getAttribute("height");
	let ctx = canvas.getContext("2d");
	
	for(var x = 0; x<width; x++)
	{
		for(var y = 0; y<height; y++)
		{
			ctx.fillStyle = "rgba(" + (img[x][y].x * 255) + ", " + (img[x][y].y * 255) + ", " + (img[x][y].z * 255) + ")";
			ctx.fillRect(x, y, 1, 1);
		}
	}
}

/* Notizen
	var light = new DirectionalLight(new Vector(-1, 1, 1), new Vector(1, 1, 1));
	var gray = new Vector(0.5, 0.5, 0.5);
	
	shader1_checkerboard = new Lambertian(new Vector(1, 1, 1), light.clone())
	shader2_checkerboard = new Lambertian(new Vector(0, 0, 0), light.clone())
	
	sdf_checkerboard = YPlane(-Math.sqrt(3), new Checkerboard(shader1_checkerboard, shader2_checkerboard, 1));
	
	sdf_cube = Cube(2, new Lambertian(new Vector(0.2, 0.8, 0.2), light.clone()));
	sdf_sphere = Sphere(1.3, new Lambertian(new Vector(0.7, 0.1, 0.2), light.clone()));
	sdf_sphere2 = Sphere(0.7, new Lambertian(new Vector(0.2, 0.5, 0.4), light.clone()));
	
	sdf_cube = cutOutShader(sdf_cube, sdf_sphere);
	sdf_cube = union(sdf_cube, sdf_sphere2);
	
	sdf_cube = rotateY(sdf_cube, Math.PI / 4);
	sdf_cube = rotateX(sdf_cube, Math.PI / 4);
	sdf_cube = translate(sdf_cube, new Vector(0, 0, -10));
	
	sphere = translate(Sphere(1.3, new CartoonShade(new Vector(0.5, 0.5, 0.5), light.clone())), new Vector(-2, 0, -9));
	
	var sdf = union(sdf_checkerboard, sdf_cube);
*/

function main()
{
	var canvas = document.getElementById("renderCanvas");
	var width = canvas.getAttribute("width");
	var height = canvas.getAttribute("height");
	
	film = new Film(width, height);
	camera = new PerspectiveCamera();
	
	var lights =
	[
		new PositionLight(new Vector(-1.5, 2, -20), new Vector(1, 0.25, 0.25).mul(1)),
		new PositionLight(new Vector(0, 2, -20), new Vector(0.25, 1, 0.25).mul(1)),
		new PositionLight(new Vector(1.5, 2, -20), new Vector(0.25, 0.25, 1).mul(1)),
		new DirectionalLight(new Vector(-1, 1, 1), new Vector(0.3, 0.3, 0.3))
	];
	
	var sdf1 = translate(Sphere(1, new Lambertian(new Vector(0.5, 0.5, 0.5), lights)), new Vector(1.5, 0, -20));
	var sdf2 = translate(Sphere(1, new Lambertian(new Vector(0.5, 0.5, 0.5), lights)), new Vector(-1.5, 0, -20));
	
	var sdf3 = translate(Cube(2, new Lambertian(new Vector(0.5, 0.5, 0.5), lights)), new Vector(4.25, 1.5, -20));
	var sdf4 = translate(Cube(2, new Lambertian(new Vector(0.5, 0.5, 0.5), lights)), new Vector(-4.25, 1.5, -20));
	
	shader1_checkerboard = new Lambertian(new Vector(1, 1, 1), lights)
	shader2_checkerboard = new Lambertian(new Vector(0, 0, 0), lights)
	
	sdf_checkerboard = YPlane(-Math.sqrt(3), new Checkerboard(shader1_checkerboard, shader2_checkerboard, 1));
	
	var cubes = union(sdf3, sdf4);
	
	var sdf = union(union(sdf_checkerboard, union(sdf1, sdf2)), cubes);
	
	scene = new Raymarcher(sdf, new Background(), 1000);
	
	show(film.triggerAntialiasingOff(camera, scene));
}

window.onload = main;