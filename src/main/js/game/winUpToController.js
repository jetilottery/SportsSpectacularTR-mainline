/**
 * @module game/winUpToController
 * @description WinUpTo control
 */
define(['skbJet/component/gameMsgBus/GameMsgBus',
  'skbJet/component/gladPixiRenderer/gladPixiRenderer',
  'skbJet/component/pixiResourceLoader/pixiResourceLoader',
  'skbJet/component/SKBeInstant/SKBeInstant',
  '../game/gameUtils',
  'skbJet/component/gladPixiRenderer/KeyFrameAnimation',
  '../game/utils/tweenFunctions',
], function (msgBus, gr, loader, SKBeInstant, gameUtils, KeyFrameAnimation, TweenFunctions) {

  let winUpToKeyFrame = null, zooming = false, currentStake = 0;
  let contCopy;

  function onGameParametersUpdated() {
    gr.lib._winUpToText.autoFontFitText = true;
    gr.lib._winUpToText.setText(loader.i18n.Game.win_up_to);
    gr.lib._winUpToValue.autoFontFitText = true;
    let spriteData = gr.lib._winUpTo.getData();
    spriteData = Object.assign({}, spriteData);
    spriteData = formatSpriteData(spriteData);
    contCopy = gr.lib._winUpTo.getParent().addChildFromData(spriteData);
    winUpToKeyFrame = new KeyFrameAnimation({
      "_name": 'winUpToKeyframeAnim',
      "tweenFunc": TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
      "_keyFrames": [
        {
          "_time": 0,
          "_SPRITES": []
        },
        {
          "_time": 250,
          "_SPRITES": []
        }
      ]
    });
    winUpToKeyFrame._onUpdate = function(timeDelta){
       KeyFrameAnimationOnUpdate(timeDelta,winUpToKeyFrame);
    };
    winUpToKeyFrame._onComplete = function(){
       KeyFrameAnimationOnComplete();
    };
  }

  function KeyFrameAnimationOnUpdate(timeDelta,keyFrameAnim) {
    const tweenFunc = keyFrameAnim.animData.tweenFunc;
    const duration = keyFrameAnim.maxTime;
    timeDelta = Math.ceil(timeDelta);
    const real_opacity = tweenFunc(timeDelta, 0, 1, duration);
    const copy_opacity = tweenFunc(timeDelta, 1, 0, duration);
    let real_scale = 0, copy_scale = 0;
    if (zooming) {
      real_scale = tweenFunc(timeDelta, 0, 1, duration);
      copy_scale = tweenFunc(timeDelta, 1, 1.5, duration);
    }
    else {
      real_scale = tweenFunc(timeDelta, 1.5, 1, duration);
      copy_scale = tweenFunc(timeDelta, 1, 0, duration);
    }
    gr.lib._winUpTo.updateCurrentStyle({ "_opacity": real_opacity, _transform: { _scale: { _x: real_scale, _y: real_scale } } });
    contCopy.updateCurrentStyle({ "_opacity": copy_opacity, _transform: { _scale: { _x: copy_scale, _y: copy_scale } } });
  }

  function KeyFrameAnimationOnComplete(){
    gr.lib[gr.lib._winUpToText.getName()+'_copy'].setText(loader.i18n.Game.win_up_to);
    gr.lib[gr.lib._winUpToValue.getName()+'_copy'].setText(gr.lib._winUpToValue.getText());
  }

  function formatSpriteData(sourceObj){
        sourceObj._id += '_copy';
        sourceObj._name += '_copy';
        if(sourceObj._SPRITES.length){
            const tempSpriteArr = sourceObj._SPRITES;
            sourceObj._SPRITES = [];
            for( let sobj of tempSpriteArr){
                sourceObj._SPRITES.push(formatSpriteData(Object.assign({}, sobj)));
            }
        }
        return sourceObj;
    }
  function onTicketCostChanged(prizePoint) {
    var rc = SKBeInstant.config.gameConfigurationDetails.revealConfigurations;
    zooming = ((prizePoint * 1) > currentStake);
    currentStake = prizePoint * 1;
    for (var i = 0; i < rc.length; i++) {
      if (Number(prizePoint) === Number(rc[i].price)) {
        var ps = rc[i].prizeStructure;
        var maxPrize = 0;
        for (var j = 0; j < ps.length; j++) {
          var prize = Number(ps[j].prize);
          if (maxPrize < prize) {
            maxPrize = prize;
          }
        }
        if (gr.lib._winUpToValue.getText() !== SKBeInstant.formatCurrency(maxPrize).formattedAmount + loader.i18n.Game.win_up_to_mark) {
          winUpToKeyFrame.play();
          gr.lib._winUpToValue.setText(SKBeInstant.formatCurrency(maxPrize).formattedAmount + loader.i18n.Game.win_up_to_mark);
        }
        break;
      }
    }
  }
  msgBus.subscribe('ticketCostChanged', onTicketCostChanged);
  msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
  return {};
});
