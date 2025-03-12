/**
 * @module RotaryTable
 * @description
 */
define([
	'skbJet/component/gladPixiRenderer/gladPixiRenderer',
	'skbJet/component/gameMsgBus/GameMsgBus',
], function (gr,msgBus) {

	var cbs = {};
	function RotaryTable(options){
		if(!options || Object.prototype.toString.call(options) !== '[object Object]'){
			throw new Error("incoming parameters error");
		}
		try{
			if(!options.sprite){
				throw new Error();
			}
		}catch(e){
			throw new Error("need sprites");
		}
		let _this = this; 
		this.options = options;
		this.sprite = options.sprite;
		this.angleList = options.angleList;
		this.direction = options.direction;
		this.fuzzyLayer = options.fuzzyLayer;
		this.init(options);	
		RotaryTable.instance = this;
		gr.getTicker().add(function(){
			if(!_this.isPlaying){
				return;
			}
			_start(_this);
			//console.log(gr.getTicker().FPS);
		});
	}
	RotaryTable.prototype.isPlaying = false;
	RotaryTable.prototype.init = function (options){
		this.options = options;
		this.sprite = options.sprite;
		//this.highLightPointer = options.highLightSprite || null;
		this.baseSpeed = options.speed || 5;
		this.currentAngle = options.startAngle || 0;
		this.callback = options.callback || null;
		this.statusCode = {
			"unBegin": "1",
			"activity": "2",
			"isStoping": "3"
		};
		this.status = this.statusCode.unBegin; 
		this.beginStep = 0.4;
		this.stopStep = 0.2;
		this.isStoping = false;
	};

	RotaryTable.prototype.begin = function(){
		this.isPlaying = true;
		var statusCode = this.statusCode;
		if(statusCode.unBegin !== this.status){
			return;
		}
		this.status = statusCode.activity;
		this.speed = Math.floor(this.baseSpeed);
		this.stopId = "";
	};

	RotaryTable.prototype.stop = function (id, callback) {
		var statusCode = this.statusCode;
		if (statusCode.activity !== this.status) {
			return;
		}
		this.status = statusCode.isStoping;
		this.stopId = id;
		this.callback = callback;
	};
	
	RotaryTable.prototype.getStopAngle = function () {
		var speed = this.speed,
			n = 0,
			angle = 0,
			stopStep = this.stopStep;

		n = Math.ceil(speed / stopStep);
		angle = n * speed - n * (n - 1) * stopStep / 2 + 3600 - 1;

		return angle % 360;
	};

	function activity(This){
		var _this = This;

		if(_this.speed < _this.baseSpeed){
			_this.speed += _this.beginStep;
		}

		if(_this.speed > _this.baseSpeed){
			_this.speed = _this.baseSpeed;
		}

		_scroll(_this);
	}			
	

	function isStoping(This) {
		var _this = This;
		_this.fuzzyLayer.show(false);
		// 表示速度已经降低到最小单位以下，那么就设置为停止
		if (_this.speed < 0.1 * _this.stopStep) {
			_this.speed = - 0.1;
			// _this.sprite.pixiContainer.rotation = _this.direction * _this.currentAngle *Math.PI/180;
			_this.sprite.updateCurrentStyle({ "_transform": { "_rotate": _this.direction * _this.currentAngle } });
			_this.resetRotary();
			if(_this.callback){
				_this.callback();
			}
			return;
		}

		// 当前没有开始停止的话
		// 并且当前的角度，不适合停止的话，那么就再按照正在旋转执行
		if (!_this.isStoping && !_isBeginStop(_this)) {
			cbs[_this.statusCode.activity](_this);
			return;
		}

		_this.isStoping = true;

		// 开始停止
		if (_this.speed > 2 * _this.stopStep) {
			if (_justfiyStop(_this)) {
				_this.speed -= _this.stopStep;
			}
		} else {
			if (_canStop(_this)) {
				_this.speed -= _this.stopStep;
			}
		}

		_scroll(_this);
	}
	
	cbs["3"] = isStoping;
	cbs["2"] = activity;
	cbs['1'] = function () {};

	function _scroll(This){
		var _this = This;
		_this.currentAngle += _this.speed;
		if(_this.currentAngle >= 360){
			_this.currentAngle = _this.currentAngle % 360;
		}
		// _this.fuzzyLayer.show(true);
		// _this.sprite.pixiContainer.rotation = _this.direction * _this.currentAngle*Math.PI/180;
		_this.sprite.updateCurrentStyle({ "_transform": { "_rotate": _this.direction * _this.currentAngle } });
	}

	function _start(This){
		var _this = This;
		var status = _this.status,
			cb = cbs[status];
		
		if(typeof cb === "function"){
			cb(_this);
		}
	}

	RotaryTable.prototype.isStoped = function () {
		return this.status === this.statusCode.unBegin;
	};

	RotaryTable.prototype.resetRotary = function(){				
		this.isPlaying = false;
		this.status = this.statusCode.unBegin;
		this.isStoping = false;
		this.init(this.options);	
	};

	function _getStopAngle(gift) {
		var angle = gift.angleCenter ;
		return (angle + 360) % 360;
	}

	function _isBeginStop(This) {
		var _this = This;
		var gift = _this.angleList[_this.stopId],
		bwAngle = 0,
		lastAngle = 0,
		curBase = 0;

		lastAngle = _getStopAngle(gift);		

		bwAngle = _this.getStopAngle();
		
		curBase = lastAngle - bwAngle;

		if (curBase < 0) {
			curBase += 360;
		}

		if (Math.abs(curBase - _this.currentAngle) < _this.speed) {
			_this.lastAngle = lastAngle;
			return true;
		} else {
			_this.lastAngle = "";
			return false;
		}
	}			
	
	function _justfiyStop(This) {
		var _this = This;
		var bwAngle = _this.getStopAngle(),
		curBase = 0;

		curBase = _this.lastAngle - bwAngle;

		if (curBase < 0) {
			curBase += 360;
		}
		if (Math.abs(curBase - _this.currentAngle) < _this.speed) {
			return true;
		} else {
			return false;
		}
	}
	
	function _canStop(This) {
		var _this = This;
		var gift = _this.angleList[_this.stopId];

		if (gift) {
			return true;
		}
		return Math.abs(_this.lastAngle - _this.currentAngle) < 0.001;
	}

	return RotaryTable;
});