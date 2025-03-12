/**
 * @module game/playWithMoney
 * @description play with money button control
 */
define([
  'skbJet/component/gameMsgBus/GameMsgBus',
  'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
  'skbJet/component/gladPixiRenderer/gladPixiRenderer',
  'skbJet/component/pixiResourceLoader/pixiResourceLoader',
  'skbJet/component/SKBeInstant/SKBeInstant',
  'game/utils/gladButton',
], function (msgBus, audio, gr, loader, SKBeInstant, gladButton) {
  var count = 0;
  var buttonMTM;
  var inGame = false;
  var showWarn = false;
  var warnReset = false;

  function enableButton() {
    if ((SKBeInstant.config.wagerType === 'BUY') || (Number(SKBeInstant.config.jLotteryPhase) === 1) || (Number(SKBeInstant.config.demosB4Move2MoneyButton) === -1/*-1: never. Move-To-Money-Button will never appear.*/)) {
      gr.lib._buy.show(true);
      gr.lib._try.show(false);
    } else {
      //0: Move-To-Money-Button shown from the beginning, before placing any demo wager.
      //1..N: number of demo wagers before showing Move-To-Money-Button.
      //(Example: If value is 1, then the first time the RESULT_SCREEN state is reached, 
      //the Move-To-Money-Button will appear (conditioned by compulsionDelayInSeconds))
      if (count >= Number(SKBeInstant.config.demosB4Move2MoneyButton)) {
        gr.lib._buy.show(false);
        gr.lib._try.show(true);
        gr.lib._movetomoneyButton.show(true);
      } else {
        gr.lib._buy.show(true);
        gr.lib._try.show(false);
      }
    }
  }

  function onStartUserInteraction() {
    inGame = true;
  }

  function onReStartUserInteraction() {
    inGame = true;
  }

  function onDisableUI() {
    gr.lib._movetomoneyButton.show(false);
  }

  function onGameParametersUpdated() {
    var scaleType = { 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true };
    buttonMTM = new gladButton(gr.lib._movetomoneyButton, 'AutospinButton', scaleType);
    buttonMTM.show(false);
    gr.lib._movetomoneyText.autoFontFitText = true;
    gr.lib._movetomoneyText.setText(loader.i18n.Game.button_move2moneyGame);
    buttonMTM.enable(false);
    gr.lib._movetomoneyText.updateCurrentStyle({ '_opacity': '0.3' });
    buttonMTM.click(function () {
      gr.lib._tryButton.show(false);
      gr.lib._movetomoneyButton.show(false);
      SKBeInstant.config.wagerType = 'BUY';
      msgBus.publish('jLotteryGame.playerWantsToMoveToMoneyGame');
      audio.play('UiClick', 0);
    });
  }

  function onEnterResultScreenState() {
    count++;
    inGame = false;
    gr.getTimer().setTimeout(function () {
      if (showWarn) {
        warnReset = true;
      } else {
        enableButton();
      }
    }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);

  }

  function onReInitialize() {
    inGame = false;
    enableButton();
  }

  function onTutorialIsShown() {
    if (inGame) {
      // gr.lib._tryButton.show(false);
    } else {
      enableButton();
    }
  }

  function onTutorialIsHide() {
    if (inGame) {
      // gr.lib._tryButton.show(false);
    } else {
      enableButton();
    }
  }

  function onDisableButton() {
    gr.lib._tryButton.show(false);
    gr.lib._buyButton.show(false);
    gr.lib._autospinButton.show(false);
    gr.lib._movetomoneyButton.show(false);
  }

  function wheelInit() {
    buttonMTM.enable(true);
    gr.lib._movetomoneyText.updateCurrentStyle({ '_opacity': '1' });
  }

  msgBus.subscribe('jLotterySKB.reset', function () {
    inGame = false;
    enableButton();
  });
  msgBus.subscribe('jLottery.reInitialize', onReInitialize);
  msgBus.subscribe('wheelInit', wheelInit);
  msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
  msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
  msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
  msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
  msgBus.subscribe('disableUI', onDisableUI);
  msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
  msgBus.subscribe('warnIsShown', function () {
    showWarn = true;
  });
  msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
  msgBus.subscribe('warnIsHide', function () {
    showWarn = false;
    if (warnReset) {
      warnReset = false;
      enableButton();
    }
  });

  msgBus.subscribe('disableButton', onDisableButton);

  return {};
});