"use strict";

/**
 * @module game/meters
 * @description meters control
 */
define(['skbJet/component/gameMsgBus/GameMsgBus', 'skbJet/component/gladPixiRenderer/gladPixiRenderer', 'skbJet/component/pixiResourceLoader/pixiResourceLoader', 'skbJet/component/SKBeInstant/SKBeInstant'], function (msgBus, gr, loader, SKBeInstant) {
  var winningSymbolNum = 0;
  var PrizeArr = [];
  var winValue;

  function onTicketCostChanged(prizePoint) {
    var rc = SKBeInstant.config.gameConfigurationDetails.revealConfigurations;
    PrizeArr = [];
    rc.forEach(function (item, index) {
      if (item.price === prizePoint) {
        item.prizeTable.forEach(function (items, indexs) {
          if (indexs < 10) {
            PrizeArr.push(items.prize);
          }
        });
      }
    });
    PrizeArr.forEach(function (item, index) {
      if (index < 6) {
        gr.lib['_value_Text_' + index].autoFontFitText = true;
        gr.lib['_value_Text_' + index].setText(SKBeInstant.formatCurrency(item).formattedAmount);
      }
    });
  }

  function onWinningSymbolReveal() {
    winningSymbolNum++;

    for (var i = 1; i < 11; i++) {
      gr.lib['_prizeWinBox_' + i].show(false);
    }

    if (winningSymbolNum > 3) {
      if (PrizeArr[13 - winningSymbolNum] > winValue) {
        msgBus.publish('winboxError', {
          errorCode: '29000'
        });
      } else {
        msgBus.publish('getBaseValue', {
          value: PrizeArr[13 - winningSymbolNum]
        });
        msgBus.publish('updateWinValue', {
          value: PrizeArr[13 - winningSymbolNum]
        });
      }

      gr.lib['_prizeWinBox_' + [winningSymbolNum - 3]].show(true);
    }
  }

  function resetAll() {
    winningSymbolNum = 0;

    for (var i = 1; i < 11; i++) {// gr.lib['_prizeWinBox_'+i].show(false);
    }
  }

  function onStartUserInteraction(data) {
    if (data.scenario) {
      winValue = data.prizeValue;
    } else {
      return;
    }
  }

  function onReStartUserInteraction(data) {
    onStartUserInteraction(data);
  }

  msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
  msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction); // msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);

  msgBus.subscribe('ticketCostChanged', onTicketCostChanged);
  msgBus.subscribe('jLottery.reInitialize', resetAll);
  msgBus.subscribe('resetAll', resetAll);
  msgBus.subscribe('WinningSymbolReveal', onWinningSymbolReveal);
  return {};
});
//# sourceMappingURL=prizeTableController.js.map
