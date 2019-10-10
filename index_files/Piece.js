(function(window) {
	var WIDTH_P = 0.7, HEIGHT_P = 0.7, APPLY_FORCE = 0.4;

	var Piece = function(canvas, config)
	{
		this.initialize(canvas, config);
	}
	var p = Piece.prototype = new BasePiece();
	//
	p.initialize = function(canvas, config)
	{
		BasePiece.prototype.initialize.call(this, canvas, config);
		//this.initInteraction();
		this.refSize = 1000;
	}

	p.onKeyUp = function(e)
	{
		BasePiece.prototype.onKeyUp.call(this, e);
		if (!this.config.debug) return;
		var c = String.fromCharCode(e.which);
		if (c=="R") this.reset();
	}
		
	
	/*********************************
	 *		    INTERACTION
	 ********************************/
	
	p.initInteraction = function()
	{
		this.stage.addEventListener("stagemousedown", this.handleMouseDown.bind(this));
		this.stage.addEventListener("stagemousemove", this.handleMouseMove.bind(this));
		this.stage.addEventListener("stagemouseup", this.handleMouseUp.bind(this));
	}
	p.handleMouseDown = function(e)
	{
		if (this.pointerID) return;
		this.pointerID = e.pointerID;
		var x = e.stageX, y = e.stageY;
	}
	p.handleMouseMove = function(e)
	{
		if (e.pointerID!=this.pointerID) return;
		var x = e.stageX, y = e.stageY;
	}
	p.handleMouseUp = function(e)
	{
		if (e.pointerID!=this.pointerID) return;
		this.pointerID = null;
		var x = e.stageX, y = e.stageY;
	}
	

	 
	/*********************************
	 *			    FLOW
	 ********************************/
	
	p.setSize = function(w,h,dpr)
	{
		this.dpr = dpr;
		w = Math.floor(w*dpr);
		h = Math.floor(h*dpr);
		this.stage.x = w/2;
		this.stage.y = h/2;
		var s = this.stage.scaleX = this.stage.scaleY = Math.min(w,h)/this.refSize;
		w = this.width = w/s;
		h = this.height = h/s;
		var cfg = this.config;
		this.scale = cfg.scale * ArrayUtil.lookup(cfg.scaleByRatio, w/h, true);
		//log("setSize",w,h,this.r,this.scale, w/h);
		//
		if (this.tickLast) this.reset();
	}

	p.start = function()
	{
		BasePiece.prototype.start.apply(this);
		log("start",this.width, this.height, this.dpr);
		this.objs = [];
		this.onCollisionBound = this.onCollision.bind(this);
		//TEMP: not all objs have anchors yet..
		//this.config.objects = this.config.objects.filter(function(def){ return def.vertices!=null;});
		if (this.width) this.reset();
	}
	
	p.reset = function()
	{
		this.resetEscape();
		this.destroyPhysics();
		this.objs.length = 0;
		this.bodyCount = 0;
		this.stage.removeAllChildren();
		this.debugShape = this.stage.addChild(new Shape());
   		this.initPhysics();
		this.generate();
		this.scheduleEscape();
	}

	p.generate = function()
	{
		//pick random objects
		var w = this.width, h = this.height, w2 = w/2, h2 = h/2;
		var n = this.config.n;
		var r = MathUtil.getMaxSizeOfSquaresInRect(n,w,h), r2 = r/2;
		var ix = Math.floor(w/r), iy = Math.floor(h/r);
		var rx = w/ix, ry = h/iy;
		var ox = -ix/2*rx+rx/2, oy = -iy/2*ry+ry/2;
		var mx = (rx-r)/2, my = (ry-r)/2;
		var pool = [];
		for (var i=0;i<ix;i++)
		{
			for (var j=0;j<iy;j++) pool.push(new Point(i,j));
		}
		for (var i=0;i<n;i++)
		{
			var obj = this.addObject(), body = obj.body;
			var p = pool.splice(Math.floor(Math.random()*pool.length),1)[0];
			var x = ox + p.x*rx + RandomUtil.between(-mx,mx);
			var y = oy + p.y*ry + RandomUtil.between(-my,my);
			var v = Matter.Vector.create(x,y);
			Matter.Body.setPosition(body, v);
		}
   		var dt = 3* 1000/this.config.framerate;
		for (var i=0;i<20;i++)
		{
			this.updatePhysics(dt);
		}
		this.updateObjects();
	}
	
	p.update = function()
	{
    var dt = 1000/this.config.framerate;
		this.updatePhysics(dt);
		this.updateObjects();
		this.checkStopped(dt);
		// this.updateEscape(this.tickLast);
		return true;
	}	
	
	p.currentStoppedCounter = 0;

	p.checkStopped = function(dt)
	{
		var currentX = this.objs[0].x, 
			currentY = this.objs[0].y,
			MAX_INTERVAL = 60,
			MARGIN = 3;

		if (p.lastX === undefined) {
			p.lastX = currentX;
			p.lastY = currentY;
			return;
		}

		if (p.currentStoppedCounter === MAX_INTERVAL) {
			p.currentStoppedCounter = 0;
			p.applyForce(this.objs[0]);
			return;
		}
		//console.log(Math.abs(currentX - p.lastX))
		if (
			Math.abs(currentX - p.lastX) < MARGIN  ||
			Math.abs(currentY - p.lastY) < MARGIN
		) {
			p.currentStoppedCounter++;
		} else {
			p.currentStoppedCounter = 0;
		}

		p.lastX = currentX;
		p.lastY = currentY;
	}

	p.applyForce = function(b)
	{
		var FORCE = APPLY_FORCE;
		var r1 = Math.random();
		var r2 = Math.random();
	
		var v = { 
			x: (b.x > 0) ? -1 : (FORCE) + r1, 
			y: (b.y > 0) ? -FORCE - r2 : 1, 
			angle: Math.random()
		}

		Matter.Body.applyForce(b.body,
			{
				x: b.x, 
				y: b.y
			}, v);
	}

	p.randomColor = function()
	{
		return '#' + (function co(lor){   return (lor +=
			[0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)])
			&& (lor.length == 6) ?  lor : co(lor); })('');
	}
  
	p.updateObjects = function()
	{
		var os = this.objs;
		for (var i=0;i<os.length;i++)
		{
			var obj = os[i], body = obj.body;
			obj.x = body.position.x;
			obj.y = body.position.y;
			obj.rotation = body.angle * R2D;
		}
	}
	


	//***************** ESCAPE/ENTRY 


	p.updateEscape = function(now)
	{
		switch(this.escapePhase)
		{
			case 0://scheduled
				if (this.nextEscape>0 && this.nextEscape<now) this.doEscape();
				break;
			case 1://escaping
				this.checkEscaped();
				break;
			case 2://entry scheduled
				if (this.nextEntry>0 && this.nextEntry<now) this.doEntry();
				break;
			case 3://entering
				this.checkEntered();
				break;
		}
	}
	p.resetEscape = function()
	{
		this.escapePhase = -1;
		this.escapeObj = this.entryObj = null;
		this.nextEscape = this.nextEntry = -1;
		this.entryCheckingOutside = false;
	}
	p.scheduleEscape = function()
	{
		this.escapePhase = 0;
		this.nextEscape = this.tickLast + RandomUtil.between.apply(null, this.config.escapeInterval);
		log("nextEscape: "+this.nextEscape, this.tickLast);
	}
	p.doEscape = function()
	{
		this.escapePhase = 1;
		this.nextEscape = -1;
		//pick random object to let escape
		var obj = RandomUtil.pick(this.objs);
		log("escape: "+obj.name);
		obj.body.collisionFilter.mask = 2;//only collide with objects
		this.escapeObj = obj;
	}
	p.checkEscaped = function()
	{
    var w = this.width, h = this.height, w2 = w/2, h2 = h/2;
		var obj = this.escapeObj, body = obj.body;
		//if obj is out of viewport, schedule entry of new object
		if (this.checkCompletelyInOrOut(obj.body, true))
		{
			log("checkEscaped, true: "+obj.name);
			this.destroyObject(obj);
			this.scheduleEntry();
		}
	}
	p.scheduleEntry = function(minmax)
	{
		this.escapePhase = 2;
		this.nextEntry = this.tickLast + RandomUtil.between.apply(null, minmax || this.config.entryInterval);
		log("nextEntry: "+this.nextEntry, this.tickLast);
	}
	p.doEntry = function()
	{
		this.escapePhase = 3;
		this.entryCheckingOutside = false;
		//create object and place just outside of bounds moving in
		var obj = this.entryObj = this.addObject(this.escapeObj);
		var body = obj.body;
		//only collide with other objects while not inside
		obj.body.collisionFilter.mask = 2;
		//
		var r2 = (this.config.baseSize*this.scale)/2*1.2, w = this.width, h = this.height, w2 = w/2, h2 = h/2;
		var x, y;
		var ver = Math.random()< w/(w+h);//weighted based on w and h
		var side = Math.random()<.5;
		if (ver)
		{
			x = RandomUtil.between(-w2+r2,w2-r2);
			y = side ? -h2-r2 : h2+r2;
		}
		else
		{
			y = RandomUtil.between(-h2+r2,h2-r2);
			x = side ? -w2-r2 : w2+r2;
		}
		obj.x = x;
		obj.y = y;
		Matter.Body.setPosition(body,Matter.Vector.create(x,y));
		//aim inwards (at center of vp to be sure)
		var a = Math.atan2(-y,-x), speed = body.speed;
		Matter.Body.setVelocity(body, Matter.Vector.create(Math.cos(a)*speed,Math.sin(a)*speed), Matter.Vector.create(0,0));
		log("doEntry: "+obj.name, x,y, a*R2D);
	}
	p.checkEntered = function()
	{
		var obj = this.entryObj, body = obj.body;
		//if obj is in viewport, schedule next escape
		if (this.checkCompletelyInOrOut(obj.body, false))
		{
			log("checkEntered, inside: "+obj.name);			
			obj.body.collisionFilter.mask = 3;
			this.entryObj = null;
			this.scheduleEscape();
		}
		//Check if obj is moving towards viewport. If not, start new entry
		if (this.entryCheckingOutside)
		{
			//condition is true only after a collision with another object, so entry obj has been partially inside.
			if (this.checkCompletelyInOrOut(obj.body, true))
			{
				log("checkEntered, outside!: "+obj.name);		
				this.entryObj = null;
				this.destroyObject(obj);
				this.scheduleEntry(this.config.secondaryEntryInterval);
			}
		}
	}
	p.checkEntryObjectCollision = function(body)
	{
		if (this.entryObj && this.entryObj.body == body)
		{
			this.entryCheckingOutside = true;
		}
	}


	//************************ PHYSICS VARIOUS

	p.onCollision = function(event)
	{
		var bodies = {};
		var pairs = event.pairs;
		for (var i = 0; i < pairs.length; i++) 
		{
			var pair = pairs[i];
			checkCollisionBodyForNormalization(pair.bodyA, bodies); 
			checkCollisionBodyForNormalization(pair.bodyB, bodies);
		}
		for (var name in bodies) 
		{
			this.checkEntryObjectCollision(bodies[name]);
			this.normalizeSpeed(bodies[name]);
		}
	}
	var checkCollisionBodyForNormalization = function(body, marked)
	{
		if (body.isStatic) return;
		if (body.parent) body = body.parent;
		marked[body.name] = body;
	}

	p.normalizeSpeed = function(body)
	{
		// console.log("collisionEnd", body.speed);
		var f = body.speedNormal/body.speed;
		var vv = body.velocity;				
		Matter.Body.setVelocity(body, Matter.Vector.create(vv.x*f,vv.y*f));	
		var max = this.config.angularSpeedMax;
		if (body.angularSpeed>max)
		{
			Matter.Body.setAngularVelocity(body, max * (body.angularVelocity>0?1:-1));	
		}
		//log(body.name, body.speed, body.speedNormal, body.angularSpeed, body);
	}

	p.checkCompletelyInOrOut = function(body, out)
	{
		var b = body.bounds;
		var f = out ? 1 : -1, m = 2, w2 = this.width/2 + f*m, h2 = this.height/2 + f*m;
		if (out)
		{
			return b.min.x>w2 || b.max.x<-w2 || b.min.y>h2 || b.max.y<-h2;
		}
		else
		{
			return b.min.x>-w2 && b.max.x<w2 && b.min.y>-h2 && b.max.y<h2;
		}
	}
	
	
	// ****************** CREATE / DESTROY

	p.pickRandomDef = function(except)
	{
		return this.pickRandom(this.config.objects, "def", except);
	}
	p.pickRandomColor = function(except)
	{
		return this.pickRandom(this.config.colors, "color", except);
	}
	p.pickRandom = function(pool, prop, except)
	{
		except = except || [];		
		if (this.objs.length<pool.length) 
		{
			for (var i=0;i<this.objs.length;i++) except.push(this.objs[i][prop]);
		}
		//log(prop,except);
		return RandomUtil.pick(pool, except);
	}
	
	p.destroyObject = function(obj)
	{
		Matter.World.remove(this.world, obj.body);
		var idx = this.objs.indexOf(obj);
		if (idx>-1) this.objs.splice(idx,1);
		if (obj.parent) obj.parent.removeChild(obj);
	}

	p.addObject = function(exceptDef)
	{
		var cfg = this.config;
		var def = this.pickRandomDef([exceptDef]);
		var color = this.pickRandomColor();
		var obj = this.createObject(def, color);
		this.stage.addChild(obj);
		this.objs.push(obj);
		obj.scaleX = obj.scaleY = this.scale;
		//
		var body = obj.body;
		body.collisionFilter.category = 2;
		body.collisionFilter.mask = 3;
		Matter.World.add(this.world, body);
		Matter.Body.scale(body, this.scale, this.scale);
		var speed = RandomUtil.between.apply(null, cfg.speed), a  = Math.random()*Math.PI*2;
		Matter.Body.setVelocity(body, Matter.Vector.create(Math.cos(a)*speed,Math.sin(a)*speed), Matter.Vector.create(0,0));
		var angularVelocity = RandomUtil.between.apply(null, cfg.angularSpeedInitial) * (Math.floor(Math.random())*2-1);
		Matter.Body.setAngularVelocity(body, angularVelocity)
		body.speedNormal = speed;
		// Matter.Body.setAngle(body, Math.random()*Math.PI*2);
		return obj;
	}
	p.createObject = function(def, color)
	{
		var W = window.innerWidth * WIDTH_P, H = window.innerHeight * HEIGHT_P;
		var obj = new Container();
		obj.def = def;
		obj.name = def.name + (this.bodyCount++);
		var ps = def.parts;
		var c = obj.color = color;
		for (var i=0;i<ps.length;i++)
		{
			var part = ps[i];
			var rect = new Shape()
			rect.graphics.beginFill(p.randomColor());
			rect.graphics.drawRect(-W/2, -H/2, W, H);
			rect.graphics.endFill();
			var shape = obj.addChild(rect);
			
			shape.x = 0;
			shape.y = 0;
			var g = shape.graphics;
			var path = part.path;			
		}
		var xys = [
			-W/2, -H/2,
			-W/2,  H/2,
			 W/2,  H/2,
			 W/2, -H/2,
			
		];
		obj.body = this.createPhysicsBody(xys, obj.name);
		//debug drawing:
		if (false)
		{
			var vs = obj.body.vertices;
			var debugShape = obj.addChild(new Shape());
			var g = debugShape.graphics;				
			g.s("red").drawX(0,0,6);
			if (0)
			{
				g.s("blue");
				for (var i=0;i<xys.length;i+=2) g.drawX(xys[i],xys[i+1],6);
			}
			g.s("yellow").ss(2);
			for (var j=0;j<obj.body.parts.length;j++)
			{
				vs = obj.body.parts[j].vertices;
				for (var i=0;i<vs.length;i++) g.drawX(vs[i].x,vs[i].y,6);
			}
		}
		return obj;
	}
	
	p.createPhysicsBody = function(xys, name)
	{
		var vs = [], n = xys.length/2;
		for (var i=0;i<n*2;i+=2)
		{
			vs.push(Matter.Vector.create(xys[i],xys[i+1]));
		}
		//Matter.Bodies.fromVertices(x, y, [[vector]], [options], [flagInternal=false], [removeCollinear=0.01], [minimumArea=10])
		var body = Matter.Bodies.fromVertices(0,0, vs, {friction:0,frictionStatic:0,frictionAir:0,restitution:1}, true);
		body.name = name;
		//Decomposition in parts results in parts that are offset for some reason. 
		//	Fix this offset by offsetting back:
		var cx = (body.bounds.min.x+body.bounds.max.x)/2;
		var cy = (body.bounds.min.y+body.bounds.max.y)/2;
		for (var j=0;j<body.parts.length;j++)
		{
			vs = body.parts[j].vertices;
			for (var i=0;i<vs.length;i++) 
			{
				vs[i].x -= cx;
				vs[i].y -= cy;
			}
		}
		return body;
	}


	//*********************** PHYSICS LIFECYCLE

	
	p.updatePhysics = function(dt)
	{
		Matter.Engine.update(this.engine, dt);
	}
	
	p.initPhysics = function()
	{    
    this.engine = Matter.Engine.create();
    var world = this.world = this.engine.world;
    //
    var cfg = this.config;
    var w = this.width, h = this.height, w2 = w/2, h2 = h/2;
		//
		world.gravity.y = 0;
    //add walls
		this.walls = [];
		var g = this.debugShape ? this.debugShape.graphics.c().f("blue") : null;
		var m = 0, r = 200, r2 = r/2;
    var w = this.width + 2*m, h = this.height+2*m, w2 = w/2, h2 = h/2;
		this.createWall(-w2-r2,0, r, h, g);//L
		this.createWall(w2+r2,0, r,h ,g);//R
		this.createWall(0,-h2-r2, w, r, g);//T
		this.createWall(0,h2+r2, w, r, g);//B
		//
		Matter.Events.on(this.engine, 'collisionEnd', this.onCollisionBound);
  }
	p.destroyPhysics = function()
	{
		if (!this.world) return;
		Matter.World.clear(this.world,false);
		Matter.Events.off(this.engine, 'collisionEnd', this.onCollisionBound);
		Matter.Engine.clear(this.engine);
		this.engine = null;
	}
  p.createWall = function(x,y,w,h, g)
  {
		var body = Matter.Bodies.rectangle(x,y,w,h, { isStatic: true, restitution: 1 });
		body.collisionFilter.category = 1;
		body.collisionFilter.mask = 3;
		Matter.World.add(this.world, body);
		this.walls.push(body);
		//
		if (g)
		{
			var b = body.bounds, b0 = b.min, b1 = b.max;
			g.r(b0.x,b0.y,b1.x-b0.x,b1.y-b0.y);
		}
		//
		return body;
  }
	
	var R2D = 180/Math.PI;
	
	window.Piece = Piece;
	

}(window));

