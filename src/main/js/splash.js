define([
    'skbJet/componentCRDC/splash/splashLoadController',
    'skbJet/componentCRDC/splash/splashUIController'
], function (splashLoadController, splashUIController) {
    var predefinedData = {
        "swirlName": "activityAnim",
        "splashLogoName": "logoLoader",
        "backgroundSize": "100% 100%",
        landscape: {
            canvas: {
                width: 1440,
                height: 810,
                landscapeMargin: 0
            },
            gameImgDiv: {
                width: 1440,
                height: 810,
                top: 0
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
            progressTextDiv: {
                y: 600,
                style: {
                    fontSize: 18,
                    fill: "#ffffff",
                    fontWeight: 800,
                    fontFamily: "Oswald",
                }
            },
            copyRightDiv: {
                bottom: 20,
                fontSize: 20,
                color: "#ffffff",
                fontFamily: '"Oswald"'
            },
        },
        portrait: {
            canvas: {
                width: 810,
                height: 1440,
                landscapeMargin: 0
            },
            gameImgDiv: {
                width: 810,
                height: 1440,
                top: 0
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
            progressTextDiv: {
                y: 900,
                style: {
                    fontSize: 18,
                    fill: "#ffffff",
                    fontWeight: 800,
                    fontFamily: "Oswald",
                }
            },
            copyRightDiv: {
                bottom: 20,
                fontSize: 20,
                color: "#ffffff",
                fontFamily: '"Oswald"'
            }
        }
        //        }
    };

    var softId = window.location.search.match(/&?softwareid=(\d+.\d+.\d+)?/);
    var showCopyRight = false;
    if (softId) {
        if (softId[1].split('-')[2].charAt(0) !== '0') {
            showCopyRight = true;
        }
    }

    function onLoadDone() {
        splashUIController.onSplashLoadDone();
        window.postMessage('splashLoaded', window.location.origin);
    }

    function init() {
        splashUIController.init({ layoutType: 'IW', predefinedData: predefinedData, showCopyRight: showCopyRight });
        splashLoadController.load(onLoadDone);
    }
    init();
    return {};
});