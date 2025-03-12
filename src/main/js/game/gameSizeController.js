/**
 * @module GameSizeController
 * @description control the size of game element.
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'com/pixijs/pixi',
    'skbJet/component/resourceLoader/resourceLib',
    'game/gameUtils'
], function (msgBus, gr, SKBeInstant, PIXI, resLib, gameUtils) {

    var gameDiv = null;
    var needPortrait = false;
    var jLotteryDeskP = false;
    // var device = window.location.search.match(/&?assetPack=([^&]+)&?/)[1];
    var gameSizeMap = {};
    var SKBassetPack;


    function windowResized() {
        let winW, winH;
        if (SKBeInstant.isSKB()) {
            winW = Number(window.innerWidth);
            winH = Number(window.innerHeight);
            document.documentElement.style.width = winW + 'px';
            document.documentElement.style.height = winH + 'px';
            document.body.style.width = winW + 'px';
            document.body.style.height = winH + 'px';
            SKBeInstant.getGameContainerElem().style.width = winW + 'px';
            SKBeInstant.getGameContainerElem().style.height = winH + 'px';
        }else if(SKBeInstant.config.screenEnvironment === 'device'){
            winW = document.getElementById(SKBeInstant.config.targetDivId).clientWidth;
            winH = document.getElementById(SKBeInstant.config.targetDivId).clientHeight;
        }else if(jLotteryDeskP){
            winW = Number(SKBeInstant.config.revealWidthToUse);
            winH = Number(SKBeInstant.config.revealHeightToUse);
        }

        if (needPortrait) {
            var l2p = gr.animMap._landscape2portrait;
            if (winW < winH) {
                gr.setSize(gameSizeMap.portrait.w, gameSizeMap.portrait.h);
                l2p.updateStyleToTime(l2p.maxTime);
                // gr.lib._reelSetBaseBG.setImage("reelsFrameBG_P");
                gameUtils.fixMeter(gr, 'portrait');
            } else {
                gr.setSize(gameSizeMap.landscape.w, gameSizeMap.landscape.h);
                l2p.updateStyleToTime(0);
                // gr.lib._reelSetBaseBG.setImage("reelsFrameBG");
                gameUtils.fixMeter(gr, 'landscape');
            }
            msgBus.publish('changeBackgroundBGIfPortrait', winW < winH);
        }
        gr.fitSize(winW, winH);
    }

    function isMobile() {
        var check = false;
        (function(a){
          if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) 
            check = true;
        })(navigator.userAgent||navigator.vendor||window.opera);
        return check;
      }

    function onBeforeShowStage() {
		gameDiv = document.getElementById('game') || document.getElementById(SKBeInstant.config.targetDivId);
        //playBGAnim();
        needPortrait = needPortrait && (gr.animMap._landscape2portraitTemplate ? true : false);
        
        if(SKBeInstant.isSKB() || SKBeInstant.config.screenEnvironment === 'device' || jLotteryDeskP){
            if (needPortrait) {
                let device;
                if (SKBeInstant.isSKB()) {
                    device = SKBassetPack;
                } else {//tell mobile or tablet in jLottery
                    device = isMobile() ? "mobile" : "tablet";
                }
                var r = gr.getPixiRenderer();
                var w, h;
                if(SKBeInstant.isSKB() || SKBeInstant.config.screenEnvironment === 'device' || jLotteryDeskP){
                    w = Number(r.view.width);
                    h = Number(r.view.height);
                    if(w < h){
                        gameSizeMap.landscape = { w: h, h: w };
                        gameSizeMap.portrait = { w: w, h: h};
                    }else{
                        gameSizeMap.portrait = { w: h, h: w };
                        gameSizeMap.landscape = { w: w, h: h};
                    }
                }else{
                    h = Number(SKBeInstant.config.revealHeightToUse);
                    w = Number(SKBeInstant.config.revealWidthToUse);
                    gameSizeMap.landscape = { w: h, h: w };
                }
    
                if (device === 'mobile') {
                    // gameSizeMap.portrait = { w: w, h: Math.floor(h * 0.9) };
                    //gameSizeMap.portrait = { w: w, h: h};
                } else {
                    // gameSizeMap.portrait = { w: w, h: Math.floor(h * 0.75) };
                    //gameSizeMap.portrait = { w: w, h: h};
                } 
                var portraitContainerList = [];
    
                var tmpNameList = gr.animMap._landscape2portraitTemplate._spritesNameList;
                for (var i = 0; i < tmpNameList.length; i++) {
                    var mc = tmpNameList[i].match(/^_portrait_(.*)$/);
                    if (mc) {
                        portraitContainerList.push('_' + mc[1]);
                    } else {
                        portraitContainerList.push(tmpNameList[i]);
                        console.error('Wrong portraitTemplate sprite, name not start with "_portrait_".');
                    }
                }
                gr.animMap._landscape2portraitTemplate.clone(portraitContainerList, '_landscape2portrait');
            }
            gameDiv.width = window._gladData._width * 2;
            gameDiv.height = window._gladData._height * 2;
            windowResized();
            if(SKBeInstant.isSKB() || SKBeInstant.config.screenEnvironment === 'device'){
                window.addEventListener('resize',windowResized);
            }
		}else{
            gr.fitSize(Number(SKBeInstant.config.revealWidthToUse), Number(SKBeInstant.config.revealHeightToUse));
        }
        
        
    }

    function onSystemInit(data){
        if(data.serverConfig.channel!=='INT'&&data.serverConfig.presenttype==='STD'){
            needPortrait = true;
        }
        switch(data.serverConfig.channel){
            case "INT":
                SKBassetPack = "desktop";
                break;
            case "MOB":
                SKBassetPack = "mobile";
                break;
            case "TAB":
                SKBassetPack = "tablet";
                break;
            default:
                SKBassetPack = "desktop";

        }
    }

    function onGameParametersUpdated(){
        if(!SKBeInstant.isSKB()){
            if(SKBeInstant.config.assetPack !== "desktop" || SKBeInstant.config.screenEnvironment === 'device'){
                needPortrait = true;
            }else{
                if(Number(SKBeInstant.config.revealWidthToUse) < Number(SKBeInstant.config.revealHeightToUse)){
                    needPortrait = true;
                    jLotteryDeskP = true;
                }
            }
            onBeforeShowStage();
        }

       
    }

    msgBus.subscribe('platformMsg/Kernel/System.Init', onSystemInit);
	//msgBus.subscribe('jLotteryGame.assetsLoadedAndGameReady', onAssetsLoadedAndGameReady);
    msgBus.subscribe('onBeforeShowStage', onBeforeShowStage);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);

    return {};
});