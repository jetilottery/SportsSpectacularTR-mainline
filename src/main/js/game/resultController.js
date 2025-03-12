/**
 * @module game/resultDialog
 * @description result dialog control
 */
define(['skbJet/component/gameMsgBus/GameMsgBus',
  'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
  'skbJet/component/gladPixiRenderer/gladPixiRenderer',
  'skbJet/component/pixiResourceLoader/pixiResourceLoader',
  'skbJet/component/SKBeInstant/SKBeInstant',
  'game/utils/Particle',
  'game/utils/gladButton',
], function (msgBus, audio, gr, loader, SKBeInstant, Particle, gladButton) {
  var resultData = null;
  var resultPlaque = null;
  var ticketCost, jackpot = 0;
  var suppressNonWinResultPlaque = true,
    showResultScreen = true;
  let winParticles;
  let retryButton = null;
  var bigWinThresholds = {
    level1: {
      upper: {
        multiplier: 5,
        inclusive: false
      }
    },
    level2: {
      lower: {
        multiplier: 5,
        inclusive: true
      },
      upper: {
        "multiplier": 20,
        inclusive: true
      }
    },
    level3: {
      lower: {
        multiplier: 20,
        inclusive: false
      }
    }
  };
  let moreParticleConfig_portrait = {
    "alpha": {
      "start": 1,
      "end": 1
    },
    "scale": {
      "start": 0.6,
      "end": 0.6,
      "minimumScaleMultiplier": 0.74
    },
    "color": {
      "start": "#ffffff",
      "end": "#ffffff"
    },
    "speed": {
      "start": 1100,
      "end": 1500,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": 900
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 250,
      "max": 290
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": -30,
      "max": 30
    },
    "lifetime": {
      "min": 4,
      "max": 4
    },
    "blendMode": "normal",
    "frequency": 0.01,
    "emitterLifetime": 2,
    "maxParticles": 1200,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
      "x": 10,
      "y": 750,
      "w": 1000,
      "h": 20
    }
  };
  let moreParticleConfig = {
    "alpha": {
      "start": 1,
      "end": 1
    },
    "scale": {
      "start": 0.6,
      "end": 0.6,
      "minimumScaleMultiplier": 0.74
    },
    "color": {
      "start": "#ffffff",
      "end": "#ffffff"
    },
    "speed": {
      "start": 1100,
      "end": 1500,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": 900
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 250,
      "max": 290
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": -30,
      "max": 30
    },
    "lifetime": {
      "min": 4,
      "max": 4
    },
    "blendMode": "normal",
    "frequency": 0.01,
    "emitterLifetime": 2,
    "maxParticles": 1200,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
      "x": 200,
      "y": 750,
      "w": 1000,
      "h": 20
    }
  };
  let fewParticleConfig_portrait = {
    "alpha": {
      "start": 1,
      "end": 1
    },
    "scale": {
      "start": 0.6,
      "end": 0.6,
      "minimumScaleMultiplier": 0.74
    },
    "color": {
      "start": "#ffffff",
      "end": "#ffffff"
    },
    "speed": {
      "start": 1100,
      "end": 1500,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": 900
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 250,
      "max": 290
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": -30,
      "max": 30
    },
    "lifetime": {
      "min": 4,
      "max": 4
    },
    "blendMode": "normal",
    "frequency": 0.04,
    "emitterLifetime": 2,
    "maxParticles": 1200,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
      "x": 10,
      "y": 750,
      "w": 1000,
      "h": 20
    }
  };
  let fewParticleConfig = {
    "alpha": {
      "start": 1,
      "end": 1
    },
    "scale": {
      "start": 0.6,
      "end": 0.6,
      "minimumScaleMultiplier": 0.74
    },
    "color": {
      "start": "#ffffff",
      "end": "#ffffff"
    },
    "speed": {
      "start": 1100,
      "end": 1500,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": 900
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 250,
      "max": 290
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": -30,
      "max": 30
    },
    "lifetime": {
      "min": 4,
      "max": 4
    },
    "blendMode": "normal",
    "frequency": 0.04,
    "emitterLifetime": 2,
    "maxParticles": 1200,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
      "x": 200,
      "y": 750,
      "w": 1000,
      "h": 20
    }
  };

  function onGameParametersUpdated() {
    gr.lib._winPlaque.on('click', closeResultPlaque);
    gr.lib._winPlaque.pixiContainer.cursor = "pointer";
    gr.lib._nonWinPlaque.pixiContainer.cursor = "pointer";
    gr.lib._nonWinPlaque.on('click', closeResultPlaque);
    gr.lib._win_Text_1.autoFontFitText = true;
    gr.lib._win_Text_2.autoFontFitText = true;
    gr.lib._win_Value_1.autoFontFitText = true;
    gr.lib._win_Value_2.autoFontFitText = true;
    gr.lib._retryText.autoFontFitText = true;
    gr.lib._win_Text_1.setText(loader.i18n.Game.totalbonuswin);
    gr.lib._win_Text_2.setText(loader.i18n.Game.totalwin);
    gr.lib._nonWin_Text1.autoFontFitText = true;
    gr.lib._nonWin_Text2.autoFontFitText = true;
    gr.lib._nonWin_Text1.setText(loader.i18n.Game.message_nonWin01);
    gr.lib._nonWin_Text2.setText(loader.i18n.Game.message_nonWin02);
    if (SKBeInstant.config.customBehavior) {
      if (SKBeInstant.config.customBehavior.bigWinThresholds) {
        bigWinThresholds = SKBeInstant.config.customBehavior.bigWinThresholds;
      }
    } else if (loader.i18n.gameConfig) {
      if (loader.i18n.gameConfig.bigWinThresholds) {
        bigWinThresholds = loader.i18n.gameConfig.bigWinThresholds;
      }
    }

    if (SKBeInstant.config.customBehavior) {
      if (!SKBeInstant.config.customBehavior.suppressNonWinResultPlaque) {
        suppressNonWinResultPlaque = false;
      }
    } else if (loader.i18n.gameConfig) {
      if (!loader.i18n.gameConfig.suppressNonWinResultPlaque) {
        suppressNonWinResultPlaque = false;
      }
    }

    if (SKBeInstant.config.customBehavior) {
      if (!SKBeInstant.config.customBehavior.showResultScreen) {
        showResultScreen = false;
      }
    } else if (loader.i18n.gameConfig) {
      if (!loader.i18n.gameConfig.showResultScreen) {
        showResultScreen = false;
      }
    }
    var scaleType = { 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92 };
    retryButton = new gladButton(gr.lib._retryButton, 'AutospinButton', scaleType);
    retryButton.show(false);
    gr.lib._retryText.setText(loader.i18n.Game.button_retry);
    retryButton.click(reSendRequest);
  }

  function reSendRequest() {
    retryButton.show(false);
    msgBus.publish('jLotteryGame.ticketResultHasBeenSeen', {
      tierPrizeShown: resultData.prizeDivision,
      formattedAmountWonShown: resultData.prizeValue
    });
  }

  function closeResultPlaque() {
    hideDialog();
    audio.play('UiClick', 0);
  }

  function hideDialog() {
    gr.lib._winPlaque.show(false);
    gr.lib._nonWinPlaque.show(false);
    if (winParticles) {
      winParticles.stop();
    }
  }

  function particleAnim() {
    let level = findPrizeLevel();
    let isPortrait = gr.getSize().height > gr.getSize().width;
    let ParticleConfig;
    if (level === 2) {
      if (isPortrait) {
        ParticleConfig = fewParticleConfig_portrait;
      } else {
        ParticleConfig = fewParticleConfig;
      }
      winParticles = new Particle(
        gr.lib._celeParticles.pixiContainer,
        'coin',
        [],
        ParticleConfig,
        true,
        { startFrame: 1, endFrame: 9, isSingleNumFormat: false, frameRate: 60 }
      );
      winParticles.start();
      audio.play('WinTier2', 0);
    } else if (level === 3) {
      if (isPortrait) {
        ParticleConfig = moreParticleConfig_portrait;
      } else {
        ParticleConfig = moreParticleConfig;
      }
      winParticles = new Particle(
        gr.lib._celeParticles.pixiContainer,
        'coin',
        [],
        ParticleConfig,
        true,
        { startFrame: 1, endFrame: 9, isSingleNumFormat: false, frameRate: 60 }
      );
      winParticles.start();
      audio.play('WinTier3', 0);
    }
  }

  function showDialog() {
    if (resultData.playResult === 'WIN') {
      gr.lib._win_Text.show(true);
      if (SKBeInstant.config.wagerType === 'BUY') {
        gr.lib._win_Text_2.setText(loader.i18n.Game.message_buyWin);
      } else {
        gr.lib._win_Text_2.setText(loader.i18n.Game.message_tryWin);
      }
      particleAnim();
      gr.lib._win_Text_1.show(false);
      gr.lib._win_Value_1.show(false);
      gr.lib._win_Text_2.show(true);
      gr.lib._win_Value_2.show(true);
      gr.lib._win_Value_2.setText(SKBeInstant.formatCurrency(resultData.prizeValue).formattedAmount);
      gr.lib._winPlaque.show(true);
      gr.lib._nonWinPlaque.show(false);
    } else {
      gr.lib._winPlaque.show(false);
      if (!suppressNonWinResultPlaque) {
        gr.lib._nonWinPlaque.show(true);
      }
    }
  }

  function findPrizeLevel() {
    // Grab the big win thresholds from the object      
    var totalWin = resultData.prizeValue;
    var numLevels = Object.keys(bigWinThresholds).length; // Return -1 if this is a non winner
    if (totalWin === 0) {
      return -1;
    }
    for (var i = 0; i < numLevels; i++) {
      var thisObj = bigWinThresholds['level' + (i + 1)];
      var lowerLimitPresent = thisObj.lower || false;
      var upperLimitPresent = thisObj.upper || false;
      var withinUpper = false;
      var withinLower = false;
      if (lowerLimitPresent) {
        if (thisObj.lower.inclusive) {
          if (totalWin >= ticketCost * thisObj.lower.multiplier) {
            withinLower = true;
          }
        } else {
          if (totalWin > ticketCost * thisObj.lower.multiplier) {
            withinLower = true;
          }
        }
      } else {
        withinLower = true;
      }
      if (upperLimitPresent) {
        if (thisObj.upper.inclusive) {
          if (totalWin <= ticketCost * thisObj.upper.multiplier) {
            withinUpper = true;
          }
        } else {
          if (totalWin < ticketCost * thisObj.upper.multiplier) {
            withinUpper = true;
          }
        }
      } else {
        //it's the highest already
        withinUpper = true;
      }
      if (withinLower && withinUpper) {
        return i + 1;
      }
    }
  }

  function onStartUserInteraction(data) {
    resultData = data;
    hideDialog();
  }

  function onAllRevealed() {
    if (resultData.prizeValue !== jackpot) {
      msgBus.publish('winboxError', { errorCode: '29000' });
      return;
    }
    msgBus.publish('jLotteryGame.ticketResultHasBeenSeen', {
      tierPrizeShown: resultData.prizeDivision,
      formattedAmountWonShown: resultData.prizeValue
    });
    msgBus.publish('disableUI');
  }

  function onEnterResultScreenState() {
    if (gr.lib._tutorial.pixiContainer.visible) {
      gr.lib._tutorial.show(false);
    }
    if (showResultScreen) {
      showDialog();
    }
  }

  function onReStartUserInteraction(data) {
    onStartUserInteraction(data);
  }

  function onReInitialize() {
    hideDialog();
    resetAll();
  }

  function onTutorialIsShown() {
    if (gr.lib._winPlaque.pixiContainer.visible || gr.lib._nonWinPlaque.pixiContainer.visible) {
      resultPlaque = gr.lib._winPlaque.pixiContainer.visible ? gr.lib._winPlaque : gr.lib._nonWinPlaque;
      hideDialog();
      gr.lib._BG_dim.show(true);
    }
  }

  function onTutorialIsHide() {
    if (resultPlaque) {
      resultPlaque.show(true);
      resultPlaque = null;
    }
  }

  function onTicketCostChanged(prizePoint) {
    ticketCost = prizePoint;
  }

  function resetAll() {
    hideDialog();
    jackpot = 0;
  }

  function updateWinValue(data) {
    jackpot = data.value;
  }

  function onRetry() {
    retryButton.show(true);
  }

  msgBus.subscribe('updateWinValue', updateWinValue);
  msgBus.subscribe('resetAll', resetAll);
  msgBus.subscribe('jLottery.reInitialize', onReInitialize);
  msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
  msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
  msgBus.subscribe('ticketCostChanged', onTicketCostChanged);
  msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
  msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
  msgBus.subscribe('allRevealed', onAllRevealed);
  msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
  msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
  msgBus.subscribe('jLotterySKB.retry', onRetry);
  return {};
});
