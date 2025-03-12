/**
 * @module control some game config
 * @description control the customized data of paytable&help page and other customized config
 */
define({
  paytableHelpPreparedDatas: {
    "imageNames": [{
      "searchRegExp": /{Purple}/g,
      "spriteName": "Purple"
    }, {
      "searchRegExp": /{Pink}/g,
      "spriteName": "Pink"
    }, {
      "searchRegExp": /{Red}/g,
      "spriteName": "Red"
    }, {
      "searchRegExp": /{Yellow}/g,
      "spriteName": "Yellow"
    }, {
      "searchRegExp": /{Green}/g,
      "spriteName": "Green"
    }, {
      "searchRegExp": /{Blue}/g,
      "spriteName": "Blue"
    }, {
      "searchRegExp": /{King}/g,
      "spriteName": "King"
    }, {
      "searchRegExp": /{IW}/g,
      "spriteName": "instant_Win_up_14"
    }]
  },
  backgroundStyle: {
    "splashSize": "100% 100%",
    "gameSize": "100% 100%"
  },
  predefinedStyle: {
    "swirlName": "activityAnim",
    "splashLogoName": "logoLoader",
    landscape: {
      canvas: {
        width: 1440,
        height: 810
      },
      gameLogoDiv: {
        width: 858,
        height: 332,
        y: 300
      },
      progressSwirl: {
        width: 100,
        height: 100,
        animationSpeed: 0.5,
        loop: true,
        y: 600,
        scale: {
          x: 1,
          y: 1
        }
      },
      brandCopyRightDiv: {
        bottom: 20,
        fontSize: 18,
        color: "#70410b",
        fontFamily: '"Arial"'
      },
      progressTextDiv: {
        y: 600,
        style: {
          fontSize: 18,
          fill: "#ffffff",
          fontWeight: 800,
          fontFamily: "Oswald"
        }
      },
      copyRightDiv: {
        bottom: 20,
        fontSize: 20,
        color: "#70410b",
        fontFamily: '"Oswald"'
      }
    },
    portrait: {
      canvas: {
        width: 810,
        height: 1440
      },
      gameLogoDiv: {
        width: 858,
        height: 332,
        y: 600,
        scale: {
          x: 0.74,
          y: 0.74
        }
      },
      progressSwirl: {
        width: 100,
        height: 100,
        animationSpeed: 0.5,
        loop: true,
        y: 900,
        scale: {
          x: 1,
          y: 1
        }
      },
      brandCopyRightDiv: {
        bottom: 20,
        fontSize: 18,
        color: "#70410b",
        fontFamily: '"Arial"'
      },
      progressTextDiv: {
        y: 900,
        style: {
          fontSize: 18,
          fill: "#ffffff",
          fontWeight: 800,
          fontFamily: "Oswald"
        }
      },
      copyRightDiv: {
        bottom: 20,
        fontSize: 20,
        color: "#70410b",
        fontFamily: '"Oswald"'
      }
    },
  },
  spineStyle: {
    wheelFlashAnim: { x: 434.5, y: 220.5, scaleX: 1, scaleY: 1 },
    buyFlashAnim: { x: 113.5, y: 38, scaleX: 1, scaleY: 1 },
    spinBoxAnim_base: { x: 88, y: 88, scaleX: 1, scaleY: 1 },
    spinBoxAnim: { x: 88, y: 88, scaleX: 1, scaleY: 1 },
    RotateLight: { x: 433, y: 221, scaleX: 1, scaleY: 1 },
    wheelEmotiAnim: { x: 55, y: 57, scaleX: 1, scaleY: 1 },
    collect3Anim: { x: 140, y: 200, scaleX: 1, scaleY: 1 },
    props: { x: 126, y: 200, scaleX: 1, scaleY: 1 },
    flyEmotiAnim: { x: 70, y: 170, scaleX: 1, scaleY: 1 },
    freeSpinAnim: { x: 237, y: 237, scaleX: 1, scaleY: 1 },
    expandAnim: { x: 140, y: 140, scaleX: 1, scaleY: 1 },
    leftEmotiAnim: { x: 58, y: 58, scaleX: 1, scaleY: 1 },
    collectAnim: { x: 57, y: 57, scaleX: 1, scaleY: 1 },
    KingCopyAnim: { x: 57, y: 57, scaleX: 1, scaleY: 1 },
    arrowAnims: { x: 45, y: 38.5, scaleX: 1, scaleY: 1 },
    baseBgAnim: { x: 520, y: 560, scaleX: 1, scaleY: 1 },
    logoAnim: { x: 350, y: 50, scaleX: 1, scaleY: 1 },
    bonusAnim: { x: 116, y: 88, scaleX: 1, scaleY: 1 },
    emotia: { x: 0, y: 57, scaleX: 1, scaleY: 1 },
    baseTransitionAnim: { x: 405, y: 405, scaleX: 1, scaleY: 1 },
    winLoopAnim: { x: 400, y: 232.5, scaleX: 1, scaleY: 1 },
  }
});
