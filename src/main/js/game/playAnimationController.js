/**
 * @module game/playAnimationController
 * @description 
 */
define([
  'skbJet/component/gameMsgBus/GameMsgBus',
  'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
  'skbJet/component/gladPixiRenderer/gladPixiRenderer',
  'skbJet/component/pixiResourceLoader/pixiResourceLoader',
  'skbJet/component/SKBeInstant/SKBeInstant',
  'game/utils/gladButton',
  './lightFlyAnimation',
  './RotaryTable',
  './configController',
  'skbJet/component/resourceLoader/resourceLib',
  './gameUtils',
  'skbJet/componentCRDC/gladRenderer/Tween'
], function (msgBus, audio, gr, loader, SKBeInstant, gladButton, LightFlyAnimation, RotaryTable, config, resLib, gameUtils, Tween) {
  var prizeTable = {}, jackpot = 0; //To record ticket prize table
  var tutorialIsShown = false;
  var revealAll = false;
  const baseLightAnimations = [];
  var winValue = 0;
  var BaseGameArray = [];
  var iwGameArray = [];
  var iwMoney = 0;
  var outLocation = [],middleLocation = [],innerLocation = [],wheelStopped = [],features = [];
  var gameError = false,isAutoSpin = false,isExpander = false,isBonus = false,isSecond = false;
  var spinLeftText = 6,countDown = 6;
  var spinButton = null,spinIndex = 0,winEmotiNum = 3,angle = 0,splitArray = null,autoSpinButton = null,stopButton = null,spinCounter = 0;
  var outWheelRotation = null,middleWheelRotation = null,innerWheelRotation = null;
  let wheelFlashAnim = null,spinBoxAnim = null,RotateLight = null,collect3Anim = null;
  let spineStyle = null,instantWinTime = 0;
  let AutoSpinIntervalBase,onePrice = false;
  let outWheelAngleList = null,middleWheelAngleList = null,innerWheelAngleList = null;
  let freeSpinAnim = null,expandAnim = null,baseBgAnim = null,logoAnim = null,bonusAnim = null,baseTransitionAnim = null;
  let emotiSequence = [
    'Red', 'Blue', 'Purple', 'Purple', 'Pink', 'Bonus', 'Purple', 'Green', 'Green', 'Red', 'Blue', 'Pink', 'Yellow', 'Yellow',
    'Green', 'Bonus', 'Purple', 'Pink', 'Pink', 'Yellow', 'Red', 'Pink', 'Red', 'Red', 'Yellow', 'Bonus', 'Green', 'Blue', 'Blue', 'Purple'
  ];
  let multipleSequence = ['Icon3x', 'Icon2x', 'Icon3x', 'Icon1x', 'Icon3x', 'Icon2x', 'Icon3x', 'Icon1x', 'Icon3x', 'Icon2x'];
  let leftEmotiAnim = [];
  let wheelEmotiAnim = [];
  let flyEmotiAnim = [], KingCopyAnim = null;
  let wheelEmotiAnimTimer = null;
  let instantWinButton = [];
  let collectAnim = [], collectTime = 0;
  let innerProp = [0, 1, 0, 2, 0, 3, 0, 1, 0, 2];  //0 -> nowin 1 ->the Extra Turn Feature 2 -> the Expander Feature  3-> the Instant Win Feature
  let winEmotiMapData = null, multiple = null;
  let arrowAnims = [], kingAnim = null;
  let leftEmotiSequence = new Map([
    ['Bonus', { 'index': 0, 'time': 0, 'maxTime': 5 }],
    ['Purple', { 'index': 1, 'time': 0, 'maxTime': 13 }],
    ['Pink', { 'index': 2, 'time': 0, 'maxTime': 12 }],
    ['Red', { 'index': 3, 'time': 0, 'maxTime': 11 }],
    ['Yellow', { 'index': 4, 'time': 0, 'maxTime': 10 }],
    ['Green', { 'index': 5, 'time': 0, 'maxTime': 9 }],
    ['Blue', { 'index': 6, 'time': 0, 'maxTime': 8 }],
  ]);
  let EmotiMoneySequence = new Map([
    ['Purple', "A"],
    ['Pink', "B"],
    ['Red', "C"],
    ['Yellow', "D"],
    ['Green', "E"],
    ['Blue', "F"],
  ]);

  function onGameParametersUpdated() {
    spineStyle = config.spineStyle;
    cloneGladAnim();
    setAutoFontFitText();
    fillWords();
    initialAnim();
    initialBaseGame();
    initialAngle();
    initialRotary();
    initiaWheel();
    wheelEmotiAnimTimer = gr.getTimer().setInterval(function () {
      randomEmoti();
    }, 2000);
    var scaleType = {
      'scaleXWhenClick': 0.92,
      'scaleYWhenClick': 0.92,
      'avoidMultiTouch': true
    };
    spinButton = new gladButton(gr.lib._spinButton, "BuyButton", scaleType);
    autoSpinButton = new gladButton(gr.lib._autospinButton, "AutospinButton", scaleType);
    stopButton = new gladButton(gr.lib._stopButton_0, "AutospinButton", scaleType);
    spinButton.show(false);
    if (SKBeInstant.config.customBehavior) {
      AutoSpinIntervalBase = Number(SKBeInstant.config.customBehavior.AutoSpinIntervalBase) || 100;
    } else if (loader.i18n.gameConfig) {
      AutoSpinIntervalBase = Number(loader.i18n.gameConfig.AutoSpinIntervalBase) || 100;
    } else {
      AutoSpinIntervalBase = 100;
    }
    spinButton.enable(false);
    autoSpinButton.enable(false);
    gr.lib._spinText.updateCurrentStyle({ '_opacity': '0.3' });
    gr.lib._autospinText.updateCurrentStyle({ '_opacity': '0.3' });
    spinButton.click(spin);
    autoSpinButton.click(autoSpin);
    stopButton.click(stopAutoSpin);
  }

  function resetAll() {
    let leftEmoti = [...leftEmotiSequence.keys()];
    let gridArr = ['meter_purple_grid1', 'meter_pink_grid1', 'meter_red_grid1', 'meter_yellow_grid1', 'meter_green_grid1', 'meter_blue_grid1'];
    for (var i = 0; i < 5; i++) {
      gr.lib['_0_collectGrid_' + i].show(true);
      gr.lib['_0_collectGrid_' + i].setImage('meter_bonus_grid1');
    }
    for (let index = 1; index < 7; index++) {
      for (let i = 0; i < (14 - index); i++) {
        gr.lib['_' + index + '_collectGrid_' + i].setImage(gridArr[(index - 1)]);
      }
    }
    gr.lib._priceBgFx_Bonus_Win.show(false);
    gr.lib._priceIconFx_Bonus_Win.show(false);
    for (let index = 0; index < leftEmoti.length; index++) {
      gr.lib['_priceCollectBursts_' + leftEmoti[index]].show(false);
      gr.lib['_priceIconFx_' + leftEmoti[index]].show(false);
      gr.lib['_priceBgFx_' + leftEmoti[index]].show(false);
    }
    //console.log("Geordi: resetAll called!");
    spinLeftText = 6;
    gr.lib._spinLeft_text.setText(spinLeftText);
    gr.lib._symbolInstant_Top1.show(true);
    gr.lib._symbolInstant_Top2.show(true);
    gr.lib._symbolInstant_Top0.show(true);
    leftEmotiSequence = new Map([
      ['Bonus', { 'index': 0, 'time': 0, 'maxTime': 5 }],
      ['Purple', { 'index': 1, 'time': 0, 'maxTime': 13 }],
      ['Pink', { 'index': 2, 'time': 0, 'maxTime': 12 }],
      ['Red', { 'index': 3, 'time': 0, 'maxTime': 11 }],
      ['Yellow', { 'index': 4, 'time': 0, 'maxTime': 10 }],
      ['Green', { 'index': 5, 'time': 0, 'maxTime': 9 }],
      ['Blue', { 'index': 6, 'time': 0, 'maxTime': 8 }],
    ]);
    gr.lib['_priceTableLevel_0_bonus'].pixiContainer.children[0].visible = true;

    gr.lib._0_collectWin.show(false);
    //gameUtils.stopSpine(bonusAnim);
    gameUtils.playSpine(bonusAnim, "bonus_Static", false);
    prizeTable = {};
    jackpot = 0;
    iwGameArray = [];
    iwMoney = 0;
  }

  function cloneGladAnim() {
    for (var i = 0; i < 5; i++) {
      gr.animMap._highlight_Lv0_0Anim.clone(['_highlight_Lv0_' + i], '_highlight_Lv0_' + i + 'Anim');
    }
    for (let index = 1; index < 7; index++) {
      for (let i = 0; i < (14 - index); i++) {
        gr.animMap._highlight_Lv1_0Anim.clone(['_highlight_Lv' + index + '_' + i], '_highlight_Lv' + index + '_' + i + 'Anim');
        gr.lib['_highlight_Lv' + index + '_' + i].show(false);
      }
    }
  }

  function initialAngle() {
    outWheelAngleList = [{
      "id": 0,
      "angleCenter": 0,
    }, {
      "id": 1,
      "angleCenter": 348,
    }, {
      "id": 2,
      "angleCenter": 336,
    }, {
      "id": 3,
      "angleCenter": 324,
    }, {
      "id": 4,
      "angleCenter": 312,
    }, {
      "id": 5,
      "angleCenter": 300,
    }, {
      "id": 6,
      "angleCenter": 288,
    }, {
      "id": 7,
      "angleCenter": 276,
    }, {
      "id": 8,
      "angleCenter": 264,
    }, {
      "id": 9,
      "angleCenter": 252,
    }, {
      "id": 10,
      "angleCenter": 240,
    }, {
      "id": 11,
      "angleCenter": 228,
    }, {
      "id": 12,
      "angleCenter": 216,
    }, {
      "id": 13,
      "angleCenter": 204,
    }, {
      "id": 14,
      "angleCenter": 192,
    }, {
      "id": 15,
      "angleCenter": 180,
    }, {
      "id": 16,
      "angleCenter": 168,
    }, {
      "id": 17,
      "angleCenter": 156,
    }, {
      "id": 18,
      "angleCenter": 144,
    }, {
      "id": 19,
      "angleCenter": 132,
    }, {
      "id": 20,
      "angleCenter": 120,
    }, {
      "id": 21,
      "angleCenter": 108,
    }, {
      "id": 22,
      "angleCenter": 96,
    }, {
      "id": 23,
      "angleCenter": 84,
    }, {
      "id": 24,
      "angleCenter": 72,
    }, {
      "id": 25,
      "angleCenter": 60,
    }, {
      "id": 26,
      "angleCenter": 48,
    }, {
      "id": 27,
      "angleCenter": 36,
    }, {
      "id": 28,
      "angleCenter": 24,
    }, {
      "id": 29,
      "angleCenter": 12,
    }
    ];
    middleWheelAngleList = [{
      "id": 0,
      "angleCenter": 0,
    }, {
      "id": 1,
      "angleCenter": 36
    }, {
      "id": 2,
      "angleCenter": 72
    }, {
      "id": 3,
      "angleCenter": 108
    }, {
      "id": 4,
      "angleCenter": 144
    }, {
      "id": 5,
      "angleCenter": 180
    }, {
      "id": 6,
      "angleCenter": 216
    }, {
      "id": 7,
      "angleCenter": 252
    }, {
      "id": 8,
      "angleCenter": 288
    }, {
      "id": 9,
      "angleCenter": 324
    }];
    innerWheelAngleList = [{
      "id": 0,
      "angleCenter": 0,
    }, {
      "id": 1,
      "angleCenter": 324,
    }, {
      "id": 2,
      "angleCenter": 288,
    }, {
      "id": 3,
      "angleCenter": 252,
    }, {
      "id": 4,
      "angleCenter": 216,
    }, {
      "id": 5,
      "angleCenter": 180,
    }, {
      "id": 6,
      "angleCenter": 144,
    }, {
      "id": 7,
      "angleCenter": 108,
    }, {
      "id": 8,
      "angleCenter": 72,
    }, {
      "id": 9,
      "angleCenter": 36,
    }];
  }

  function hitAreaButton(button, num) {
    button.pixiContainer.hitArea = new PIXI.Circle(button._currentStyle._width / 2,
      button._currentStyle._height / 2, (button._currentStyle._height * num));
  }

  function initialAnim() {
    wheelFlashAnim = new PIXI.spine.Spine(resLib.spine.EmotiCollect_ui.spineData);
    // wheelFlashAnim.state.setAnimation(0, "wheel_Lights_loop", true);
    gameUtils.setSpineStyle(wheelFlashAnim, spineStyle['wheelFlashAnim'], 'wheelFlashAnim');
    gr.lib._wheelOut.pixiContainer.addChild(wheelFlashAnim);
    gameUtils.playSpine(wheelFlashAnim, "wheel_Lights_loop", true);
    spinBoxAnim = new PIXI.spine.Spine(resLib.spine.EmotiCollect_ui.spineData);
    gameUtils.setSpineStyle(spinBoxAnim, spineStyle['spinBoxAnim_base'], 'spinBoxAnim');
    gr.lib._spinLeft.pixiContainer.addChildAt(spinBoxAnim, 1);
    spinBoxAnim.scale.x = 0.8;
    spinBoxAnim.scale.y = 0.8;
    gameUtils.playSpine(spinBoxAnim, "spin_Left_static", false);

    RotateLight = new PIXI.spine.Spine(resLib.spine.EmotiCollect_ui.spineData);
    gameUtils.setSpineStyle(RotateLight, spineStyle['RotateLight'], 'RotateLight');
    gr.lib._wheelOut.pixiContainer.addChild(RotateLight);

    for (let i = 0; i < 30; i++) {
      wheelEmotiAnim[i] = new PIXI.spine.Spine(resLib.spine.emoti.spineData);
      gameUtils.setSpineStyle(wheelEmotiAnim[i], spineStyle['wheelEmotiAnim'], 'wheelEmotiAnim_' + i);
      gr.lib['_emoti_' + emotiSequence[i] + '_' + (i + 1)].pixiContainer.addChild(wheelEmotiAnim[i]);
    }

    collect3Anim = new PIXI.spine.Spine(resLib.spine.skeleton.spineData);
    gameUtils.setSpineStyle(collect3Anim, spineStyle['collect3Anim'], 'collect3Anim');
    gr.lib._winBox.pixiContainer.addChild(collect3Anim);

    for (let i = 0; i < 5; i++) {
      flyEmotiAnim[i] = new PIXI.spine.Spine(resLib.spine.EmotiCollect_ui.spineData);
      gameUtils.setSpineStyle(flyEmotiAnim[i], spineStyle['flyEmotiAnim'], 'flyEmotiAnim_' + i);
      gr.lib['_flyBg_' + i].pixiContainer.addChild(flyEmotiAnim[i]);

      collectAnim[i] = new PIXI.spine.Spine(resLib.spine.emoti.spineData);
      gameUtils.setSpineStyle(collectAnim[i], spineStyle['collectAnim'], 'collectAnim_' + i);
      gr.lib['_emoti_collect_' + (i + 1)].pixiContainer.addChild(collectAnim[i]);

      arrowAnims[i] = new PIXI.spine.Spine(resLib.spine.skeleton.spineData);
      arrowAnims[i].state.setAnimation(0, 'arrow_usual_idle', true);
      gameUtils.setSpineStyle(arrowAnims[i], spineStyle['arrowAnims'], 'arrowAnims_' + i);
      gr.lib['_arrowUsual_' + i].pixiContainer.addChild(arrowAnims[i]);
    }
    freeSpinAnim = new PIXI.spine.Spine(resLib.spine.skeleton.spineData);

    gameUtils.setSpineStyle(freeSpinAnim, spineStyle['freeSpinAnim'], 'freeSpinAnim');
    gr.lib['_symbolFrees_Top'].pixiContainer.addChild(freeSpinAnim);
    expandAnim = new PIXI.spine.Spine(resLib.spine.skeleton.spineData);
    gameUtils.setSpineStyle(expandAnim, spineStyle['expandAnim'], 'expandAnim');
    gr.lib['_symbolExpand_Top'].pixiContainer.addChild(expandAnim);

    for (let index = 0; index < 7; index++) {
      leftEmotiAnim[index] = new PIXI.spine.Spine(resLib.spine.emoti.spineData);
      gameUtils.setSpineStyle(leftEmotiAnim[index], spineStyle['leftEmotiAnim'], 'leftEmotiAnim_' + index);
      gr.lib['_priceTableLevel_' + [...leftEmotiSequence.keys()][index] + '_icon'].pixiContainer.addChild(leftEmotiAnim[index]);
    }

    KingCopyAnim = new PIXI.spine.Spine(resLib.spine.emoti.spineData);
    gameUtils.setSpineStyle(KingCopyAnim, spineStyle['KingCopyAnim'], 'KingCopyAnim');
    gr.lib['_King_copy'].pixiContainer.addChild(KingCopyAnim);
    gr.lib['_King_copy'].pixiContainer.children[0].visible = false;
    baseBgAnim = new PIXI.spine.Spine(resLib.spine.light.spineData);
    gameUtils.setSpineStyle(baseBgAnim, spineStyle['baseBgAnim'], 'baseBgAnim');
    gr.lib['_baseBgAnim'].pixiContainer.addChild(baseBgAnim);
    gameUtils.playSpine(baseBgAnim, "idle", true);

    logoAnim = new PIXI.spine.Spine(resLib.spine.LOGO_shootlight_split.spineData);
    logoAnim.state.setAnimation(0, 'idle', true);
    gameUtils.setSpineStyle(logoAnim, spineStyle['logoAnim'], 'logoAnim');
    gr.lib['_baseLogo'].pixiContainer.addChild(logoAnim);
    gr.lib['_baseLogo'].pixiContainer.children[0].visible = false;


    bonusAnim = new PIXI.spine.Spine(resLib.spine.bonus.spineData);
    gameUtils.setSpineStyle(bonusAnim, spineStyle['bonusAnim'], 'bonusAnim');
    gr.lib['_priceTableLevel_0_bonus'].pixiContainer.addChild(bonusAnim);
    gameUtils.playSpine(bonusAnim, "bonus_Static", false);
    baseTransitionAnim = new PIXI.spine.Spine(resLib.spine.transitions.spineData);
    gameUtils.setSpineStyle(baseTransitionAnim, spineStyle['baseTransitionAnim'], 'baseTransitionAnim');
    gr.lib['_baseTransitions'].pixiContainer.addChild(baseTransitionAnim);
  }
  function randomEmoti() {
    if(isCanvasRender() === false){
      for (let i = 0; i < 30; i++) {
        gameUtils.stopSpine(wheelEmotiAnim[i]);
      }
      gr.lib._emotis.pixiContainer.children.forEach(function (item, index) {
        if (index > 0) {
          item.children[0].visible = true;
        }
      });
      let firstRandom = Math.floor(Math.random() * 30);
      let secondRandom = (firstRandom + 15) % 29;
      let typeRandom = Math.floor(Math.random() * 2) + 1;
      gameUtils.playSpine(wheelEmotiAnim[firstRandom], emotiSequence[firstRandom].toLowerCase() + '_Emoti_0' + typeRandom, true);
      gameUtils.playSpine(wheelEmotiAnim[secondRandom], emotiSequence[secondRandom].toLowerCase() + '_Emoti_0' + typeRandom, true);
    }
  }
  function stopRandomEmoti() {
    if (wheelEmotiAnimTimer) {
      gr.getTimer().clearInterval(wheelEmotiAnimTimer);
    }
    for (let i = 0; i < 30; i++) {
      gameUtils.stopSpine(wheelEmotiAnim[i]);
      gr.lib._emotis.pixiContainer.children.forEach(function (item, index) {
        if (index > 0) {
          item.children[0].visible = true;
        }
      });
    }
  }

  function isCanvasRender(){
    let rt = false;
    if (window.navigator.userAgent.indexOf('SM-G960') > -1 || window.navigator.userAgent.indexOf('SM-G965') > -1 || window.navigator.userAgent.indexOf('SM-N960') > -1 || window.navigator.userAgent.indexOf('SM-G770') > -1 || window.navigator.userAgent.indexOf('SM-T860') > -1) {
      rt = true;
    }
    return rt;
  }

  function initialRotary() {
    outWheelRotation = new RotaryTable({
      sprite: gr.lib._emotis,
      angleList: outWheelAngleList,
      direction: 1,
      fuzzyLayer: gr.lib._symbolBlur_out,
      needMusic: true,
      callback: () => {
        switchArrowColor(3);
        gr.getTimer().setTimeout(function () {
          outAndMiddleCollectionAnim();
          onWheelStopped("outerWheel");
        }, 50);
      },
    });
    middleWheelRotation = new RotaryTable({
      sprite: gr.lib._wheelMiddle,
      angleList: middleWheelAngleList,
      direction: -1,
      fuzzyLayer: gr.lib._symbolBlur_middle,
      needMusic: true,
      callback: () => {
        onWheelStopped("midWheel");
      },
    });
    innerWheelRotation = new RotaryTable({
      sprite: gr.lib._wheelInner,
      angleList: innerWheelAngleList,
      direction: 1,
      fuzzyLayer: gr.lib._symbolBlur_inner,
      needMusic: true,
      callback: () => {
        audio.play("BaseSpinStop", 2);
        onWheelStopped("innerWheel");
      },
    });
  }

  function initiaWheel() {
    //  10 - 24   emotiSequence
    for (let index = 10; index < 25; index++) {
      gr.lib['_emoti_' + emotiSequence[index - 1] + '_' + index].show(false);
    }
    gr.lib._symbol_Icon3x_1.updateCurrentStyle({ "_transform": { "_scale": { "_x": 0.1, "_y": 0.1 } } });
    gr.lib._symbol_Icon2x_2.updateCurrentStyle({ "_transform": { "_scale": { "_x": 0, "_y": 0 } } });
    gr.lib._symbol_Icon3x_3.updateCurrentStyle({ "_transform": { "_scale": { "_x": 0, "_y": 0 } } });
    gr.lib._symbol_Icon3x_9.updateCurrentStyle({ "_transform": { "_scale": { "_x": 0, "_y": 0 } } });
    gr.lib._symbol_Icon2x_10.updateCurrentStyle({ "_transform": { "_scale": { "_x": 0, "_y": 0 } } });
    gr.lib._symbolExpand_10.updateCurrentStyle({ "_transform": { "_scale": { "_x": 0, "_y": 0 } } });
    gr.lib._symbolFreespin_2.updateCurrentStyle({ "_transform": { "_scale": { "_x": 0, "_y": 0 } } });
    Tween.to(gr.lib._symbol_Icon3x_1, { scale: { x: 1, y: 1 } }, 1000);
    Tween.to(gr.lib._symbol_Icon2x_2, { scale: { x: 1, y: 1 } }, 1000);
    Tween.to(gr.lib._symbol_Icon3x_3, { scale: { x: 1, y: 1 } }, 1000);
    Tween.to(gr.lib._symbol_Icon3x_9, { scale: { x: 1, y: 1 } }, 1000);
    Tween.to(gr.lib._symbol_Icon2x_10, { scale: { x: 1, y: 1 } }, 1000);
    Tween.to(gr.lib._symbolExpand_10, { scale: { x: 0.32, y: 0.32 } }, 1000);
    Tween.to(gr.lib._symbolFreespin_2, { scale: { x: 0.32, y: 0.32 } }, 1000);
    gr.lib._emotis.updateCurrentStyle({ "_transform": { "_rotate": -180 } });
    outWheelAnmi();

  }

  function outWheelAnmi() {
    let _rotate = gr.lib._emotis._currentStyle._transform._rotate;
    _rotate += 4;
    gr.lib._emotis.updateCurrentStyle({ "_transform": { "_rotate": _rotate } });
    if (_rotate < 16) {
      if (_rotate < 8) {
        gr.lib['_emoti_Red_24'].show(true);
      }
      requestAnimationFrame(outWheelAnmi);
    }
    else {
      requestAnimationFrame(outWheelBackAnmi);
    }
  }

  function outWheelBackAnmi() {
    let _rotate = gr.lib._emotis._currentStyle._transform._rotate;
    _rotate -= 1;
    gr.lib._emotis.updateCurrentStyle({ "_transform": { "_rotate": _rotate } });
    if (_rotate !== 0) {
      requestAnimationFrame(outWheelBackAnmi);
    } else {
      for (let index = 1; index < 31; index++) {
        gr.lib['_emoti_' + emotiSequence[index - 1] + '_' + index].show(true);
      }
      spinButton.enable(true);
      autoSpinButton.enable(true);
      gr.lib._spinText.updateCurrentStyle({ '_opacity': '1' });
      gr.lib._autospinText.updateCurrentStyle({ '_opacity': '1' });
      msgBus.publish('wheelInit');
    }
  }

  function onStartUserInteraction(data) {
    let autoRevealEnabled = SKBeInstant.config.autoRevealEnabled === false ? false : true;
    spinButton.enable(true);
    spinButton.show(true);
    spinIndex = 0;
    spinCounter = 0;
    isBonus = false;
    //clear out 3 locations
    outLocation = [],middleLocation = [],innerLocation = [];
    if (data.scenario) {
      splitArray = data.scenario.split('|');
      BaseGameArray = splitArray[0].split(':'); //每轮转盘的总位置信息
      BaseGameArray.forEach(function (element, index) {
        var temp = element.split(',');
        middleLocation[index] = temp[1];
        innerLocation[index] = temp[2];
        if (temp[2] == '4' || temp[2] == '10') {
          outLocation[index] = Number(temp[0]) + 1 > 30 ? Number(temp[0]) - 29 : Number(temp[0]) + 1;
        } else {
          outLocation[index] = temp[0];
        }
      });
      if (splitArray[1].indexOf(',') > -1) {
        iwGameArray = splitArray[1].split(',');
      } else {
        iwGameArray = [splitArray[1]];
      }
      winValue = data.prizeValue;
      instantWinTime = 0;
      countDown = outLocation.length;
      isAutoSpin = false;
      for (let i = 0; i < data.prizeTable.length; i++) {
        prizeTable[data.prizeTable[i].description] = Number(data.prizeTable[i].prize);
      }
    } else {
      return;
    }
    let isportrait = gr.getSize().height > gr.getSize().width;
    if (autoRevealEnabled) {
      autoSpinButton.enable(true);
      autoSpinButton.show(true);
    } else {
      autoSpinButton.show(false);
      adjustSpinBotton(isportrait);
    }
  }

  function onReStartUserInteraction(data) {
    wheelEmotiAnimTimer = gr.getTimer().setInterval(function () {
      randomEmoti();
    }, 2000);
    onStartUserInteraction(data);
  }

  function onReInitialize() {
    resetAll();
    autoSpinButton.show(false);
    stopButton.show(false);
  }

  function initialBaseGame() {
    gr.lib._arrowUsual_3.show(false);
    gr.lib._arrowUsual_4.show(false);
    gr.lib._collect3Mask.show(false);
    gr.lib._collect5Mask.show(false);
    gr.lib._iwText.show(false);
    gr.lib._iwArrow.show(false);
    gr.lib._iwTextbg.show(false);
    gr.lib._King_copy.show(false);
    gr.lib._priceBgFx_Bonus_Win.show(false);
    gr.lib._priceIconFx_Bonus_Win.show(false);
    gr.lib._stopButton_0.show(false);
    gr.lib._symbolBlur_inner.show(false);
    gr.lib._symbolBlur_out.show(false);
    gr.lib._symbolBlur_middle.show(false);
    gr.lib._turntableSparkle.show(false);
    gr.lib._turntableGlow.show(false);
    let leftEmoti = [...leftEmotiSequence.keys()];
    initBaseAllLightAnims();
    for (let index = 0; index < leftEmoti.length; index++) {
      gr.lib["_priceCollectBursts_" + leftEmoti[index]].show(false);
      gr.lib["_priceIconFx_" + leftEmoti[index]].show(false);
      gr.lib["_priceBgFx_" + leftEmoti[index]].show(false);
    }
    for (let index = 0; index < 5; index++) {
      gr.lib["_flyLayer_" + index].show(false);
      gr.lib["_Top" + index + "_value1"].show(false);
      gr.lib["_Top" + index + "_value1_P"].show(false);
    }
    for (var i = 0; i < 5; i++) {
      gr.animMap._highlight_Lv0_0Anim.clone(
        ["_highlight_Lv0_" + i],
        "_highlight_Lv0_" + i + "Anim"
      );
      gr.lib["_highlight_Lv0_" + i].show(false);
    }
    for (let index = 1; index < 7; index++) {
      for (let i = 0; i < 14 - index; i++) {
        gr.lib["_highlight_Lv" + index + "_" + i].show(false);
      }
    }
    for (let index = 0; index < 7; index++) {
      gr.lib["_numGrowth_" + index].show(false);
    }
    for (let i = 0; i < 3; i++) {
      instantWinButton[i] = new gladButton(
        gr.lib["_symbolInstant_Top" + i],
        "",
        {
          scaleXWhenClick: 0.92,
          scaleYWhenClick: 0.92,
          avoidMultiTouch: true,
        }
      );
      setInstantWinButtonRevealFun(gr.lib["_symbolInstant_Top" + i], i);
      gr.lib["_symbolInstant_Top" + i].pixiContainer.interactive = false;
      instantWinButton[i].click(gr.lib["_symbolInstant_Top" + i].revealFun);
    }
  }

  function setInstantWinButtonRevealFun(symbol, i) {
    symbol.revealFun = function () {
      gr.lib._iwText.show(false);
      gr.lib._iwArrow.show(false);
      gr.lib._iwTextbg.show(false);
      audio.play("BaseSpinIWPickerSelect", 0);
      features.pop(); //assume all above animations completed
      for (let j = 0; j < 3; j++) {
        gr.lib["_symbolInstant_Top" + j].pixiContainer.interactive = false;
        gr.lib["_symbolInstant_Top" + j].pixiContainer.cursor = "default";
        if (i !== j) {
          gr.lib["_Top" + j + "_BG"].gotoAndPlay(
            "instant_Win_outro1",
            0.2,
            false
          );
          gr.lib["_Top" + j + "_BG"].onComplete = function () {
            gr.lib["_Top" + j + "_BG"].show(false);
          };
        } else {
          gr.lib["_Top" + j + "_BG"].gotoAndPlay(
            "instant_Win_spin",
            0.2,
            false
          );
          gr.lib["_Top" + j + "_BG"].onComplete = function () {
            gr.lib["_Top" + j + "_value"].show(true);
            gr.lib["_Top" + j + "_value"].setText(
              SKBeInstant.formatCurrency(iwMoney).formattedAmount
            );
            gr.getTimer().setTimeout(function () {
              gr.lib["_Top" + j + "_BG"].gotoAndPlay(
                "instant_Win_outro2",
                0.2,
                false
              );
              gr.lib["_Top" + j + "_value"].show(false);
              let temp = j;
              if (isSecond) {
                temp = j == 0 ? "3" : "4";
              }
              let tempName =
                gr.getSize().height > gr.getSize().width
                  ? "_P_valueTop"
                  : "_valueTop";
              if (gr.getSize().height > gr.getSize().width) {
                gr.lib["_Top" + temp + "_value1_P"].show(true);
                gr.lib["_Top" + temp + "_value1_P"].setText(
                  SKBeInstant.formatCurrency(iwMoney).formattedAmount
                );
              } else {
                gr.lib["_Top" + temp + "_value1"].show(true);
                gr.lib["_Top" + temp + "_value1"].setText(
                  SKBeInstant.formatCurrency(iwMoney).formattedAmount
                );
              }
              gr.animMap[tempName + temp + "_Anim"].play();
              gr.animMap[tempName + temp + "_Anim"]._onComplete = function () {
                gr.lib["_Top" + j + "_BG"].show(false);
                jackpot += iwMoney;
                if (jackpot > winValue) {
                  msgBus.publish("winboxError", { errorCode: "29000" });
                } else {
                  msgBus.publish("updateWinValue", { value: jackpot });
                }
              };
            }, 1000);
          };
        }
      }

      gr.getTimer().setTimeout(function () {
        recoveryInstantWin();
        //console.log("Geordi called from setInstantWinButtonRevealFun!");
        flyingAnimation(winEmotiMapData);
      }, 3000);
    };
  }

  function initBaseAllLightAnims() {
    if (baseLightAnimations.length === 0) {
      for (let k = 0; k < 5; k++) {
        baseLightAnimations["fly_" + k] = new LightFlyAnimation(
          "Afterimage",
          "Afterimage_0001",
          "_flyLayer_",
          "_flyBg_",
          "_flyEmoti_",
          "complement"
        );
      }
    }
  }

  function onAssetsLoadedAndGameReady() {
    gr.lib._tutorial.show(false);
    gr.lib._winBoxError.show(false);
    gr.lib._ErrorScene.show(false);
    gr.lib._network.show(false);
    gr.lib._nonWinPlaque.show(false);
    gr.lib._winPlaque.show(false);
    gr.lib._BG_dim.show(false);
    gr.lib._bonusGameSence.show(false);
    gr.lib._symbolFrees_Top.show(false);
    gr.lib._symbolExpand_Top.show(false);
    gr.lib._Top0_value.show(false);
    gr.lib._Top1_value.show(false);
    gr.lib._Top2_value.show(false);
    gr.lib._symbolInstant_Top.show(false);
    gr.lib._baseTransitions.show(false);
  }

  function fillWords() {
    gr.lib._spinText.setText(loader.i18n.Game["button_spin"]);
    gr.lib._spinLeft_text_0.setText(loader.i18n.Game["spin_Left"]);
    gr.lib._priceTableLevel_0_bonus_text.setText(loader.i18n.Game["BONUS"]);
    gr.lib._iwText.setText(loader.i18n.Game["IWText"]);
    gr.lib._spinLeft_text.setText(spinLeftText);
    gr.lib._autospinText.setText(loader.i18n.Game.button_autoPlay);
    gr.lib._stopText_0.setText(loader.i18n.Game["button_stop"]);
  }

  function spin() {
    //console.log("Geordi: spin() function called, current spin:" + spinLeftText);
    spinLeftText--;
    countDown--;
    spinCounter++;
    collectTime = 0;
    wheelStopped = [];
    if (innerProp[innerLocation[spinCounter - 1] - 1] !== 0) {
      features.push(innerProp[innerLocation[spinCounter - 1] - 1]);
    } else {
      features = [];
    }
    isExpander = false;
    msgBus.publish("hiddenInfo");
    audio.play("UiSpin", 0);
    audio.play("BaseSpinStart", 2);
    textAnim(gr.lib._spinLeft_text, spinLeftText);
    let emotiLook =
      gr.getSize().height > gr.getSize().width ? "_Look_d" : "_Look_r";
    for (let index = 0; index < 7; index++) {
      gameUtils.playSpine(
        leftEmotiAnim[index],
        [...leftEmotiSequence.keys()][index].toLowerCase() + emotiLook,
        false
      );
    }
    gameUtils.playSpine(RotateLight, "wheel_Lights_start1", true);
    gr.lib._winBox.pixiContainer.children[0].visible = true;
    spinButton.enable(false);
    gr.lib._spinText.updateCurrentStyle({ _opacity: "0.3" });
    autoSpinButton.enable(false);
    gr.lib._autospinText.updateCurrentStyle({ _opacity: "0.3" });
    stopRandomEmoti();
    outWheelRotation.begin();
    gr.lib._turntableSparkle.show(true);
    gr.lib._turntableSparkle.gotoAndPlay("turntable_l", 0.4, true);
    gr.lib._turntableGlow.show(true);
    gr.lib._turntableGlow.gotoAndPlay("turntable_glow", 0.2, false);
    middleWheelRotation.begin();
    innerWheelRotation.begin();
    gr.getTimer().setTimeout(() => {
      outWheelRotation.stop(outLocation[spinIndex] - 1);
      //console.log("Geordi: out Wheel stop on spinIndex: "+ spinIndex);
    }, 400);
    gr.getTimer().setTimeout(() => {
      gr.lib._turntableSparkle.stopPlay();
      gr.lib._turntableSparkle.show(false);
    }, 2100);
    gr.getTimer().setTimeout(() => {
      middleWheelRotation.stop(middleLocation[spinIndex] - 1);
      //console.log("Geordi: middle Wheel stop on spinIndex: "+ spinIndex);
    }, 800);
    gr.getTimer().setTimeout(() => {
      innerWheelRotation.stop(innerLocation[spinIndex] - 1);
      //console.log("Geordi: inner Wheel stop on spinIndex: "+ spinIndex);
      spinIndex++;
      //console.log("Geordi:spinIndex++, current: "+ spinIndex);
    }, 900);
    winEmotiNum = 3;
    for (let index = 0; index < 5; index++) {
      gr.lib["_emoti_collect_" + (index + 1)].show(false);
    }
  }

  function autoSpin() {
    spin();
    autoSpinButton.show(false);
    stopButton.show(true);
    enableStopAutoSpinButton();
    isAutoSpin = true;
  }

  function stopAutoSpin() {
    audio.play("UiClick", 0);
    isAutoSpin = false;
    stopButton.show(false);
    disableStopAutoSpinButton();
    if (isLastSpin()) {
      autoSpinButton.enable(false);
    }
    autoSpinButton.show(true);
  }

  function onWheelStopped(wheelName) {
    //console.log("Geordi: wheel " + wheelName + " stopped!!!!!!!!!!!!!!!!!!!!!");
    wheelStopped.push(wheelName);
    if (wheelStopped.length === 3) {
      onWheelAllStop();
    }
  }

  function onWheelAllStop() {
    //console.log("Geordi onWheelAllStop called");
    gameUtils.stopSpine(RotateLight);
    gr.lib._collect3Mask.show(true);
    for (let index = 0; index < 7; index++) {
      gameUtils.stopSpine(leftEmotiAnim[index]);
    }
    gameUtils.playSpine(collect3Anim, "collect3_up", false);
  }

  function getWinningSymbolsColour(numSym, stopPos) {
    //be aware that emotiSequence index start from 0 ~ 29, but scenario data stop position valid from 1~30, so there is a transfer in between.
    let rt = [],
      indices = [];
    for (let i = 0; i < numSym; i++) {
      indices[i] =
        (stopPos - Math.floor(numSym / 2) + i + emotiSequence.length) %
        emotiSequence.length;
      rt[i] = emotiSequence[indices[i]].toLowerCase();
    }
    //console.log("Geordi:" +  numSym +  " symbols, stop at " +  stopPos +  ", orders are " +  [...indices] +  ", colours are " +  [...rt]);
    return rt;
  }

  function switchArrowColor(emotiNum) {
    const myIndex = spinCounter - 1;
    //console.log("Geordi: "+spinCounter+"th spin!");
    const symbolColours = getWinningSymbolsColour(
      emotiNum,
      outLocation[myIndex]
    );
    for (let index = 0; index < emotiNum; index++) {
      gr.lib["_arrowUsual_" + index].show(true);
      gr.lib["_arrowUsual_" + index].pixiContainer.$sprite.texture = null;
    }
    if (emotiNum === 3) {
      gameUtils.playSpine(
        arrowAnims[2],
        "arrow_" + symbolColours[0] + "_up",
        false
      );
      gameUtils.playSpine(
        arrowAnims[0],
        "arrow_" + symbolColours[1] + "_up",
        false
      );
      gameUtils.playSpine(
        arrowAnims[1],
        "arrow_" + symbolColours[2] + "_up",
        false
      );
    } else {
      gameUtils.playSpine(
        arrowAnims[3],
        "arrow_" + symbolColours[0] + "_up",
        false
      );
      gameUtils.playSpine(
        arrowAnims[2],
        "arrow_" + symbolColours[1] + "_up",
        false
      );
      gameUtils.playSpine(
        arrowAnims[0],
        "arrow_" + symbolColours[2] + "_up",
        false
      );
      gameUtils.playSpine(
        arrowAnims[1],
        "arrow_" + symbolColours[3] + "_up",
        false
      );
      gameUtils.playSpine(
        arrowAnims[4],
        "arrow_" + symbolColours[4] + "_up",
        false
      );
    }
    gr.getTimer().setTimeout(function () {
      if (emotiNum === 3) {
        gameUtils.playSpine(
          arrowAnims[2],
          "arrow_" + symbolColours[0] + "_idle",
          true
        );
        gameUtils.playSpine(
          arrowAnims[0],
          "arrow_" + symbolColours[1] + "_idle",
          true
        );
        gameUtils.playSpine(
          arrowAnims[1],
          "arrow_" + symbolColours[2] + "_idle",
          true
        );
      } else {
        gameUtils.playSpine(
          arrowAnims[3],
          "arrow_" + symbolColours[0] + "_idle",
          true
        );
        gameUtils.playSpine(
          arrowAnims[2],
          "arrow_" + symbolColours[1] + "_idle",
          true
        );
        gameUtils.playSpine(
          arrowAnims[0],
          "arrow_" + symbolColours[2] + "_idle",
          true
        );
        gameUtils.playSpine(
          arrowAnims[1],
          "arrow_" + symbolColours[3] + "_idle",
          true
        );
        gameUtils.playSpine(
          arrowAnims[4],
          "arrow_" + symbolColours[4] + "_idle",
          true
        );
      }
    }, 600);
  }

  function collectionAnim() {
    switch (innerProp[innerLocation[spinCounter - 1] - 1]) {
      case 0:
        //console.log("Geordi collectionAnim on spin" +  spinCounter +  " is (blank, " +  innerProp[innerLocation[spinCounter - 1] - 1] +  "), innerlocation is " +  innerLocation[spinCounter - 1]);
        gr.getTimer().setTimeout(function () {
          flyingAnimation(winEmotiMapData);
        }, 100);
        break;
      case 1:
        //console.log("Geordi collectionAnim on spin" +  spinCounter +  " is extraTime, innerlocation is " +  innerLocation[spinCounter - 1]);
        extraTime();
        break;
      case 2:
        //console.log("Geordi collectionAnim on spin" +  spinCounter +  " is expander, innerlocation is " +  innerLocation[spinCounter - 1]);
        expander();
        break;
      case 3:
        //console.log("Geordi collectionAnim on spin" +  spinCounter +  " is instantWin, innerlocation is " +  innerLocation[spinCounter - 1]);
        instantWin();
        break;
    }
  }

  function extraTime() {
    gr.lib._symbolFrees_Top.show(true);
    let isportrait = gr.getSize().height > gr.getSize().width;
    if (isportrait) {
      gr.animMap._PlusOneP_Anims.play();
    } else {
      gr.animMap._PlusOne_Anims.play();
    }
    audio.play("BaseSpinSubSpin", 0);
    gameUtils.playSpine(freeSpinAnim, "frees_win", false, function () {
      gr.lib._symbolFrees_Top.show(false);
      gameUtils.playSpine(spinBoxAnim, "spin_left", false);
      spinLeftText++;
      //console.log("Geordi: +1 spin, current spin left:" + spinLeftText);
      textAnim(gr.lib._spinLeft_text, spinLeftText);
      features.pop(); //assume all above animations completed
      //console.log("Geordi, called from extraTime");
      flyingAnimation(winEmotiMapData);
    });
    // gr.getTimer().setTimeout(function () {
    // }, 2000);
  }

  function expander() {
    gr.lib._symbolExpand_Top.show(true);
    audio.play("BaseSpinExpand", 0);
    isExpander = true;
    gameUtils.playSpine(expandAnim, "expand_win", false, function () {
      gr.lib["_symbolExpand_Top"].show(false);
    });
    gr.getTimer().setTimeout(function () {
      gameUtils.playSpine(collect3Anim, "expand5_up", false);
      gr.lib._collect3Mask.show(false);
      gr.lib._collect5Mask.show(true);
    }, 500);
    gr.lib._winBox.pixiContainer.children[0].visible = false;
    switchArrowColor(5);
    winEmotiNum = 5;
    gr.getTimer().setTimeout(function () {
      features.pop(); //assume all above animations completed
      //console.log("Geordi, called from expander");
      flyingAnimation(winEmotiMapData);
    }, 1400);
  }

  function instantWin() {
    instantWinTime++;
    iwMoney = prizeTable[iwGameArray[instantWinTime - 1]];
    gr.lib._symbolInstant_Top.show(true);
    gr.lib._iwText.show(true);
    gr.lib._iwArrow.show(true);
    gr.lib._iwTextbg.show(true);
    audio.play("BaseSpinIWPicker", 0);
    switch (instantWinTime) {
      case 1: //  Won the lottery for the first time
        isSecond = false;
        gr.lib._Top0_BG.gotoAndPlay("instant_Win_up", 0.5, false);
        gr.lib._Top0_BG.onComplete = function () {
          gr.animMap["_symbolInstant_Top_Anim"].play();
        };
        gr.animMap["_symbolInstant_Top_Anim"]._onComplete = function () {
          for (let index = 0; index < 3; index++) {
            gr.lib["_Top" + index + "_BG"].gotoAndPlay(
              "instant_Win_loop",
              0.5,
              true
            );
            gr.lib[
              "_symbolInstant_Top" + index
            ].pixiContainer.interactive = true;
            gr.lib["_symbolInstant_Top" + index].pixiContainer.cursor =
              "pointer";
          }
        };
        break;
      case 2: //  The second time
        isSecond = true;
        gr.lib._symbolInstant_Top1.show(false);
        gr.lib._symbolInstant_Top2.show(false);
        gr.lib._Top0_BG.gotoAndPlay("instant_Win_up", 0.5, false);
        gr.lib._Top0_BG.onComplete = function () {
          gr.lib._symbolInstant_Top1.show(true);
          gr.animMap["_symbolInstant_Top_Anim2"].play();
        };
        gr.animMap["_symbolInstant_Top_Anim2"]._onComplete = function () {
          for (let index = 0; index < 2; index++) {
            gr.lib["_Top" + index + "_BG"].gotoAndPlay(
              "instant_Win_loop",
              0.5,
              true
            );
            gr.lib[
              "_symbolInstant_Top" + index
            ].pixiContainer.interactive = true;
            gr.lib["_symbolInstant_Top" + index].pixiContainer.cursor =
              "pointer";
          }
        };
        break;
      case 3: //Last time
        isSecond = false;
        gr.lib._Top2_BG.show(false);
        gr.lib._Top1_BG.show(false);
        gr.lib._Top0_BG.gotoAndPlay("instant_Win_up", 0.5, false);
        gr.lib["_Top0_BG"].gotoAndPlay("instant_Win_loop", 0.5, true);
        gr.lib["_symbolInstant_Top0"].pixiContainer.interactive = true;
        gr.lib["_symbolInstant_Top0"].pixiContainer.cursor = "pointer";
        break;
    }
    for (let i = 0; i < 3; i++) {
      hitAreaButton(gr.lib["_symbolInstant_Top" + i], 0.34);
    }
  }

  function recoveryInstantWin() {
    for (let index = 0; index < 3; index++) {
      gr.lib["_symbolInstant_Top" + index].updateCurrentStyle({ _left: 0 });
      gr.lib["_Top" + index + "_BG"].show(true);
      gr.lib["_Top" + index + "_BG"].setImage("instant_Win_up_14");
      gr.lib["_Top" + index + "_BG"].stopPlay();
      gr.lib["_Top" + index + "_value"].setText("");
    }
    gr.lib._symbolInstant_Top.show(false);
  }

  function outAndMiddleCollectionAnim() {
    let outTargetPosition = Number(outLocation[spinCounter - 1]);
    let middleTargetPosition = Number(middleLocation[spinCounter - 1]);
    let multipleSymbol =
      gr.lib[
        "_symbol_" +
          multipleSequence[
            middleTargetPosition - 1 < 0
              ? middleTargetPosition + 9
              : middleTargetPosition - 1
          ] +
          "_" +
          middleTargetPosition
      ];
    let winningEmoti = [];
    let colorMap = new Map([
      ["Purple", "BaseSpinStopSymbol1"],
      ["Pink", "BaseSpinStopSymbol2"],
      ["Red", "BaseSpinStopSymbol3"],
      ["Yellow", "BaseSpinStopSymbol4"],
      ["Green", "BaseSpinStopSymbol5"],
      ["Blue", "BaseSpinStopSymbol6"],
      ["Bonus", "BaseSpinStopSymbolBonus"],
    ]);
    if (innerProp[innerLocation[spinCounter - 1] - 1] === 2) {
      winEmotiNum = 5;
      winningEmoti = [gr.lib[  "_emoti_" +    emotiSequence[      outTargetPosition - 1 < 0        ? outTargetPosition + 29        : outTargetPosition - 1    ] +    "_" +    outTargetPosition],
        gr.lib["_emoti_" +  emotiSequence[outTargetPosition === 30 ? 0 : outTargetPosition] +  "_" +  (outTargetPosition + 1 > 30    ? outTargetPosition - 29    : outTargetPosition + 1)
        ],
        gr.lib["_emoti_" +  emotiSequence[    outTargetPosition + 1 > 29      ? outTargetPosition - 29      : outTargetPosition + 1  ] +  "_" +  (outTargetPosition + 2 > 30    ? outTargetPosition - 28    : outTargetPosition + 2)
        ],
        gr.lib["_emoti_" +  emotiSequence[    outTargetPosition - 2 < 0      ? outTargetPosition + 28      : outTargetPosition - 2  ] +  "_" +  (outTargetPosition - 1 < 1 ? 30 : outTargetPosition - 1)
        ],
        gr.lib["_emoti_" +  emotiSequence[    outTargetPosition + 2 > 29      ? outTargetPosition - 28      : outTargetPosition + 2  ] +  "_" +  (outTargetPosition + 3 > 30    ? outTargetPosition - 27    : outTargetPosition + 3)
        ],
      ];
    } else {
      winningEmoti = [
        gr.lib["_emoti_" +  emotiSequence[    outTargetPosition - 1 < 0      ? outTargetPosition + 29      : outTargetPosition - 1  ] +  "_" +  outTargetPosition
        ],
        gr.lib["_emoti_" +  emotiSequence[outTargetPosition === 30 ? 0 : outTargetPosition] +  "_" +  (outTargetPosition + 1 > 30    ? outTargetPosition - 29    : outTargetPosition + 1)
        ],
        gr.lib["_emoti_" +  emotiSequence[    outTargetPosition + 1 > 29      ? outTargetPosition - 29      : outTargetPosition + 1  ] +  "_" +  (outTargetPosition + 2 > 30    ? outTargetPosition - 28    : outTargetPosition + 2)
        ],
      ];
    }
    for (let i = 1; i <= winEmotiNum; i++) {
      gameUtils.stopSpine(collectAnim[i - 1]);
      let currentStyle = winningEmoti[i - 1]._currentStyle;
      gr.lib["_emoti_collect_" + i].updateCurrentStyle(currentStyle);
      gr.lib["_emoti_collect_" + i].setImage(
        currentStyle._background._imagePlate
      );
    }
    gr.lib._emotisCopy.updateCurrentStyle(gr.lib._emotis._currentStyle);
    for (let i = 1; i <= 3; i++) {
      winningEmoti[i - 1].show(false);
      gr.lib["_emoti_collect_" + i].show(true);
      Tween.to(
        gr.lib["_emoti_collect_" + i],
        { scale: { x: 0.7, y: 0.7 } },
        300,
        {
          _onComplete: function () {
            gr.lib[
              "_emoti_collect_" + i
            ].pixiContainer.children[0].visible = false;
          },
        }
      );
    }
    audio.play(
      colorMap.get(
        emotiSequence[
          outTargetPosition - 1 < 0
            ? outTargetPosition + 29
            : outTargetPosition - 1
        ]
      ),
      3
    );
    audio.play(
      colorMap.get(
        emotiSequence[outTargetPosition === 30 ? 0 : outTargetPosition]
      ),
      4
    );
    audio.play(
      colorMap.get(
        emotiSequence[
          outTargetPosition + 1 > 29
            ? outTargetPosition - 29
            : outTargetPosition + 1
        ]
      ),
      5
    );
    gr.getTimer().setTimeout(function () {
      gameUtils.playSpine(
        collectAnim[0],
        emotiSequence[
          outTargetPosition - 1 < 0
            ? outTargetPosition + 29
            : outTargetPosition - 1
        ].toLowerCase() + "_win",
        false,
        function () {
          gr.lib._emoti_collect_1.setImage(
            emotiSequence[
              outTargetPosition - 1 < 0
                ? outTargetPosition + 29
                : outTargetPosition - 1
            ]
          );
        }
      );
      gameUtils.playSpine(
        collectAnim[1],
        emotiSequence[
          outTargetPosition === 30 ? 0 : outTargetPosition
        ].toLowerCase() + "_win",
        false,
        function () {
          gr.lib._emoti_collect_2.setImage(
            emotiSequence[outTargetPosition === 30 ? 0 : outTargetPosition]
          );
        }
      );
      gameUtils.playSpine(
        collectAnim[2],
        emotiSequence[
          outTargetPosition + 1 > 29
            ? outTargetPosition - 29
            : outTargetPosition + 1
        ].toLowerCase() + "_win",
        false,
        function () {
          gr.lib._emoti_collect_3.setImage(
            emotiSequence[
              outTargetPosition + 1 > 29
                ? outTargetPosition - 29
                : outTargetPosition + 1
            ]
          );
          for (let i = 1; i <= 3; i++) {
            gr.lib[
              "_emoti_collect_" + i
            ].pixiContainer.children[0].visible = true;
            Tween.to(
              gr.lib["_emoti_collect_" + i],
              { scale: { x: 0.6, y: 0.6 } },
              300,
              {
                _onComplete: function () {
                  gr.lib["_emoti_collect_" + i].show(false);
                  winningEmoti[i - 1].show(true);
                },
              }
            );
          }
        }
      );
    }, 300);
    gr.getTimer().setTimeout(function () {
      gr.lib._emoti_multiple.show(true);
      let targetRotate = gr.lib._wheelMiddle._currentStyle._transform._rotate;
      gr.lib._wheelMiddleCopy.updateCurrentStyle({
        _transform: { _rotate: targetRotate },
      });
      gr.lib._emoti_multiple.updateCurrentStyle(multipleSymbol._currentStyle);
      gr.lib._emoti_multiple.setImage(
        multipleSequence[
          middleTargetPosition - 1 < 0 ? 29 : middleTargetPosition - 1
        ].toLowerCase()
      );
      multipleSymbol.show(false);
      Tween.to(gr.lib._emoti_multiple, { scale: { x: 1.3, y: 1.3 } }, 250);
      gr.getTimer().setTimeout(function () {
        Tween.to(gr.lib._emoti_multiple, { scale: { x: 1, y: 1 } }, 250, {
          _onComplete: function () {
            multipleSymbol.show(true);
            gr.lib._emoti_multiple.show(false);
            collectionAnim();
            // //Analysis type
            let winEmotiData = new Array(winEmotiNum);
            multiple = Number(
              multipleSequence[
                middleTargetPosition - 1 < 0 ? 29 : middleTargetPosition - 1
              ].slice(4, 5)
            );
            for (let i = 0; i < winningEmoti.length; i++) {
              let emoti = winningEmoti[i].data._name.split("_")[2];
              winEmotiData[i] = {
                target: emoti,
                start: i + 1,
                img: emoti,
                num: multiple,
              };
            }
            winEmotiMapData = emotiSum(winEmotiData);
          },
        });
      }, 500);
    }, 1800);
  }

  function flyingAnimation(winEmotiMapData) {
    let winEmoti = [...winEmotiMapData.keys()];
    let weight = isAutoSpin ? 0 : 1;
    for (let i = 0; i < winEmoti.length; i++) {
      gr.getTimer().setTimeout(function () {
        baseLightAnimations["fly_" + i].moveTo(
          gr.lib["_emoti_collect_" + winEmotiMapData.get(winEmoti[i]).start],
          gr.lib["_priceTableLevel_" + winEmoti[i] + "_icon"],
          300,
          { num: i },
          winEmoti[i],
          winEmotiMapData.get(winEmoti[i]).num
        );
        //console.log("Kevin "+i);
        if(i === 0  && isLastSpin() && isAutoSpin) {
          disableStopAutoSpinButton();
        }
      }, 1200 * i * weight);
    }
  }
  function disableStopAutoSpinButton(){
    stopButton.enable(false);
    gr.lib._stopText_0.updateCurrentStyle({ '_opacity': '0.3' });
  }

  function enableStopAutoSpinButton(){
    stopButton.enable(true);
    gr.lib._stopText_0.updateCurrentStyle({ '_opacity': '1' });
  }

  function textAnim(sprite, text) {
    Tween.to(sprite, { scale: { x: 1.3, y: 1.3 } }, 150);
    gr.getTimer().setTimeout(function () {
      Tween.to(sprite, { scale: { x: 1, y: 1 } }, 150, {
        _onComplete: function () {
          sprite.setText(text);
        },
      });
    }, 150);
  }

  function setAutoFontFitText() {
    gr.lib._spinText.autoFontFitText = true;
    gr.lib._spinLeft_text_0.autoFontFitText = true;
    gr.lib._spinLeft_text.autoFontFitText = true;
    gr.lib._priceTableLevel_0_bonus_text.autoFontFitText = true;
    gr.lib._iwText.autoFontFitText = true;
    gr.lib._autospinText.autoFontFitText = true;
    gr.lib._stopText_0.autoFontFitText = true;
    gr.lib._Top0_value.autoFontFitText = true;
    gr.lib._Top1_value.autoFontFitText = true;
    gr.lib._Top2_value.autoFontFitText = true;
    for (let index = 0; index < 5; index++) {
      gr.lib["_Top" + index + "_value1"].autoFontFitText = true;
      gr.lib["_Top" + index + "_value1_P"].autoFontFitText = true;
    }
  }

  function emotiSum(tem) {
    const map = new Map();
    let tempArr = tem.filter((s) => {
      return s;
    });
    for (let i = 0; i < tempArr.length; i++) {
      if (!map.has(tempArr[i].target)) {
        map.set(tempArr[i].target, {
          num: tempArr[i].num,
          start: tempArr[i].start,
        });
      } else {
        map.set(tempArr[i].target, {
          num: tempArr[i].num + map.get(tempArr[i].target).num,
          start: tempArr[i].start,
        });
      }
    }
    return map;
  }

  function leftCollectAnim(data) {
    collectTime += data.time;
    const colorMap = new Map([
      ["Purple", "BaseMeterWin1"],
      ["Pink", "BaseMeterWin2"],
      ["Red", "BaseMeterWin3"],
      ["Yellow", "BaseMeterWin4"],
      ["Green", "BaseMeterWin5"],
      ["Blue", "BaseMeterWin6"],
    ]);
    let leftEmoti = leftEmotiSequence.get(data.img);
    leftEmoti.colour = data.img.toLowerCase();
    let leftEmotiNum = leftEmotiSequence.get(data.img).time;
    leftEmoti.time += data.time;
    leftEmotiSequence.set(data.img, leftEmoti);
    gr.lib["_numGrowth_" + leftEmoti.index].show(true);
    gr.lib["_numGrowth_" + leftEmoti.index].setImage(
      data.img.toLowerCase() + "_" + data.time
    );
    gr.animMap["_numGrowth_" + leftEmoti.index + "Anim"].play();
    for (let indexs = 0; indexs < data.time; indexs++) {
      gr.getTimer().setTimeout(function () {
        gr.lib[
          "_highlight_Lv" + leftEmoti.index + "_" + (leftEmotiNum + indexs)
        ].show(true);
        gr.animMap[
          "_highlight_Lv" +
            leftEmoti.index +
            "_" +
            (leftEmotiNum + indexs) +
            "Anim"
        ].play();
        gr.animMap[
          "_highlight_Lv" +
            leftEmoti.index +
            "_" +
            (leftEmotiNum + indexs) +
            "Anim"
        ]._onComplete = function () {
          gr.lib[
            "_" + leftEmoti.index + "_collectGrid_" + (leftEmotiNum + indexs)
          ].setImage("meter_" + data.img.toLowerCase() + "_grid2");
        };
      }, 200 * indexs);
    }

    if (leftEmoti.time === leftEmoti.maxTime) {
      if (data.img === "Bonus") {
        isBonus = true;
        gr.lib._priceIconFx_Bonus_Win.show(true);
        gr.lib._priceBgFx_Bonus_Win.show(true);
        gr.lib._priceIconFx_Bonus_Win.gotoAndPlay("win_m_Bonus", 0.2, false);
        gr.lib._priceBgFx_Bonus_Win.gotoAndPlay("win_c_Bonus", 0.2, false);
        for (let index = 0; index < leftEmoti.maxTime; index++) {
          gr.lib["_0_collectGrid_" + index].setImage("meter_bonus_grid2");
        }
      } else {
        audio.play(colorMap.get(data.img), 3);
        gr.lib["_priceBgFx_" + data.img].show(true);
        gr.lib["_priceBgFx_" + data.img].gotoAndPlay(
          "c_" + data.img + "_loop",
          0.2,
          true
        );
        gr.lib["_priceIconFx_" + data.img].show(true);
        gr.lib["_priceIconFx_" + data.img].gotoAndPlay(
          "e_" + data.img + "_loop",
          0.2,
          true
        );
        let moneyTag = EmotiMoneySequence.get(data.img);
        jackpot += prizeTable[moneyTag];
        if (jackpot > winValue) {
          msgBus.publish("winboxError", { errorCode: "29000" });
        } else {
          msgBus.publish("updateWinValue", { value: jackpot });
        }
      }
    }

    if (collectTime === winEmotiNum * multiple) {
      gr.getTimer().setTimeout(function () {
        gr.lib._collect3Mask.show(false);
        gr.lib._collect5Mask.show(false);
        gameUtils.stopSpine(collect3Anim);
        if (isExpander) {
          gameUtils.playSpine(collect3Anim, "expand5_out", false);
          gr.getTimer().setTimeout(function () {
            gameUtils.playSpine(collect3Anim, "collect3_out", false);
            gr.lib._winBox.pixiContainer.children[0].visible = true;
          }, 166);
        }
        wheelEmotiAnimTimer = gr.getTimer().setInterval(function () {
          randomEmoti();
        }, 2000);
        if (isLastSpin()) {
          spinButton.show(false);
          stopButton.show(false);
          autoSpinButton.show(false);
          stopRandomEmoti();
          if (!isBonus) {
            gr.getTimer().setTimeout(function () {
              msgBus.publish("allRevealed");
            }, 500);
          }
          isAutoSpin = false;
        }
        if (isBonus) {
          gr.lib._King_copy.show(true);
          let KingShowName =
            gr.getSize().height > gr.getSize().width
              ? "_King_show_Anim_P"
              : "_King_show_Anim";
          gr.animMap[KingShowName].play();
          audio.play("BonusLaunch", 2);
          audio.play("BonusMusicLoop", 1, true);
          audio.volume(1, 0.4);
          gr.animMap[KingShowName]._onComplete = function () {
            gr.lib._baseTransitions.show(true);
            audio.play("Transitions", 0);
            gameUtils.playSpine(
              baseTransitionAnim,
              "transition_in",
              false,
              function () {
                gr.lib._baseGameSence.show(false);
                msgBus.publish("startBonus");
                gameUtils.playSpine(
                  baseTransitionAnim,
                  "transition_out",
                  false
                );
              }
            );
          };
          gameUtils.playSpine(KingCopyAnim, "bonus", false);
          return;
        }
        gr.lib._arrowUsual_3.show(false);
        gr.lib._arrowUsual_4.show(false);
        for (let index = 0; index < 5; index++) {
          gameUtils.stopSpine(arrowAnims[index], true);
          gameUtils.playSpine(arrowAnims[index], "arrow_usual_idle", true);
        }
        readyForNextSpin();
      }, 1000);
    }
  }

  function readyForNextSpin() {
    if (features.length === 0) {
      if (isAutoSpin) {
        gr.getTimer().setTimeout(function () {
          spin();
        }, AutoSpinIntervalBase);
      } else {
        if (isLastSpin() === false) {
          msgBus.publish("appearInfo");
          autoSpinButton.enable(true);
          spinButton.enable(true);
        }
        gr.lib._spinText.updateCurrentStyle({ _opacity: "1" });
        gr.lib._autospinText.updateCurrentStyle({ _opacity: "1" });
      }
    } else {
      //console.log("Geordi: waiting feature " + features[0] + " to be completed");
      gr.getTimer().setTimeout(function () {
        readyForNextSpin();
      }, 500);
    }
  }

  function onStartReveallAll() {
    revealAll = true;
  }

  function onTutorialIsShown() {
    tutorialIsShown = true;
  }

  function onTutorialIsHide() {
    tutorialIsShown = false;
  }

  function onError() {
    gameError = true;
    gr.getTimer().setTimeout(function () {
      gr.getTicker().stop();
    }, 200);
  }

  function isLastSpin() {
    return countDown === 0;
  }

  function onReset() {
    onReInitialize();
  }

  function startBase(data) {
    audio.play("BaseMusicLoop", 1, true);
    gr.lib._bonusGameSence.show(false);
    gr.lib._baseGameSence.show(true);
    gr.lib._buttons.show(true);
    gr.lib._priceBgFx_Bonus_Win.show(true);
    gr.lib._priceIconFx_Bonus.show(true);
    gr.lib._priceBgFx_Bonus_Win.gotoAndPlay("win_c_Bonus_loop", 0.2, true);
    gr.lib._priceIconFx_Bonus.gotoAndPlay("win_m_Bonus_loop", 0.2, true);
    gr.lib._King_copy.show(false);
    gameUtils.playSpine(bonusAnim, "bonus", true);
    gr.lib[
      "_priceTableLevel_0_bonus"
    ].pixiContainer.children[0].visible = false;
    for (let index = 0; index < 5; index++) {
      gr.lib["_0_collectGrid_" + index].show(false);
    }
    gr.lib._0_collectWin.show(true);
    jackpot += data.money;
    gr.lib._0_collectWin.setText(
      SKBeInstant.formatCurrency(data.money).formattedAmount
    );
    isBonus = false;
    gr.getTimer().setTimeout(function () {
      if (isLastSpin()) {
        gr.getTimer().setTimeout(function () {
          msgBus.publish("allRevealed");
        }, 500);
      }
      gr.lib._arrowUsual_3.show(false);
      gr.lib._arrowUsual_4.show(false);
      for (let index = 0; index < 5; index++) {
        gameUtils.stopSpine(arrowAnims[index], true);
        gameUtils.playSpine(arrowAnims[index], "arrow_usual_idle", true);
      }
      readyForNextSpin();
    }, 2000);
  }

  function isOnePrice(OnePrice) {
    onePrice = OnePrice;
  }
  function adjustSpinBotton(portrait) {
    if (portrait) {
      spinButton.updateCurrentStyle({ _left: 130 });
    } else {
      if (onePrice) {
        spinButton.updateCurrentStyle({ _left: 150 });
      } else {
        spinButton.updateCurrentStyle({ _left: 0 });
      }
    }
  }

  function onOrientationChanged(portrait) {
    let autoRevealEnabled =
      SKBeInstant.config.autoRevealEnabled === false ? false : true;
    if (!autoRevealEnabled) {
      adjustSpinBotton(portrait);
    }
  }

  msgBus.subscribe("changeBackgroundBGIfPortrait", onOrientationChanged);
  msgBus.subscribe(
    "SKBeInstant.gameParametersUpdated",
    onGameParametersUpdated
  );
  msgBus.subscribe("jLottery.reInitialize", onReInitialize);
  msgBus.subscribe("isOnePrice", isOnePrice);
  msgBus.subscribe("jLottery.reStartUserInteraction", onReStartUserInteraction);
  msgBus.subscribe("jLottery.startUserInteraction", onStartUserInteraction);
  msgBus.subscribe(
    "jLotteryGame.assetsLoadedAndGameReady",
    onAssetsLoadedAndGameReady
  );
  msgBus.subscribe("jLottery.error", onError);
  msgBus.subscribe("leftCollectAnim", leftCollectAnim);
  msgBus.subscribe("winboxError", onError);
  msgBus.subscribe("startReveallAll", onStartReveallAll);
  msgBus.subscribe("resetAll", resetAll);
  msgBus.subscribe("tutorialIsShown", onTutorialIsShown);
  msgBus.subscribe("tutorialIsHide", onTutorialIsHide);
  msgBus.subscribe("reset", onReset);
  msgBus.subscribe("startBase", startBase);
  return {};
});
