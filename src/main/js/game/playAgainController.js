/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/**
 * @module game/exitButton
 * @description exit button control
 */
define([
  'skbJet/component/gameMsgBus/GameMsgBus',
  'skbJet/component/gladPixiRenderer/gladPixiRenderer',
  'skbJet/component/SKBeInstant/SKBeInstant',
], function (msgBus, gr, SKBeInstant,) {

  function onEnterResultScreenState() {
    if (SKBeInstant.config.jLotteryPhase === 2) {
      gr.getTimer().setTimeout(function () {
        msgBus.publish('playerWantsPlayAgain');
        // gr.lib._buttonPlayAgain.show(true);
      }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);
    }else if(SKBeInstant.config.jLotteryPhase === 1){
      gr.getTimer().setTimeout(function () {
        msgBus.publish('appearInfo');
      }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);
    }
  }

  msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);

  return {};
});