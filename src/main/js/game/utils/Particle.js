define([
    'com/pixijs/pixi',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
	"com/pixijs/pixi-particles",
    'skbJet/component/gameMsgBus/GameMsgBus',
    "skbJet/component/gladPixiRenderer/Sprite",
], function(PIXI, gr, pixiParticles, msgBus, Sprite) {
    let renderer = null;
    class Particle{
        constructor(container, art, arts, config, isAnim, animSettings){
            this.container = container;
            this.art = art;
            this.arts = arts;
            this.config = config;
            this.isAnim = isAnim;
            this.animSettings = animSettings;
            this.elapsed = Date.now();
            this.emitter = this.createPixiParticles();
            this.emitter.emit = false;
            this.update = this.update.bind(this);
            this.update();
        }

        createPixiParticles(){
            let emitter;
            let particlesImgArray = [];
            if(this.isAnim && this.animSettings){
                if(this.animSettings.isSingleNumFormat === undefined){this.animSettings.isSingleNumFormat = false;}
                if(this.animSettings.frameRate === undefined){this.animSettings.frameRate = 10;}
                particlesImgArray = Sprite.getSpriteSheetAnimationFrameArray(this.art);
                const _particlesImgArray = particlesImgArray.slice(this.animSettings.startFrame-1, this.animSettings.endFrame);
                emitter = new PIXI.particles.Emitter(this.container, 
                    {
                        framerate: this.animSettings.frameRate,
                        loop: true,
                        textures: _particlesImgArray
                    }, 
                    this.config
                );  
                emitter.particleConstructor = PIXI.particles.AnimatedParticle;
            }
            else{
                for(let j = 0; j < this.arts.length; j++){
                    particlesImgArray.push(PIXI.Texture.fromFrame(this.arts[j])); 
                }            
                emitter = new PIXI.particles.Emitter(this.container, particlesImgArray, this.config); 
            } 
            return emitter;
        }

        update(){
            if(!this.emitter){ return; }
            requestAnimationFrame(this.update);
            var now = Date.now();
            this.emitter.update((now - this.elapsed) * 0.001);
            this.elapsed = now;
            gr.forceRender();
        }

        start() {
            if(!this.emitter){return;}
            this.emitter.emit = true;
        }

        stop() {
            if(!this.emitter){ return; }
            this.emitter.destroy();
            this.emitter.emit = false;
            this.emitter = null;
            //reset SpriteRenderer's batching to fully release particles for GC
            if (renderer.plugins && renderer.plugins.sprite && renderer.plugins.sprite.sprites) {
                renderer.plugins.sprite.sprites.length = 0;
            }
            gr.forceRender();
        }

        stopAndNotDestory(){
            this.emitter.emit = true;
            this.emitter.resetPositionTracking();
            this.emitter.updateOwnerPos(-2000,-2000);
        }
    }

    msgBus.subscribe('SKBeInstant.gameParametersUpdated', function(){
        renderer = gr.getPixiRenderer();
    });

    return Particle;
});