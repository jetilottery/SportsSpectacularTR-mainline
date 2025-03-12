define([
  './utils/tweenFunctions',
  './utils/tweenPath',
  'skbJet/component/gameMsgBus/GameMsgBus',
  'skbJet/component/gladPixiRenderer/gladPixiRenderer',
  'skbJet/component/gladPixiRenderer/KeyFrameAnimation',
  'skbJet/component/gladPixiRenderer/Sprite',
  'skbJet/component/SKBeInstant/SKBeInstant',
  'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
  'skbJet/componentCRDC/gladRenderer/Tween'
], function (TweenFunctions, TweenPath, msgBus, gr, KeyFrameAnimation, Sprite, SKBeInstant, audio, Tween) {
  'use strict';
  KeyFrameAnimation.prototype.updateStyleToTime = function (time) {
    if (time < 0 || time > this.maxTime) {
      console.warn('Time out of animation range.');
      return;
    }
    if (this._onUpdate) {
      if (this._onUpdate.hasOwnProperty('handler') && typeof this._onUpdate.handler === 'function') {
        this._onUpdate.handler.call(this._onUpdate.subscriberRef, { time: time, caller: this });
      }
      else {
        this._onUpdate(time);
      }
    } else {
      var frame = this.getFrameAtTime(time);
      if (!frame._SPRITES) {
        return;
      }
      for (var i = 0; i < this._spritesNameList.length; i++) {
        var sprite = this._gladObjLib[this._spritesNameList[i]];
        sprite.updateCurrentStyle(frame._SPRITES[i]._style);
      }
    }
  };
  class LightFlyAnimation {
    constructor(animationName, lightSpriteImg, lightSpriteContTag, lightSpriteTag, emotiFlyImg, angleMethod) {
      this.spriteAnimArray = Sprite.getSpriteSheetAnimationFrameArray(animationName);
      this.lightSpriteImg = lightSpriteImg;
      this.lightSpriteContTag = lightSpriteContTag;
      this.lightSpriteTag = lightSpriteTag;
      this.emotiFlyImg = emotiFlyImg;
      this.angleMethod = angleMethod;//complement or not
      this.whetherMoney = null;
      this.collectBursts = null;
      this.priceIconFx = null;
      this.priceBgFx = null;
      this.doorBonusSymbolSprite = null;
      this.amuletBonusSymbolSprite = null;
      this.doorBonusSymbolPopAnim = null;
      this.doorWinningPriceSprite = null;
      this.doorWinningPriceSprite1 = null;
      this.doorBonusSymbolWinValueAnim = null;
      this.amuletNum = null;
      this.needPublish = null;
      this.emotiImg = null;
      this.number = null;
    }
    moveTo(startObj, targetObj, time, sequence, emotiImg, number) {
      this.initSprites(startObj, targetObj, sequence, emotiImg, number);
      const startPoint = this.getCentrePoint(startObj);
      const targetPoint = this.getCentrePoint(targetObj);
      const pathAtoB = new TweenPath();
      pathAtoB.moveTo(startPoint.x, startPoint.y).lineTo(targetPoint.x, targetPoint.y);
      pathAtoB.closed = false;
      const distanceAtoB = parseInt(pathAtoB.totalDistance());
      const lengthOfLight = this.lightSprite.getCurrentStyle()._width;
      this.setLightSpritePosition(startPoint, targetPoint);
      // if (distanceAtoB > lengthOfLight) {
      //   let distanceCorrection = null;
      //   distanceCorrection = distanceAtoB;
      //   const newTargetPoint = pathAtoB.getPointAtDistance(distanceCorrection);
      //   this.kf_Amin.startPoint = startPoint;
      //   this.kf_Amin.targetPoint = { x: parseInt(newTargetPoint.x), y: parseInt(newTargetPoint.y) };
      // } else {
      //   this.kf_Amin.startPoint = null;
      //   this.kf_Amin.targetPoint = null;
      // }
      let distanceCorrection = null;
      distanceCorrection = distanceAtoB;
      const newTargetPoint = pathAtoB.getPointAtDistance(distanceCorrection);
      this.kf_Amin.startPoint = startPoint;
      this.kf_Amin.targetPoint = { x: parseInt(newTargetPoint.x), y: parseInt(newTargetPoint.y) };
      this.kf_Amin.maxTime = time;
      this.lightSprite.setImage(this.lightSpriteImg);
      this.lightSpriteCont.show(true);
      // this.lightSpriteCont.updateCurrentStyle({ '_opacity': 0 });
      // Tween.to(this.lightSpriteCont, { _opacity: 1 }, 10);
      audio.play('BaseSpinFlyToMeterIncrement', 3);
      this.kf_Amin.play();
      // if (option !== undefined) {
      //   this.whetherMoney = option.whetherMoney;
      //   if (option.amuletNum) {
      //     this.amuletNum = option.amuletNum;
      //   }
      //   if (option.needPublish) {
      //     this.needPublish = option.needPublish;
      //   } else {
      //     gr.getTimer().setTimeout(() => {
      //       this.kf_AminWillBeComplete();
      //     }, 150);
      //   }
      // }
    }

    initSprites(startObj, targetObj, sequence, emotiImg, number) {
      this.startObj = startObj;
      this.targetObj = targetObj;
      this.emotiImg = emotiImg;
      this.number = number;
      this.collectBursts = gr.lib['_priceCollectBursts_' + emotiImg];
      this.priceIconFx = gr.lib['_priceIconFx_' + emotiImg];
      this.priceBgFx = gr.lib['_priceBgFx_' + emotiImg];
      gr.lib[this.emotiFlyImg + sequence.num].setImage(emotiImg === "Bonus" ? 'King' : emotiImg);
      this.lightSpriteCont = gr.lib[this.lightSpriteContTag + sequence.num];
      this.lightSprite = gr.lib[this.lightSpriteTag + sequence.num];
      if (this.kf_Amin == null) {
        this.setupKeyFrameAnimations(sequence);
      }
    }

    setupKeyFrameAnimations(sequence) {
      const duration = 1000;
      const that = this;
      const timestamp = (new Date()).valueOf();
      if (sequence.num) {
        this.kf_Amin = new KeyFrameAnimation({
          "_name": 'kf_Amin' + sequence.num + '_' + timestamp,
          "_keyFrames": [
            { "_time": 0, "_SPRITES": [] },
            { "_time": duration, "_SPRITES": [] }
          ]
        });
      } else {
        this.kf_Amin = new KeyFrameAnimation({
          "_name": 'kf_Amin' + sequence.i + '_' + sequence.j + '_' + timestamp,
          "_keyFrames": [
            { "_time": 0, "_SPRITES": [] },
            { "_time": duration, "_SPRITES": [] }
          ]
        });
      }
      this.kf_Amin._onUpdate = function (timeDelta) {
        that.kf_AminOnUpdate(timeDelta);
      };
      this.kf_Amin._onComplete = function () {
        that.kf_AminOnComplete();
      };
    }

    kf_AminOnUpdate(timeDelta) {
      const duration = this.kf_Amin.maxTime;
      const frameName = this.getLightFrameIndexFromTime(timeDelta, duration);
      if (frameName !== this.lightSprite.getImage()) {
        this.lightSprite.setImage(frameName);
      }
      if (this.kf_Amin.startPoint && this.kf_Amin.targetPoint) {
        const newX = TweenFunctions.linear(timeDelta, this.kf_Amin.startPoint.x, this.kf_Amin.targetPoint.x, duration);
        const newY = TweenFunctions.linear(timeDelta, this.kf_Amin.startPoint.y, this.kf_Amin.targetPoint.y, duration);
        this.lightSpriteCont.updateCurrentStyle({ "_left": newX, "_top": newY });
      }
    }

    getLightFrameIndexFromTime(timeDelta, totalTime) {
      const time = (timeDelta < totalTime) ? timeDelta : totalTime;
      const frameNumIndex = parseInt(TweenFunctions.linear(time, 0, this.spriteAnimArray.length - 1, totalTime));
      return this.spriteAnimArray[frameNumIndex];
    }

    kf_AminOnComplete() {
      let colorMap = new Map([['Purple', 'Symbol1Increase'], ['Pink', 'Symbol2Increase'], ['Red', 'Symbol3Increase'], ['Yellow', 'Symbol4Increase']
        , ['Green', 'Symbol5Increase'], ['Blue', 'Symbol6Increase'], ['Bonus', 'SymbolBonusIncrease']]);
      let _that = this;
      msgBus.publish('gameScenceShake', 30);
      _that.lightSpriteCont.show(false);
      _that.collectBursts.show(true);
      _that.collectBursts.gotoAndPlay('Collect_bursts', 0.2, false);
      audio.play(colorMap.get(_that.emotiImg), 0);
      _that.collectBursts.onComplete = function () {
        this.show(false);
      };
      _that.priceIconFx.show(true);
      _that.priceIconFx.gotoAndPlay('emoti_' + _that.emotiImg, 0.2, false);
      _that.priceIconFx.onComplete = function () {
        _that.priceIconFx.show(false);
      };
      _that.priceBgFx.show(true);
      _that.priceBgFx.gotoAndPlay('collect_' + _that.emotiImg, 0.8, false);
      _that.priceBgFx.onComplete = function () {
        _that.priceBgFx.show(false);
      };
      msgBus.publish('leftCollectAnim', { 'img': this.emotiImg, 'time': this.number });
      // if (this.needPublish && this.amuletNum) {
      //   msgBus.publish('centerToRightOnComplete', { amuletNum: Number(this.amuletNum) + 4 });
      // }
      console.log(this.kf_Amin._name + " is completed!");
    }

    kf_AminWillBeComplete() {
      this.doorYellowBallSprite.show(true);
      gr.getTimer().setTimeout(() => {
        this.yellowBallAnimComplete();
      }, 400);
      msgBus.publish('gameScenceShake', 30);
      this.bonusDoorRuneSprite.show(false);
      this.doorYellowBallSprite.gotoAndPlay('runeBonusDoorEffect3', 0.5, false);
    }
    yellowBallAnimComplete() {
      this.doorYellowBallSprite.show(false);
      const that = this;
      this.doorBonusSymbolSprite.show(false);
      if (this.whetherMoney) {
        this.amuletBonusSymbolSprite.setImage('runeMeter');
        this.amuletBonusSymbolSprite.show(true);
        this.doorBonusSymbolPopAnim.play();
        this.doorBonusSymbolPopAnim._onComplete = function () {
          that.doorBonusSymbolPopAnim_OnComplete();
        };
      } else {
        this.doorWinningPriceSprite.show(true);
        this.doorWinningPriceSprite1.show(true);
        this.doorBonusSymbolWinValueAnim.play();
      }
    }

    doorBonusSymbolPopAnim_OnComplete() {
      if (SKBeInstant.getGameOrientation() === "landscape") {
        msgBus.publish('centerToRight', { startObj: this.targetObj, targetObj: gr.lib['_bonusAmuletSymbols_' + (this.amuletNum - 4)], num: (this.amuletNum - 4) });
      } else {
        msgBus.publish('centerToRightOnComplete', { amuletNum: this.amuletNum });
      }
    }

    getCentrePoint(sprite) {
      return { //center of the sprite
        x: sprite.toGlobal({ x: 0, y: 0 }).x + sprite.getCurrentStyle()._width * 0.5 * 0.5,
        y: sprite.toGlobal({ x: 0, y: 0 }).y + sprite.getCurrentStyle()._height * 0.5 * 0.5
      };
    }
    setLightSpritePosition(startPos, targetPos) {
      const degree = this.getDegreeFromTwoPoint(startPos, targetPos);
      this.lightSpriteCont.updateCurrentStyle({ "_left": startPos.x, "_top": startPos.y, "_transform": { "_rotate": degree } });
    }
    getDegreeFromTwoPoint(startPos, targetPos) {
      if (this.angleMethod === 'complement') {
        const angle = Math.atan2((targetPos.y - startPos.y), (startPos.x - targetPos.x));
        const theta = parseInt(angle * (180 / Math.PI));
        const degree = 90 - theta;
        return degree;
      } else {
        const y = startPos.y - targetPos.y;//abandon 
        const x = startPos.x - targetPos.x;
        const angle = Math.atan2(y, x);
        const theta = parseInt(angle * (180 / Math.PI));
        const degree = theta - 270;
        return degree;
      }
    }
  }
  return LightFlyAnimation;
});