/**
 * @module game/tutorialController
 * @description result dialog control
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'game/utils/gladButton',
    'game/utils/TextMatchToImages',
    'skbJet/component/SKBeInstant/SKBeInstant',
], function(msgBus, audio, gr, loader, gladButton, TextMatchToImages, SKBeInstant) {
    var buttonInfo, buttonClose;
    var left, right;
    var index = 0,
        minIndex = 0,
        maxIndex = 2;
    let channel;
    var shouldShowTutorialWhenReinitial = false;
    var showTutorialAtBeginning = false;
    var warnShown = false;
    var warnReset = false;
    let isPortrait = false;
    const pageTextStyle = {
        'portrait': {
            fontFamily: 'Oswald',
            fontWeight: "400",
            fill: "#ffffff",
            padding: 2,
            fontSize: 28,
            "lineJoin": "round",
        },
        'landscape': {
            fontFamily: 'Oswald',
            fontWeight: "400",
            fill: "#ffffff",
            padding: 2,
            fontSize: 34,
            "lineJoin": "round",
        }
    };
    const textConvertImageMap = {
        'T01': 'icon2x',
        'T02': "icon3x",
        'T03': "expand_L",
        'T04': "freespin_L",
        'T05': "IW_L",
        'T06': "king_L",
    };

    function onSystemInit(data) {
        channel = data.serverConfig.channel;
    }

    function showTutorial() {
        showTutorialPageByIndex(0);
        gr.lib._BG_dim.off('click');
        buttonInfo.show(false);
        gr.lib._BG_dim.show(true);
        gr.lib._tutorial.show(true);
        msgBus.publish('tutorialIsShown');
    }

    function hideTutorial() {
        gr.lib._tutorial.show(false);
        buttonInfo.show(true);
        gr.lib._BG_dim.show(false);
        msgBus.publish('tutorialIsHide');
        index = 0;
    }

    function onBeforeShowStage() {
        const orientation = SKBeInstant.getGameOrientation();
        gr.lib._versionText.autoFontFitText = true;
        gr.lib._versionText.setText(window._cacheFlag.gameVersion + ".CL" + window._cacheFlag.changeList + "_" + window._cacheFlag.buildNumber);
        // Prevent click the symbols when tutorial is shown
        gr.lib._BG_dim.on('click', function(event) {
            event.stopPropagation();
        });
        if (SKBeInstant.isWLA()) {
            gr.lib._versionText.show(true);
        } else {
            gr.lib._versionText.show(false);
        }
        var options = { 'avoidMultiTouch': true, 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92 };
        buttonInfo = new gladButton(gr.lib._tutorialButton, "tutorialButton", options);
        buttonClose = new gladButton(gr.lib._buttonCloseTutorial, "okButton", options);
        left = new gladButton(gr.lib._tutorialLeftButton, "tutorialLeftButton", options);
        right = new gladButton(gr.lib._tutorialRightButton, "tutorialRightButton", options);
        if (SKBeInstant.config.customBehavior) {
            if (SKBeInstant.config.customBehavior.showTutorialAtBeginning === true) {
                showTutorialAtBeginning = true;
            }
        } else if (loader.i18n.gameConfig) {
            if (loader.i18n.gameConfig.showTutorialAtBeginning === true) {
                showTutorialAtBeginning = true;
            }
        }
        if (showTutorialAtBeginning === false) {
            buttonInfo.show(true);
            gr.lib._BG_dim.show(false);
            gr.lib._tutorial.show(false);
        } else {
            buttonInfo.show(false);
            gr.lib._BG_dim.show(true);
            gr.lib._tutorial.show(true);
        }
        buttonInfo.click(function() {
            showTutorial();
            audio.play('UiClick', 0);
        });
        buttonClose.click(function() {
            hideTutorial();
            audio.play('UiClick', 0);
        });
        left.click(function() {
            index--;
            if (index < minIndex) {
                index = maxIndex;
            }
            showTutorialPageByIndex(index);
            audio.play('UiClick', 0);
        });
        right.click(function() {
            index++;
            if (index > maxIndex) {
                index = minIndex;
            }
            showTutorialPageByIndex(index);
            audio.play('UiClick', 0);
        });
        initTutorial();
        updateTutorial(orientation === "portrait");
        gr.lib._tutorialTitleText.autoFontFitText = true;
        gr.lib._tutorialTitleText.setText(loader.i18n.Game.tutorial_title);
        gr.lib._closeTutorialText.autoFontFitText = true;
        gr.lib._closeTutorialText.setText(loader.i18n.Game.message_close);
        gr.lib._tutorialPage_01.pixiContainer.$text._style.leading = 10;
    }

    function updateTutorial(orientation) {
        isPortrait = orientation;
        showTutorialPageByIndex(index);
    }

    function showTutorialPageByIndex(index) {
        for (var i = 0; i <= maxIndex; i++) {
            if (i === index) {
                if (channel === "INT") {
                    gr.lib['_tutorialPage_0' + index].show(true);
                } else {
                    if (isPortrait) {
                        gr.lib['_tutorialPage_0' + index + '_P'].show(true);
                    } else {
                        gr.lib['_tutorialPage_0' + index].show(true);
                    }
                }
                gr.lib['_tutorialLightIconOn' + (index + 1)].setImage('tutorialLightIconOn');
            } else {
                gr.lib['_tutorialPage_0' + i].show(false);
                gr.lib['_tutorialPage_0' + i + '_P'].show(false);
                gr.lib['_tutorialLightIconOn' + (i + 1)].setImage('tutorialLightIconOff');
            }
        }
    }

    function onReInitialize() {
        if (shouldShowTutorialWhenReinitial) {
            shouldShowTutorialWhenReinitial = false;
            if (showTutorialAtBeginning) {
                showTutorial();
            } else {
                msgBus.publish('tutorialIsHide');
            }
        } else {
            gr.lib._tutorial.show(false);
            buttonInfo.show(true);
            buttonInfo.enable(true);
            enableConsole();
        }
    }

    function hiddenInfo() {
        buttonInfo.enable(false);
        disableConsole();
    }

    function appearInfo() {
        buttonInfo.enable(true);
        enableConsole();
    }

    function onEnableUI() {
        // gr.lib._tutorialButton.show(true);
        buttonInfo.enable(true);
        enableConsole();
    }

    function showTutorialOnInitial() {
        buttonInfo.show(false);
        gr.lib._BG_dim.show(true);
        gr.lib._tutorial.show(true);
        msgBus.publish('tutorialIsShown');
    }

    function onInitialize() {
        if (showTutorialAtBeginning) {
            showTutorialOnInitial();
        } else {
            msgBus.publish('tutorialIsHide');
        }
    }

    function onReStartUserInteraction() {
        buttonInfo.show(true);
    }

    function onStartUserInteraction() {
        if (SKBeInstant.config.gameType === 'ticketReady') {
            if (showTutorialAtBeginning) {
                showTutorialOnInitial();
            } else {
                msgBus.publish('tutorialIsHide');
            }
        } else {
            gr.lib._tutorial.show(false);
            buttonInfo.show(true);
        }
    }

    function onDisableUI() {
        buttonInfo.enable(false);
        disableConsole();
    }

    function initTutorial() {
        new TextMatchToImages(gr.lib._tutorialPage_00, loader.i18n.Game.tutorial.tutorialPage, pageTextStyle['landscape'], textConvertImageMap).updateStyle();
        new TextMatchToImages(gr.lib._tutorialPage_01, loader.i18n.Game.tutorial.tutorialPage01, pageTextStyle['landscape'], textConvertImageMap).updateStyle();
        new TextMatchToImages(gr.lib._tutorialPage_02, loader.i18n.Game.tutorial.tutorialPage02, pageTextStyle['landscape'], textConvertImageMap).updateStyle();
        new TextMatchToImages(gr.lib._tutorialPage_00_P, loader.i18n.Game.tutorial.tutorialPage, pageTextStyle['portrait'], textConvertImageMap).updateStyle();
        new TextMatchToImages(gr.lib._tutorialPage_01_P, loader.i18n.Game.tutorial.tutorialPage01, pageTextStyle['portrait'], textConvertImageMap).updateStyle();
        new TextMatchToImages(gr.lib._tutorialPage_02_P, loader.i18n.Game.tutorial.tutorialPage02, pageTextStyle['portrait'], textConvertImageMap).updateStyle();
    }

    function onEnterResultScreenState() {
        gr.getTimer().setTimeout(function() {
            if (warnShown) {
                warnReset = true;
            } else {
                // buttonInfo.enable(true);
                enableConsole();
            }
        }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);
    }

    function onPlayerWantsToMoveToMoneyGame() {
        shouldShowTutorialWhenReinitial = true;
    }

    function onOrientationChanged(portrait) {
        updateTutorial(portrait);
    }

    function disableConsole() {
        msgBus.publish('toPlatform', {
            channel: "Game",
            topic: "Game.Control",
            data: {
                "name": "howToPlay",
                "event": "enable",
                "params": [0]
            }
        });
        msgBus.publish('toPlatform', {
            channel: "Game",
            topic: "Game.Control",
            data: {
                "name": "paytable",
                "event": "enable",
                "params": [0]
            }
        });
    }

    function enableConsole() {
        msgBus.publish('toPlatform', {
            channel: "Game",
            topic: "Game.Control",
            data: {
                "name": "howToPlay",
                "event": "enable",
                "params": [1]
            }
        });
        msgBus.publish('toPlatform', {
            channel: "Game",
            topic: "Game.Control",
            data: {
                "name": "paytable",
                "event": "enable",
                "params": [1]
            }
        });
    }

    var onBeforeShowStagemsgBusCallback = SKBeInstant.isSKB() ? 'onBeforeShowStage' :'SKBeInstant.gameParametersUpdated';

    msgBus.subscribe('platformMsg/Kernel/System.Init', onSystemInit);
    msgBus.subscribe('jLotterySKB.reset', onEnableUI);
    msgBus.subscribe('enableUI', onEnableUI);
    msgBus.subscribe('disableUI', onDisableUI);
    msgBus.subscribe('hiddenInfo', hiddenInfo);
    msgBus.subscribe('appearInfo', appearInfo);
    msgBus.subscribe('jLottery.initialize', onInitialize);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('changeBackgroundBGIfPortrait', onOrientationChanged);
    msgBus.subscribe(onBeforeShowStagemsgBusCallback, onBeforeShowStage);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame', onPlayerWantsToMoveToMoneyGame);
    msgBus.subscribe("playerWantsPlayAgain", appearInfo);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('warnIsShown', function() {
        warnShown = true;
    });
    msgBus.subscribe('warnIsHide', function() {
        warnShown = false;
        if (warnReset) {
            warnReset = false;
            buttonInfo.show(true);
        }
    });
    return {};
});