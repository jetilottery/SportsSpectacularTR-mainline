/**
 * @module game/buyAndTryController
 * @description buy and try button control
 */
define(['skbJet/component/gameMsgBus/GameMsgBus',
  'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
  'skbJet/component/gladPixiRenderer/gladPixiRenderer',
  'skbJet/component/pixiResourceLoader/pixiResourceLoader',
  'skbJet/component/SKBeInstant/SKBeInstant',
  'game/utils/gladButton',
  'skbJet/component/resourceLoader/resourceLib',
  './gameUtils',
  './configController',
], function (msgBus, audio, gr, loader, SKBeInstant, gladButton, resLib, gameUtils, config) {
  var currentTicketCost = null;
  var replay, tryButton, buyButton;
  var MTMReinitial = false;
  let buyFlashAnim = null;
  let spineStyle = null;
  function onGameParametersUpdated() {
    spineStyle = config.spineStyle;
    var scaleType = {
      'scaleXWhenClick': 0.92,
      'scaleYWhenClick': 0.92,
      'avoidMultiTouch': true
    };
    tryButton = new gladButton(gr.lib._tryButton, "BuyButton", scaleType);
    buyButton = new gladButton(gr.lib._buyButton, "BuyButton", scaleType); // gr.lib._buttonBuyLight.gotoAndPlay('BuyButtonAnim',0.5,false);
    gr.lib._buyButton.show(false);
    gr.lib._tryButton.show(false); // gr.lib._buttonExit.show(false);
    gr.lib._autospinButton.show(false);
    gr.lib._movetomoneyButton.show(false); // gr.lib._buttonAutoPlay.show(false);
    gr.lib._network.show(false);
    replay = false;
    gr.lib._buyText.autoFontFitText = true;
    if (SKBeInstant.config.wagerType === 'BUY') {
      gr.lib._buyText.setText(loader.i18n.Game.button_buy);
    } else {
      gr.lib._buyText.setText(loader.i18n.Game.button_try);
    }
    gr.lib._tryText.autoFontFitText = true;
    gr.lib._tryText.setText(loader.i18n.Game.button_try);
    tryButton.enable(false);
    buyButton.enable(false);
    gr.lib._buyText.updateCurrentStyle({ '_opacity': '0.3' });
    gr.lib._tryText.updateCurrentStyle({ '_opacity': '0.3' });
    tryButton.click(play);
    buyButton.click(play);
    buyFlashAnim = new PIXI.spine.Spine(resLib.spine.EmotiCollect_ui.spineData);

    gameUtils.setSpineStyle(buyFlashAnim, spineStyle['buyFlashAnim'], 'buyFlashAnim');
    gr.lib._buyButton.pixiContainer.addChildAt(buyFlashAnim, 1);
  }

  function play() {
    msgBus.publish('clickBuyTicket');
    if (replay) {
      msgBus.publish('resetAll');
      msgBus.publish('jLotteryGame.playerWantsToRePlay', {
        price: currentTicketCost
      });
    } else {
      msgBus.publish('jLotteryGame.playerWantsToPlay', {
        price: currentTicketCost
      });
    }
    gr.lib._buyButton.show(false);
    gr.lib._tryButton.show(false);
    gr.lib._network.show(true);
    gr.lib._network.gotoAndPlay('networkActivity', 0.3, true);
    audio.play('UiBuy', 0);
    msgBus.publish('disableUI');
  }

  function onStartUserInteraction(data) {
    gr.lib._network.stopPlay();
    gr.lib._network.show(false);
    gr.lib._buyButton.show(false);
    gr.lib._tryButton.show(false);
    currentTicketCost = data.price;
    msgBus.publish('enableUI');
    replay = true;
  }

  function showBuyOrTryButton() {
    if (SKBeInstant.config.jLotteryPhase !== 2) {
      return;
    }
    gr.lib._buyButton.show(true); 
    gr.lib._tryButton.show(true);
  }

  function onInitialize() {
    showBuyOrTryButton();
  }

  function onTicketCostChanged(data) {
    currentTicketCost = data;
  }

  function onReInitialize() {
    gr.lib._network.stopPlay();
    gr.lib._network.show(false);
    if (MTMReinitial) {
      replay = false;
      gr.lib._buyText.setText(loader.i18n.Game.button_buy);
      MTMReinitial = false;
    }
    showBuyOrTryButton();
  }

  function onPlayerWantsPlayAgain() {
    showBuyOrTryButton();
  }

  function onReStartUserInteraction() {
    gr.lib._network.stopPlay();
    gr.lib._network.show(false);
    msgBus.publish('enableUI');
  }

  function onPlayerWantsToMoveToMoneyGame() {
    MTMReinitial = true;
  }

  function onReset() {
    gr.lib._network.stopPlay();
    gr.lib._network.show(false);
    showBuyOrTryButton();
  }

  function onGameInit(data) {
    var gameLogicResponse = data.GameLogicResponse;
    var paytableResponse = null;
    if (data && data.PaytableResponse) {
      paytableResponse = data.PaytableResponse;
    }
    if (gameLogicResponse.PromotionalFreeSpin) {
      isPFS = true;
      pfsCurrentTicketCost = paytableResponse[0].prizeDetails[0].price;
    }
  }
  function wheelInit() {
    buyFlashAnim.state.setAnimation(0, "button_idle", true);
    tryButton.enable(true);
    buyButton.enable(true);
    gr.lib._buyText.updateCurrentStyle({ '_opacity': '1'});
    gr.lib._tryText.updateCurrentStyle({ '_opacity': '1'});
  }

  msgBus.subscribe('platformMsg/ClientService/Game.Init', onGameInit);
  msgBus.subscribe('platformMsg/ClientService/Game.ReInit', onGameInit);
  msgBus.subscribe('jLotterySKB.reset', onReset);
  msgBus.subscribe("playerWantsPlayAgain", onPlayerWantsPlayAgain);
  msgBus.subscribe('jLottery.reInitialize', onReInitialize);
  msgBus.subscribe('jLottery.initialize', onInitialize);
  msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
  msgBus.subscribe('ticketCostChanged', onTicketCostChanged);
  msgBus.subscribe('wheelInit', wheelInit);
  msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
  msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
  msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame', onPlayerWantsToMoveToMoneyGame);
  return {};
});
