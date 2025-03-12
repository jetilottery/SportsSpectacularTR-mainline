define(function (require) {
    var PIXI = require('com/pixijs/pixi');
    var gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    var currentTextStyle = ({
        fontFamily: 'Oswald',
        fontWeight: "600",
        fill: "#ffffff",
        "dropShadow": true,
        "dropShadowAngle": -3.7,
        "dropShadowBlur": 8,
        "dropShadowColor": "#fdffea",
        "dropShadowDistance": 0,
        padding: 2,
        fontSize: 36,
        strokeThickness: 4,
        "lineJoin": "round",
        stroke: "#5c8674"
    });

    function TextMatchToImage(textContainer, textValue, textStyle, iamgeMap) {
        this.textContainer = textContainer;
        this.textValue = textValue;
        this.iamgeMap = iamgeMap;
        this.textContainer.pixiContainer.removeChildren();
        if (textStyle) {
            currentTextStyle = textStyle;
        }
    }

    function setVerticalCenterTxt(textContainer, textValue) {
        textContainer.setText(textValue);
        var fontSize = parseInt(textContainer._currentStyle._font._size);
        var txtWidth = Number(textContainer.pixiContainer.$text.width);
        var boxWidth = Number(textContainer._currentStyle._width);
        while (txtWidth > boxWidth) {
            fontSize--;
            if (fontSize < 10) {
                break;
            }
            textContainer.updateCurrentStyle({
                '_font': {
                    '_size': fontSize
                }
            });
            txtWidth = Number(textContainer.pixiContainer.$text.width);
        }
        var txtHeight = Number(textContainer.pixiContainer.$text.height);
        var boxHeight = Number(textContainer._currentStyle._height);
        while (txtHeight > boxHeight) {
            fontSize--;
            if (fontSize < 10) {
                break;
            }
            textContainer.updateCurrentStyle({
                '_font': {
                    '_size': fontSize
                }
            });
            txtHeight = Number(textContainer.pixiContainer.$text.height);
        }
    }

    function cutOriginTxt2Array(marketingMsgData) {
        var arr = [ /*{"text":"word"},{"image":"b01"}*/ ];
        var tmpArr = marketingMsgData.split(" "); //the image name must have no space inside, ie "bonusB01", other that "bonus b01"
        var currentMatch = null;
        for (var i = 0; i < tmpArr.length; i++) {
            currentMatch = tmpArr[i].match(/\{\w+\d+\}/);
            if (currentMatch) {
                arr.push({
                    type: 'image',
                    value: currentMatch[0]
                });
                if (currentMatch.input.match(',')){
                    arr.push({
                        type: 'text',
                        value: ','
                    });
                }
            } else {
                arr.push({
                    type: 'text',
                    value: tmpArr[i]
                });
            }
        }
        return arr;
    }

    function groupSprites(msgArray, textContainer, imageMap) {
        var multiLineArray = [ /*[textSprite,imageSprite],[],[]*/ ];
        var tmpX = 0,
            tmpY = 0,
            curLine = [],
            margin = 5;
        for (var i = 0; i < msgArray.length; i++) {
            var curSprite = initialToSprite(msgArray[i], tmpX, tmpY, imageMap);
            curLine.push(msgArray[i]);
            if (i < msgArray.length - 1) {
                tmpX += curSprite.width + margin;
                var nextSpriteWidth = getSpriteWidth(msgArray[i + 1], imageMap);
                if (msgArray[i].value === "{n}" || textContainer._currentStyle._width - tmpX < nextSpriteWidth) {
                    if (msgArray[i].value === "{n}") {
                        msgArray[i].value = "";
                    }
                    if(curLine[0].value!==""){
                        multiLineArray.push(curLine);
                    }
                    curLine = [];
                    tmpX = 0;
                }
            } else {
                multiLineArray.push(curLine);
            }
        }
        return multiLineArray;
    }

    function initialToSprite(item, tmpX, tmpY, imageMap) {
        var curSprite = null;
        if (item.type === "image") {
            var imgName = item.value.match(/\w+/)[0];
            var tmpTexture = PIXI.utils.TextureCache[imageMap[imgName]];
            curSprite = new PIXI.Sprite(tmpTexture);
            var orignRatio = Number(tmpTexture.orig.width) / Number(tmpTexture.orig.height);
            curSprite.height = 40;
            curSprite.width = Math.ceil(curSprite.height * orignRatio);
            //imgWidth = curSprite.width;
            if (currentTextStyle.fontSize > 20) {
                curSprite.y = tmpY;
            } else {
                curSprite.y = tmpY - 10;
            }
        } else {
            curSprite = new PIXI.Text();
            curSprite.text = item.value;
            curSprite.style = currentTextStyle;
            curSprite.y = tmpY;
        }
        curSprite.x = tmpX;
        return curSprite;
    }

    function getSpriteWidth(data, imageMap) {
        var sprite = initialToSprite(data, 0, 0, imageMap);
        return sprite.width;
    }

    function centeredPerLine(multiLineArray, textContainer, imageMap) {
        var tmpX = 0,
            tmpY = 0,
            margin = 5,
            resultArray = [];
        for (var i = 0; i < multiLineArray.length; i++) {
            var curLineArray = multiLineArray[i];
            var contentWidth = 0;
            for (var j = 0; j < curLineArray.length; j++) {
                contentWidth += getSpriteWidth(curLineArray[j], imageMap);
            }
            var totalWidth = contentWidth + margin * curLineArray.length;
            var curLineInitialX = (textContainer._currentStyle._width - totalWidth) / 2;
            tmpX = curLineInitialX;
            for (j = 0; j < curLineArray.length; j++) {
                var curSprite = initialToSprite(curLineArray[j], tmpX, tmpY, imageMap);
                resultArray.push(curSprite);
                tmpX += curSprite.width + margin;
                if (j === curLineArray.length - 1) {
                    if (currentTextStyle.fontSize > 20) {
                        tmpY += 55;
                    } else {
                        tmpY += 29;
                    }
                }
            }
        }
        return resultArray;
    }

    TextMatchToImage.prototype.updateStyle = function () {
        this.textContainer.pixiContainer.removeChildren();
        setVerticalCenterTxt(this.textContainer, this.textValue.replace(/\{\w+\d+\}/g, 'INSS'));
        var msgCutArray = cutOriginTxt2Array(this.textValue);
        var multiLineArray = groupSprites(msgCutArray, this.textContainer, this.iamgeMap);
        var msgSpriteArray = centeredPerLine(multiLineArray, this.textContainer, this.iamgeMap);
        var groupContainer = new PIXI.Container();
        for (var i = 0; i < msgSpriteArray.length; i++) {
            groupContainer.addChild(msgSpriteArray[i]);
        }
        // groupContainer.x = this.textContainer.pixiContainer.x -  groupContainer.width/2 - (this.textContainer._currentStyle._width - groupContainer.width) / 2;
        groupContainer.y = (this.textContainer._currentStyle._height - groupContainer.height) / 2;
        this.textContainer.pixiContainer.addChild(groupContainer);
        if(this.textContainer._currentStyle._height - groupContainer.height < 0){
            this.textContainer.updateCurrentStyle({_transform:{_scale:{_x:this.textContainer._currentStyle._height / groupContainer.height,_y:this.textContainer._currentStyle._height / groupContainer.height}}});
        }  
        this.textContainer.setText('');
        //groupContainer.setTransform((this.textContainer._currentStyle._width - groupContainer.width) / 2, (this.textContainer._currentStyle._height - groupContainer.height) / 2);
        this.textContainer.show(true);
    };

    return TextMatchToImage;
});