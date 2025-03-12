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
    './configController',
    'skbJet/component/resourceLoader/resourceLib',
    './gameUtils',
    'skbJet/componentCRDC/gladRenderer/Tween'
], function (msgBus, audio, gr, loader, SKBeInstant, gladButton, config, resLib, gameUtils, Tween) {

    // ！！！！！！！
    // Must see
    // Due to the intermediate stage of PA, the requirements are adjusted in terms of gameplay. 
    // The first data of Scenario is changed to initialize data, 
    // but it will be changed to autospin in the background

    var prizeTable = {}, jackpot = 0, winValue = 0;
    var spinButton = null, stopButton = null, autoSpinButton = null;
    let spinLeftText = 3;
    let running = false, isinit = false;
    let spinIndex = -1;
    let spineStyle = null;
    let bonusData = null;
    let lastKingPostion = null;
    let splitArray = null;
    let AutoSpinIntervalBonus;
    const emotiImg = ['Blue', 'Green', 'Pink', 'Purple', 'Red', 'Yellow', 'King'];
    const initEmotiImg = ['Blue', 'Green', 'Pink', 'Purple', 'Red', 'Yellow'];
    const purposeImg = ['King', 'King', 'King', 'King'];
    const dataComparison = { 'A': 'Purple', 'B': 'Pink', 'C': 'Red', 'D': 'Yellow', 'E': 'Green', 'F': 'Blue', 'L': 'King' };
    const slotTextures = [];
    const initSlotTextures = [];
    const purposeTextures = [];
    const REEL_SIZE = 130;
    const SYMBOL_SIZE = 110;
    const SYMBOL_SPACE = 40;
    const REEL_SPACE = 20;
    const tweening = [];
    let reels = [];
    const reelContainer = new PIXI.Container();
    let validSet = null, tempTicketArr;
    let bonusTicket = [];
    let bonusAnim = ['temp'], bonusAnimName = ['temp'];
    let bonusSpinBoxAnim = null, isAutoSpin = false, bonusEmotiAnimTimer = null, baseTransitionAnim = null;
    const landscapeMask = new PIXI.Graphics().beginFill(0xffffff).drawRect(440, 0, 592, 800).endFill();
    const portraitMask = new PIXI.Graphics().beginFill(0xffffff).drawRect(110, 0, 592, 1600).endFill();
    let colorMap = new Map([['Purple', 'BaseSpinStopSymbol1'], ['Pink', 'BaseSpinStopSymbol2'], ['Red', 'BaseSpinStopSymbol3'], ['Yellow', 'BaseSpinStopSymbol4']
        , ['Green', 'BaseSpinStopSymbol5'], ['Blue', 'BaseSpinStopSymbol6'], ['Bonus', 'BaseSpinStopSymbolBonus']]);
    let channel;

    function onSystemInit(data) {
        channel = data.serverConfig.channel;
    }

    function onGameParametersUpdated() {
        spineStyle = config.spineStyle;
        setAutoFontFitText();
        fillWords();
        initialTexture();
        initialBonusGame();
        var scaleType = {
            'scaleXWhenClick': 0.92,
            'scaleYWhenClick': 0.92,
            'avoidMultiTouch': true
        };
        spinButton = new gladButton(gr.lib._bonusSpinbutton, "bonusspinButton", scaleType);
        stopButton = new gladButton(gr.lib._stopButton, "bonusspinButton", scaleType);
        autoSpinButton = new gladButton(gr.lib._bonusAutospinbutton, "bonusspinButton", scaleType);
        stopButton.show(false);
        spinButton.click(startPlay);
        stopButton.click(stopAutoSpin);
        autoSpinButton.click(autoSpin);
        if (SKBeInstant.config.customBehavior) {
            AutoSpinIntervalBonus = Number(SKBeInstant.config.customBehavior.AutoSpinIntervalBonus) || 1500;
        } else if (loader.i18n.gameConfig) {
            AutoSpinIntervalBonus = Number(loader.i18n.gameConfig.AutoSpinIntervalBonus) || 1500;
        } else {
            AutoSpinIntervalBonus = 1500;
        }
        if (SKBeInstant.config) {
            if (!SKBeInstant.config.autoRevealEnabled) {
                haveReveal = false;
            }
        }
        gr.getTicker().add((delta) => {
            const remove = [];
            for (let i = 0; i < tweening.length; i++) {
                const t = tweening[i];
                t.timeDiff += 17;  //16.66666666
                const phase = Math.min(1, t.timeDiff / t.time);
                t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
                if (t.change) t.change(t);
                if (phase === 1) {
                    t.object[t.property] = t.target;
                    if (t.complete) t.complete(t);
                    remove.push(t);
                }
            }
            for (let i = 0; i < remove.length; i++) {
                tweening.splice(tweening.indexOf(remove[i]), 1);
            }

            for (let i = 0; i < reels.length; i++) {
                const r = reels[i];
                // Update blur filter y amount based on speed.
                // This would be better if calculated with time in mind also. Now blur depends on frame rate.
                r.blur.blurY = (r.position - r.previousPosition) * 8;
                r.previousPosition = r.position;
                // Update symbol positions on reel.
                for (let j = 0; j < r.symbols.length; j++) {
                    const s = r.symbols[j];
                    const prevX = s.x;
                    // s.x = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
                    if (r.direction > 0) {
                        s.x = ((r.position + j) % r.symbols.length) * (SYMBOL_SIZE + SYMBOL_SPACE) - (SYMBOL_SIZE + SYMBOL_SPACE);
                    } else {
                        s.x = (4 - ((4 - j) + r.position) % 5) * (SYMBOL_SIZE + SYMBOL_SPACE);
                    }
                    if ((s.x < 0 && prevX > (SYMBOL_SIZE + SYMBOL_SPACE)) || (s.x > (SYMBOL_SIZE + SYMBOL_SPACE) && prevX < 0)) {
                        // Detect going over and swap a texture.
                        // This should in proper product be determined from some logical reel.
                        let diff = Math.round(r.target - r.position);
                        if (diff > 4 || diff === 0) {
                            s.texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
                        } else {
                            // s.texture = purposeTextures[diff - 1];
                            s.texture = PIXI.Texture.fromFrame(bonusTicket[spinIndex][i][diff - 1]);
                        }
                        s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.width, SYMBOL_SIZE / s.texture.height);
                    }
                }
            }
        });
    }

    function resetAll() {
        bonusAnimName = ['temp'];
        jackpot = 0;
        winValue = 0;
        isAutoSpin = false;
        lastKingPostion = 0;
        isinit = false;
        bonusTicket = [];
        reels = [];
        spinIndex = -1;
        for (let index = 0; index < 13; index++) {
            gr.lib['_priceBonusWin_' + index].show(false);
        }
        gr.lib._bonusSpinbutton.show(true);
        gr.lib._bonusAutospinbutton.show(true);
        gr.lib._stopButton.show(false);
        autoSpinButton.enable(true);
        spinButton.enable(true);
        gr.lib._bonusSpintext.updateCurrentStyle({ '_opacity': '1' });
        gr.lib._bonusAutospintext.updateCurrentStyle({ '_opacity': '1' });
        spinLeftText = 3;
        gr.lib._bonusSpinleft_text_0.setText(spinLeftText);
        for (let index = 1; index < 17; index++) {
            gr.lib['_a_anim_' + index].show(false);
            gr.lib['_a_' + index].pixiContainer.children[0].visible = false;
            gr.lib['_a_' + index].pixiContainer.children[1].visible = false;
            gr.lib['_a_' + index].pixiContainer.children[2].visible = false;
        }
        reelContainer.removeChildren();
        buildRells();
    }

    function autoSpin() {
        startPlay();
        gr.lib._bonusAutospinbutton.show(false);
        gr.lib._stopButton.show(true);
        isAutoSpin = true;
    }


    function stopAutoSpin() {
        isAutoSpin = false;
        audio.play('UiClick', 0);
        gr.lib._stopButton.show(false);
        gr.lib._bonusAutospinbutton.show(true);
    }

    function HandleTicket() {
        tempTicketArr = [];
        bonusData.forEach(function (item, indexs) {
            let temp = item.split('');
            tempTicketArr[indexs] = [];
            for (let index = 0; index < temp.length; index++) {
                tempTicketArr[indexs].push(dataComparison[temp[index]]);
            }
        });
        tempTicketArr.forEach(function (item, index) {
            bonusTicket[index] = [[], [], [], []];
            for (let indexs = 0; indexs < 4; indexs++) {
                bonusTicket[index][indexs] = item.slice(indexs * 4, (indexs + 1) * 4);
            }
        });
        bonusTicket.forEach(function (item, index) {
            item.forEach(function (items, indexs) {
                if (indexs % 2 === 1) {
                    items.reverse();
                }
            });
        });
        startPlay();
    }

    function initialTexture() {
        emotiImg.forEach(function (item, index) {
            slotTextures[index] = PIXI.Texture.fromFrame(item);
        });
        initEmotiImg.forEach(function (item, index) {
            initSlotTextures[index] = PIXI.Texture.fromFrame(item);
        });
        purposeImg.forEach(function (item, index) {
            purposeTextures[index] = PIXI.Texture.fromFrame(item);
        });
    }

    function initialBonusGame() {
        bonusSpinBoxAnim = new PIXI.spine.Spine(resLib.spine.EmotiCollect_ui.spineData);
        gameUtils.setSpineStyle(bonusSpinBoxAnim, spineStyle['spinBoxAnim'], 'spinBoxAnim1');
        gr.lib._bonusSpinleft.pixiContainer.addChildAt(bonusSpinBoxAnim, 1);
        gameUtils.playSpine(bonusSpinBoxAnim, "spin_Left_static", false);

        baseTransitionAnim = new PIXI.spine.Spine(resLib.spine.transitions.spineData);
        gameUtils.setSpineStyle(baseTransitionAnim, spineStyle['baseTransitionAnim'], 'baseTransitionAnim');
        gr.lib['_baseTransitions'].pixiContainer.addChild(baseTransitionAnim);
        const bgTexture = PIXI.Texture.fromFrame('emotiCover');
        for (let index = 1; index < 17; index++) {
            const bgSprit = new PIXI.Sprite(bgTexture);
            gr.lib['_a_anim_' + index].show(false);
            bonusAnim[(index)] = new PIXI.spine.Spine(resLib.spine.emoti.spineData);
            bonusAnim[(index)].x = 57;
            bonusAnim[(index)].y = 57;
            gr.lib['_a_' + index].pixiContainer.addChild(bgSprit, bonusAnim[(index)]);
            gr.lib['_a_' + index].pixiContainer.children[0].visible = false;
            gr.lib['_a_' + index].pixiContainer.children[1].visible = false;
            gr.lib['_a_' + index].pixiContainer.children[2].visible = false;
        }

        for (let index = 0; index < 13; index++) {
            gr.lib['_priceBonusWin_' + index].show(false);
        }

        buildRells();
        reelContainer.x = 42;
        reelContainer.y = 42;
        let isportrait = SKBeInstant.getGameOrientation() !== "landscape";
        addMask(isportrait);
        gr.lib._emotiBG.pixiContainer.addChildAt(reelContainer, 1);
    }

    function buildRells() {
        for (let i = 0; i < 4; i++) {
            const rc = new PIXI.Container();
            rc.y = i * (REEL_SIZE + REEL_SPACE);
            reelContainer.addChild(rc);
            const reel = {
                container: rc,
                symbols: [],
                position: 0,
                previousPosition: 0,
                blur: new PIXI.filters.BlurFilter(),
                direction: i % 2 === 0 ? 1 : -1
            };
            reel.blur.blurX = 0;
            reel.blur.blurY = 0;
            rc.filters = [reel.blur];

            // Build the symbols bonusAnim
            for (let j = 0; j < 5; j++) {
                const spriteName = initSlotTextures[Math.floor(Math.random() * initSlotTextures.length)];
                const symbol = new PIXI.Sprite(spriteName);
                // Scale the symbol to fit symbol area.
                symbol.x = j * (SYMBOL_SIZE + SYMBOL_SPACE);
                symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
                // symbol.y = Math.round((SYMBOL_SIZE - symbol.height) / 2);
                reel.symbols.push(symbol);
                if (i * 5 + j !== 0 && i * 5 + j !== 9 && i * 5 + j !== 10 && i * 5 + j !== 19) {
                    if (spriteName.textureCacheIds[0].indexOf('.') > -1) { //xxx.png
                        bonusAnimName.push(spriteName.textureCacheIds[1]);
                    } else {
                        bonusAnimName.push(spriteName.textureCacheIds[0]);
                    }
                }
                rc.addChild(symbol);
            }
            reels.push(reel);
        }
    }

    function addMask(isportrait) {
        if(channel === "INT") {
            reelContainer.mask = landscapeMask;    
        }
        else{
            if (isportrait) {
                reelContainer.mask = portraitMask;
            } else {
                reelContainer.mask = landscapeMask;
            }
        }
    }

    function startPlay() {
        if (running) return;
        if (isinit) {
            spinButton.enable(false);
            gr.lib._bonusSpintext.updateCurrentStyle({ '_opacity': '0.3' });
            audio.play('UiSpin', 0);
            audio.play('BonusSpin', 2);
            stopRandomEmoti();
            autoSpinButton.enable(false);
            gr.lib._bonusAutospintext.updateCurrentStyle({ '_opacity': '0.3' });
            spinLeftText--;
            textAnim(gr.lib._bonusSpinleft_text_0, spinLeftText);
        }
        spinIndex++;
        running = true;
        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            const extra = Math.floor(Math.random() * 2);
            const target = r.position + 10 + i * 5 + extra;
            const time = 1500 + i * 600 + extra * 600;
            r.target = target;
            tweenTo(r, 'position', target, time, backout(0.5), null, i === reels.length - 1 ? reelsComplete : null);
        }
    }

    function randomEmoti() {
        for (let i = 1; i < 17; i++) {
            gameUtils.stopSpine(bonusAnim[i], false);
        }
        var tempSet = [...validSet];
        var firstRandom = tempSet[Math.floor((Math.random() * tempSet.length))];
        var typeRandom = Math.floor(Math.random() * 2) + 1;
        gr.lib['_a_' + firstRandom].pixiContainer.children[1].visible = true;
        gr.lib['_a_' + firstRandom].pixiContainer.children[2].visible = true;
        audio.play(colorMap.get(bonusAnimName[firstRandom]), 3);
        gameUtils.playSpine(bonusAnim[firstRandom], bonusAnimName[firstRandom].toLowerCase() + '_Emoti_0' + typeRandom, false, function () {
            gr.lib['_a_' + firstRandom].pixiContainer.children[1].visible = false;
            gr.lib['_a_' + firstRandom].pixiContainer.children[2].visible = false;
        });

    }
    function stopRandomEmoti() {
        if (bonusEmotiAnimTimer) {
            gr.getTimer().clearInterval(bonusEmotiAnimTimer);
        }
        for (let i = 1; i < 17; i++) {
            gameUtils.stopSpine(bonusAnim[i], false);
        }
    }

    function textAnim(sprite, text) {
        Tween.to(sprite, { scale: { x: 1.3, y: 1.3 } }, 150);
        gr.getTimer().setTimeout(function () {
            Tween.to(sprite, { scale: { x: 1, y: 1 } }, 150, {
                _onComplete: function () {
                    sprite.setText(text);
                }
            });
        }, 150);
    }

    function checkBonusWin() {
        let currentData = bonusTicket[spinIndex];
        let kingPostion = [];
        let locking = true;
        let bonusTriggered = false;
        currentData.forEach(function (item, index) {
            item.forEach(function (it, ind) {
                if (it === "King") {
                    kingPostion.push({ 'reel': index, 'symbol': ind });
                }
            });
        });
        if (kingPostion.length <= lastKingPostion) {
            bonusTriggered = false;
        } else {
            bonusTriggered = true;
            spinLeftText = 3;
        }
        let tempText = Number(gr.lib._bonusSpinleft_text_0.getText());
        if (tempText <= Number(spinLeftText)) {
            audio.play('BonusSpinsIncrease', 0);
        } else {
            audio.play('BonusSpinsDecrease', 0);
        }
        if (spinLeftText === 0) {
            gr.lib._bonusSpinbutton.show(false);
            gr.lib._stopButton.show(false);
            gr.lib._bonusAutospinbutton.show(false);
        }
        if(bonusTriggered){
            gameUtils.playSpine(bonusSpinBoxAnim, "spin_left", false, TextAnimationCompleted);
            textAnim(gr.lib._bonusSpinleft_text_0, spinLeftText);
            kingPostion.forEach(function (item, index) {
                let tempNum;
                if (item.reel === 1) {
                    tempNum = 8 - item.symbol;
                } else if (item.reel === 3) {
                    tempNum = 16 - item.symbol;
                } else {
                    tempNum = item.reel * 4 + (item.symbol + 1);
                }
                validSet.delete(tempNum);
                gr.getTimer().setTimeout(function () {
                    if (!gr.lib['_a_' + tempNum].pixiContainer.children[0].visible && locking) {
                        locking = false;
                        audio.play('BonusSymbolHighlight', 3);
                        gr.getTimer().setTimeout(function () {
                            audio.play('BaseSpinStopSymbolBonus', 0);
                        }, 100);
                    }
                    if (!gr.lib['_a_' + tempNum].pixiContainer.children[0].visible) {
                        gr.lib['_a_' + tempNum].pixiContainer.children[0].visible = true;
                        gr.lib['_a_' + tempNum].pixiContainer.children[1].visible = true;
                        gr.lib['_a_' + tempNum].pixiContainer.children[2].visible = true;
                        gameUtils.playSpine(bonusAnim[tempNum], 'bonus_win', true, function () {
                            gr.lib['_a_' + tempNum].pixiContainer.children[1].visible = false;
                            gr.lib['_a_' + tempNum].pixiContainer.children[2].visible = false;
                        });
                        gr.lib['_a_anim_' + tempNum].show(true);
                        gr.lib['_a_anim_' + tempNum].gotoAndPlay('bonus_locking', 0.2, true);
                    }
                }, 500);
            });
            gr.getTimer().setTimeout(function () {
                bonusPaytable(kingPostion.length);
            }, 500);
            lastKingPostion = kingPostion.length;
        }else{
            TextAnimationCompleted();
        }
    }

    function bonusPaytable(num) {
        if (num > 3) {
            for (let index = 0; index < 13; index++) {
                gr.lib['_priceBonusWin_' + index].show(false);
            }
            gr.lib['_priceBonusWin_' + (16 - num)].show(true);
        }
    }

    function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
        const tween = {
            object,
            property,
            propertyBeginValue: object[property],
            target,
            easing,
            time,
            change: onchange,
            complete: oncomplete,
            timeDiff: 0,
        };

        tweening.push(tween);
    }

    function reelsComplete() {
        running = false;
        updateAnimName();
        if (!isinit) {
            isinit = true;
            return;
        }
        checkBonusWin();
    }

    function TextAnimationCompleted(){
        if (spinIndex >= (bonusData.length - 1)) {
            //is last spin, bonus completed.
            stopRandomEmoti();
            gr.getTimer().setTimeout(function () {
                settlementAnim();
            }, 600);
        }else{
            if(isAutoSpin){
                startNextAutoSpin();
            }else{
                bonusEmotiAnimTimer = gr.getTimer().setInterval(function () {
                    randomEmoti();
                }, 2000);
                spinButton.enable(true);
                autoSpinButton.enable(true);
                gr.lib._bonusSpintext.updateCurrentStyle({ '_opacity': '1' });
                gr.lib._bonusAutospintext.updateCurrentStyle({ '_opacity': '1' });
            }
        }
    }

    function startNextAutoSpin(){
        gr.getTimer().setTimeout(function () {
            startPlay();
        }, AutoSpinIntervalBonus);
    }

    function updateAnimName() {
        let tempArr = tempTicketArr[spinIndex];
        bonusAnimName = ['temp'];
        for (let index = 0; index < tempArr.length; index++) {
            bonusAnimName.push(tempArr[index]);
        }
    }

    function settlementAnim() {
        audio.play('BonusMathPlaque', 0);
        gr.lib._win_Text_1.show(true);
        gr.lib._win_Value_1.show(true);
        let tempMoney = prizeTable['L' + lastKingPostion];
        jackpot += tempMoney;
        msgBus.publish('updateWinValue', { value: jackpot });
        gr.lib._win_Value_1.setText(SKBeInstant.formatCurrency(tempMoney).formattedAmount);
        gr.lib._win_Value_2.show(false);
        gr.lib._win_Text_2.show(false);
        gr.lib._winPlaque.show(true);
        gr.getTimer().setTimeout(function () {
            gr.lib._baseTransitions.show(true);
            audio.play('Transitions', 0);
            gameUtils.playSpine(baseTransitionAnim, 'transition_in', false, function () {
                gr.lib._winPlaque.show(false);
                msgBus.publish('startBase', { money: tempMoney });
                stopRandomEmoti();
                gameUtils.playSpine(baseTransitionAnim, 'transition_out', false);
                baseTransitionAnim.state.clearListeners();
            });
        }, 2000);
    }

    // Basic lerp funtion.
    function lerp(a1, a2, t) {
        return a1 * (1 - t) + a2 * t;
    }

    // Backout function from tweenjs.
    // https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
    function backout(amount) {
        // return (t) => (--t * t * ((amount + 1) * t + amount) + 1);

        // amount*=1.525;
        // return function(t) {
        // 	if ((t*=2)<1) return 0.5*(t*t*((amount+1)*t-amount));
        // 	return 0.5*((t-=2)*t*((amount+1)*t+amount)+2);
        // };


        return function (t) {
            if ((t *= 2) < 1) return 0.5 * (t * t * ((amount + 1) * t - amount));
            return 0.5 * ((t -= 2) * t * ((amount + 1) * t + amount) + 2);
        };

        // return function (t) {
        //     return Math.sin(t * Math.PI / 2);
        // };

        // return function(t) {
        // 	return t*t*((amount+1)*t-amount);
        // };
    }



    function onStartUserInteraction(data) {
        var enable = SKBeInstant.config.autoRevealEnabled === false ? false : true;
        if (data.scenario) {
            splitArray = data.scenario.split('|');
            bonusData = splitArray[2].split(',');
            winValue = data.prizeValue;
            for (let i = 0; i < data.prizeTable.length; i++) {
                prizeTable[data.prizeTable[i].description] = Number(data.prizeTable[i].prize);
            }
            if (bonusData && bonusData.length > 1) {
                HandleTicket();
            }
        } else {
            return;
        }
        if (enable) {
            if (data.scenario) {
                gr.lib._bonusAutospinbutton.show(true);
            }
        } else {
            gr.lib._bonusAutospinbutton.show(false);
            gr.lib._bonusAutospintext.updateCurrentStyle({ '_opacity': '0.3' });
        }
    }

    function onReStartUserInteraction(data) {
        onStartUserInteraction(data);
    }

    function onReInitialize() {
        resetAll();
    }

    function fillWords() {
        gr.lib._prizeTitleText_0.setText(loader.i18n.Game['find']);
        gr.lib._prizeTitleText_1.setText(loader.i18n.Game['win']);
        gr.lib._prizeTitleText_0_P.setText(loader.i18n.Game['find']);
        gr.lib._prizeTitleText_1_P.setText(loader.i18n.Game['win']);
        for (let index = 0; index < 13; index++) {
            gr.lib['_findText_' + index].setText(index + 4);
        }
        gr.lib._bonusIcon_text.setText(loader.i18n.Game['BONUS']);
        gr.lib._bonusSpinleft_text_1.setText(loader.i18n.Game['spin_Left']);
        gr.lib._bonusAutospintext.setText(loader.i18n.Game['autospin']);
        gr.lib._stopText.setText(loader.i18n.Game['button_stop']);
        gr.lib._bonusSpintext.setText(loader.i18n.Game['button_spin']);
        gr.lib._bonusSpinleft_text_0.setText(spinLeftText);
        gr.lib._bonusSpinleft_text_1.setText(loader.i18n.Game['endBonus']);
    }

    function setAutoFontFitText() {
        gr.lib._prizeTitleText_0.autoFontFitText = true;
        gr.lib._prizeTitleText_1.autoFontFitText = true;
        gr.lib._prizeTitleText_0_P.autoFontFitText = true;
        gr.lib._prizeTitleText_1_P.autoFontFitText = true;
        for (let index = 0; index < 13; index++) {
            gr.lib['_findText_' + index].autoFontFitText = true;
            gr.lib['_winprizeText_' + index].autoFontFitText = true;
        }
        gr.lib._bonusIcon_text.autoFontFitText = true;
        gr.lib._bonusSpinleft_text_1.autoFontFitText = true;
        gr.lib._bonusAutospintext.autoFontFitText = true;
        gr.lib._stopText.autoFontFitText = true;
        gr.lib._bonusSpintext.autoFontFitText = true;
        gr.lib._bonusSpinleft_text_0.autoFontFitText = true;
        gr.lib._bonusSpinleft_text_1.autoFontFitText = true;
    }


    function onTicketCostChanged(prizePoint) {
        var rc = SKBeInstant.config.gameConfigurationDetails.revealConfigurations;
        let PrizeArr = [];
        rc.forEach(function (item, index) {
            if (item.price === prizePoint) {
                item.prizeTable.forEach(function (items, indexs) {
                    if (items.description.indexOf('L') !== -1) {
                        PrizeArr.push(items.prize);
                    }
                });
            }
        });
        PrizeArr.forEach(function (item, index) {
            gr.lib['_winprizeText_' + index].autoFontFitText = true;
            gr.lib['_winprizeText_' + index].setText(SKBeInstant.formatCurrency(item).formattedAmount);
        });
    }

    function onOrientationChanged(portrait) {
        addMask(portrait);
    }

    function startBonus() {
        validSet = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        bonusEmotiAnimTimer = gr.getTimer().setInterval(function () {
            randomEmoti();
        }, 2000);
        gr.lib._bonusGameSence.show(true);
        gr.lib._buttons.show(false);
    }
    function updateWinValue(data) {
        jackpot = data.value;
    }

    msgBus.subscribe('platformMsg/Kernel/System.Init', onSystemInit);
    msgBus.subscribe('changeBackgroundBGIfPortrait', onOrientationChanged);
    msgBus.subscribe('startBonus', startBonus);
    msgBus.subscribe('updateWinValue', updateWinValue);
    msgBus.subscribe('ticketCostChanged', onTicketCostChanged);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('resetAll', resetAll);
    return {};
});
